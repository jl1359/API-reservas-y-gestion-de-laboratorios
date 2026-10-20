import { prisma } from '../config/prisma';

// Constante de penalización según HU-30: 24 horas exactas en milisegundos
const DURACION_SANCION_MS = 24 * 60 * 60 * 1000;

// Tiempo de tolerancia de inasistencia (por defecto 15 minutos tras inicio pactado)
const MINUTOS_TOLERANCIA_INASISTENCIA = 15;

export interface EstadoSancionUsuario {
  estaSancionado: boolean;
  sancionActiva?: {
    id: number;
    motivo: string;
    fechaInicio: Date;
    fechaFin: Date;
    horasRestantes: number;
    minutosRestantes: number;
  };
}

/**
 * CRITERIO 3 (HU-30): Bloqueo punitivo de transacciones.
 * Verifica si un usuario cuenta con una sanción activa en la base de datos.
 * Además, actualiza automáticamente las sanciones que ya hayan cumplido sus 24 horas a 'Expirada'.
 */
export const verificarSancionActiva = async (usuarioId: number): Promise<EstadoSancionUsuario> => {
  const ahora = new Date();

  // 0. Auto-procesar inasistencias vencidas para garantizar sanción inmediata
  await procesarInasistenciasPendientes().catch(() => {});

  // 1. Auto-expirar sanciones pasadas que sigan figurando como 'Activa'

  await prisma.sancion.updateMany({
    where: {
      usuarioId,
      estado: 'Activa',
      fechaFin: { lte: ahora }
    },
    data: { estado: 'Expirada' }
  });

  // 2. Buscar si existe alguna sanción vigente (fechaFin > ahora)
  const sancionVigente = await prisma.sancion.findFirst({
    where: {
      usuarioId,
      estado: 'Activa',
      fechaFin: { gt: ahora }
    },
    orderBy: { fechaFin: 'desc' }
  });

  if (!sancionVigente) {
    return { estaSancionado: false };
  }

  const msRestantes = sancionVigente.fechaFin.getTime() - ahora.getTime();
  const horasRestantes = Math.floor(msRestantes / (1000 * 60 * 60));
  const minutosRestantes = Math.ceil((msRestantes % (1000 * 60 * 60)) / (1000 * 60));

  return {
    estaSancionado: true,
    sancionActiva: {
      id: sancionVigente.id,
      motivo: sancionVigente.motivo,
      fechaInicio: sancionVigente.fechaInicio,
      fechaFin: sancionVigente.fechaFin,
      horasRestantes,
      minutosRestantes
    }
  };
};

/**
 * CRITERIO 2 (HU-30): Aplicación de castigo temporal estricto.
 * Aplica una sanción de exactamente 24 horas al usuario de una reserva específica.
 */
export const aplicarSancionPorInasistencia = async (reservaId: number, motivoPersonalizado?: string) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: {
      usuario: { select: { id: true, nombreCompleto: true, correo: true } },
      laboratorio: { select: { nombre: true } }
    }
  });

  if (!reserva || !reserva.usuarioId) {
    throw new Error('Reserva o usuario no encontrado');
  }

  const ahora = new Date();
  const fechaFinCalculada = new Date(ahora.getTime() + DURACION_SANCION_MS);

  const motivoFinal = motivoPersonalizado || 
    `Inasistencia a reserva #${reserva.id} en ${reserva.laboratorio.nombre}: No se registró ingreso (QR) tras finalizar el tiempo de tolerancia (Sanción 24h).`;

  // Marcar reserva como Ausente
  await prisma.reserva.update({
    where: { id: reserva.id },
    data: { estado: 'Ausente' }
  });

  // Inyectar sanción matemática estricta de 24 horas
  const nuevaSancion = await prisma.sancion.create({
    data: {
      usuarioId: reserva.usuarioId,
      reservaId: reserva.id,
      motivo: motivoFinal,
      fechaInicio: ahora,
      fechaFin: fechaFinCalculada,
      estado: 'Activa'
    }
  });

  // Notificar al usuario (creación de notificación interna)
  try {
    await prisma.notificacion.create({
      data: {
        usuarioId: reserva.usuarioId,
        mensaje: `Has recibido una sanción disciplinaria por inasistencia. Tus privilegios de reserva están suspendidos por 24 horas hasta ${fechaFinCalculada.toLocaleString('es-ES')}.`
      }
    });
  } catch (errNotif) {
    console.warn('Advertencia al crear notificación de sanción:', errNotif);
  }

  // Auditoría
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: reserva.usuarioId,
        accion: `Sanción disciplinaria aplicada: 24 horas de suspensión por inasistencia a reserva #${reserva.id}`
      }
    });
  } catch (errAudit) {
    console.warn('Advertencia al registrar auditoría:', errAudit);
  }

  return nuevaSancion;
};

/**
 * CRITERIO 1 (HU-30): Detección de negligencia enlazada.
 * Algoritmo autónomo de detección de inasistencias.
 * Revisa reservas en estado 'Aprobada' cuyo tiempo de tolerancia ya caducó
 * y donde nunca se selló la asistencia (horaAsistencia == null).
 * Las marca como 'Ausente' y emite la sanción de 24 horas al módulo disciplinario.
 */
export const procesarInasistenciasPendientes = async (minutosTolerancia = MINUTOS_TOLERANCIA_INASISTENCIA) => {
  const ahora = new Date();
  const limiteTolerancia = new Date(ahora.getTime() - minutosTolerancia * 60 * 1000);

  // Reservas aprobadas donde la hora de inicio + tolerancia ya quedó atrás y no registraron asistencia
  const reservasIncumplidas = await prisma.reserva.findMany({
    where: {
      estado: 'Aprobada',
      horaAsistencia: null,
      fechaInicio: { lte: limiteTolerancia },
      usuarioId: { not: null }
    },
    include: {
      usuario: { select: { id: true, nombreCompleto: true, correo: true } },
      laboratorio: { select: { id: true, nombre: true } }
    }
  });

  const resultadosProcesados = [];

  for (const reserva of reservasIncumplidas) {
    // Verificar si ya existe una sanción ligada a esta reserva para evitar duplicados
    const sancionPrevia = await prisma.sancion.findFirst({
      where: { reservaId: reserva.id }
    });

    if (!sancionPrevia) {
      const sancion = await aplicarSancionPorInasistencia(reserva.id);
      resultadosProcesados.push({
        reservaId: reserva.id,
        usuario: reserva.usuario?.nombreCompleto,
        sancionId: sancion.id,
        fechaFin: sancion.fechaFin
      });
    } else {
      // Si ya tenía sanción pero no estaba marcada como Ausente, aseguramos el estado
      await prisma.reserva.update({
        where: { id: reserva.id },
        data: { estado: 'Ausente' }
      });
    }
  }

  return {
    totalEvaluadas: reservasIncumplidas.length,
    totalSancionadas: resultadosProcesados.length,
    detalle: resultadosProcesados
  };
};

/**
 * HU-33: Listar todas las sanciones registradas con auto-expiración de registros vencidos.
 */
export const listarTodasLasSancionesService = async (estado?: string) => {
  const ahora = new Date();

  // Auto-expirar sanciones cuya fechaFin ya pasó
  await prisma.sancion.updateMany({
    where: {
      estado: 'Activa',
      fechaFin: { lte: ahora }
    },
    data: { estado: 'Expirada' }
  });

  const where: any = {};
  if (estado && estado !== 'Todas') {
    where.estado = estado;
  }

  return prisma.sancion.findMany({
    where,
    include: {
      usuario: { select: { id: true, nombreCompleto: true, correo: true } },
      reserva: {
        select: {
          id: true,
          fechaInicio: true,
          fechaFin: true,
          laboratorio: { select: { id: true, nombre: true, ubicacion: true } }
        }
      }
    },
    orderBy: { fechaInicio: 'desc' }
  });
};

/**
 * HU-33: Levantar o perdonar manualmente una sanción disciplinaria por parte del Administrador.
 */
export const perdonarSancionService = async (sancionId: number, adminId?: number, motivoPerdon?: string) => {
  const sancion = await prisma.sancion.findUnique({
    where: { id: sancionId },
    include: { usuario: { select: { id: true, nombreCompleto: true, correo: true } } }
  });

  if (!sancion) {
    throw new Error('Sanción no encontrada');
  }

  const justificacion = motivoPerdon || 'Sanción revocada por el Administrador ante justificación válida.';

  const sancionActualizada = await prisma.sancion.update({
    where: { id: sancionId },
    data: { estado: 'Perdonada' }
  });

  // Notificar al usuario afectado
  try {
    await prisma.notificacion.create({
      data: {
        usuarioId: sancion.usuarioId,
        mensaje: `Tu sanción disciplinaria #${sancion.id} ha sido levantada por la Administración. Motivo: "${justificacion}". Tus privilegios para solicitar laboratorios han sido restablecidos.`
      }
    });
  } catch (errNotif) {
    console.warn('Error al notificar levantamiento de sanción:', errNotif);
  }

  // Trazabilidad de Auditoría
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: adminId || null,
        accion: `Sanción #${sancionId} de ${sancion.usuario.nombreCompleto} levantada/perdonada. Motivo: ${justificacion}`
      }
    });
  } catch (errAudit) {
    console.warn('Error al registrar auditoría de sanción perdonada:', errAudit);
  }

  return sancionActualizada;
};

/**
 * HU-33: Aplicar sanción disciplinaria manual por parte del Administrador.
 */
export const aplicarSancionManualService = async (
  usuarioId: number,
  horasDuracion: number,
  motivo: string,
  adminId?: number
) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nombreCompleto: true, correo: true }
  });

  if (!usuario) {
    throw new Error('El usuario especificado no existe');
  }

  const ahora = new Date();
  const fechaFin = new Date(ahora.getTime() + horasDuracion * 60 * 60 * 1000);

  const nuevaSancion = await prisma.sancion.create({
    data: {
      usuarioId,
      reservaId: null,
      motivo: `[Sanción Manual - Admin]: ${motivo}`,
      fechaInicio: ahora,
      fechaFin,
      estado: 'Activa'
    }
  });

  // Notificación institucional
  try {
    await prisma.notificacion.create({
      data: {
        usuarioId,
        mensaje: `Se te ha aplicado una sanción disciplinaria manual por ${horasDuracion} hora(s) hasta ${fechaFin.toLocaleString('es-ES')}. Causa: ${motivo}`
      }
    });
  } catch (e) {}

  // Auditoría
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: adminId || null,
        accion: `Sanción manual de ${horasDuracion}h aplicada al usuario ${usuario.nombreCompleto} (${usuario.correo}). Causa: ${motivo}`
      }
    });
  } catch (e) {}

  return nuevaSancion;
};

