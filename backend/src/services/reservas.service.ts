import crypto from 'crypto';
import { Prisma, Reserva } from '@prisma/client';
import { prisma } from '../config/prisma';
import { emitirNotificacionEstadoReserva } from './notificaciones.service';
import { verificarSancionActiva } from './sanciones.service';
import { CrearReservaInput } from '../validators/reserva.validator';
import {
  contarComputadoras,
  validarHorarioOperativo
} from '../helpers/horarioOperativo.helper';
import {
  ESTADOS_ACTIVOS,
  generarBloquesReserva,
  validarFeriadosYMantenimientos
} from '../helpers/colisionesReserva.helper';
import { ReservaServiceError } from '../errors/reserva.error';

// Re-exportar helpers y errores para máxima compatibilidad con código existente
export { contarComputadoras, validarHorarioOperativo, ReservaServiceError };
export {
  obtenerQrReservaService,
  escanearQrService,
  registrarAsistenciaManualService,
  listarReservasTurnoActualService
} from './asistencia.service';

/**
 * Reserva individual de computadora por parte de un estudiante
 */
export const crearReservaIndividualService = async (
  laboratorioId: number,
  numeroComputadora: number,
  fechaInicio: Date,
  fechaFin: Date,
  motivo: string,
  usuarioId: number
) => {
  const estadoSancion = await verificarSancionActiva(usuarioId);
  if (estadoSancion.estaSancionado && estadoSancion.sancionActiva) {
    const { horasRestantes, minutosRestantes, fechaFin: fFin, motivo: mot } = estadoSancion.sancionActiva;
    throw new ReservaServiceError(
      403,
      `Tus privilegios de reserva están suspendidos por inasistencia. Podrás reservar en ${horasRestantes}h ${minutosRestantes}m (hasta ${fFin.toLocaleString('es-ES')}).`,
      'PRIVILEGIOS_SUSPENDIDOS_SANCION',
      { motivo: mot, fechaFin: fFin, horasRestantes, minutosRestantes }
    );
  }

  return prisma.$transaction<Reserva>(async (tx) => {
    const laboratorio = await tx.laboratorio.findUnique({
      where: { id: laboratorioId },
      include: { equipos: { include: { equipamiento: true } } },
    });

    if (!laboratorio) throw new ReservaServiceError(404, 'Laboratorio no encontrado');
    if (laboratorio.estadoOperativo !== 'Activo') throw new ReservaServiceError(409, 'El laboratorio no se encuentra operativo');
    if (!laboratorio.reservaPorComputadora) throw new ReservaServiceError(409, 'Este laboratorio no permite reservas por computadora');

    const cantidadComputadoras = contarComputadoras(laboratorio);
    if (numeroComputadora > cantidadComputadoras) {
      throw new ReservaServiceError(400, `La computadora debe estar entre PC-1 y PC-${cantidadComputadoras}`);
    }

    const colision = await tx.reserva.findFirst({
      where: {
        laboratorioId,
        OR: [
          { numeroComputadora },
          { numeroComputadora: null }
        ],
        estado: { in: ESTADOS_ACTIVOS },
        fechaInicio: { lt: fechaFin },
        fechaFin: { gt: fechaInicio },
      },
      select: { id: true, numeroComputadora: true },
    });

    if (colision) {
      if (colision.numeroComputadora === null) {
        throw new ReservaServiceError(409, 'El laboratorio completo se encuentra reservado en ese horario para una clase o actividad académica');
      }
      throw new ReservaServiceError(409, `La computadora PC-${numeroComputadora} ya está reservada en ese horario`);
    }

    const mantenimientoColision = await tx.mantenimiento.findFirst({
      where: {
        laboratorioId,
        fechaInicio: { lt: fechaFin },
        fechaFin: { gt: fechaInicio },
      },
      select: { motivo: true },
    });

    if (mantenimientoColision) {
      throw new ReservaServiceError(409, `El laboratorio se encuentra en mantenimiento en ese horario (${mantenimientoColision.motivo})`);
    }

    const tokenQr = crypto.randomBytes(32).toString('hex');
    return tx.reserva.create({
      data: {
        usuarioId,
        laboratorioId,
        numeroComputadora,
        fechaInicio,
        fechaFin,
        motivo: motivo || null,
        cantidadAlumnos: 1,
        estado: 'Aprobada',
        tokenQr,
      },
    });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
};

/**
 * Reserva de aula completa y serie semestral recurrente
 */
export const crearReservaService = async (
  data: CrearReservaInput,
  usuarioId: number,
  usuarioRol?: string
) => {
  // Resolver el rol en tiempo real directamente desde la base de datos
  const usuarioDb = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { rol: true }
  });

  const rolEfectivo = usuarioDb?.rol?.nombre || usuarioRol || '';

  const rolesPermitidos = ['Docente', 'Auxiliar de Docencia', 'Admin', 'Administrador', 'Responsable de Laboratorio'];
  if (!rolesPermitidos.includes(rolEfectivo)) {
    throw new ReservaServiceError(403, 'Solo el personal docente, auxiliar o administrativo puede solicitar reservas de laboratorio');
  }

  const estadoSancion = await verificarSancionActiva(usuarioId);
  if (estadoSancion.estaSancionado && estadoSancion.sancionActiva) {
    const { horasRestantes, minutosRestantes, fechaFin: fFin, motivo: mot } = estadoSancion.sancionActiva;
    throw new ReservaServiceError(
      403,
      `Tus privilegios de reserva están suspendidos por inasistencia. Podrás reservar en ${horasRestantes}h ${minutosRestantes}m.`,
      'PRIVILEGIOS_SUSPENDIDOS_SANCION',
      { motivo: mot, fechaFin: fFin, horasRestantes, minutosRestantes }
    );
  }

  const inicio = new Date(data.fechaInicio);
  const fin = new Date(data.fechaFin);

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    throw new ReservaServiceError(400, 'Formato de fecha u hora no válido (use formato ISO8601)');
  }
  if (inicio >= fin) {
    throw new ReservaServiceError(400, 'La hora de fin debe ser posterior a la hora de inicio');
  }
  if (inicio <= new Date()) {
    throw new ReservaServiceError(400, 'La reserva debe programarse con fecha y hora futura');
  }

  const laboratorio = await prisma.laboratorio.findUnique({
    where: { id: data.laboratorioId },
    include: { horarios: true }
  });

  if (!laboratorio) throw new ReservaServiceError(404, 'Laboratorio no encontrado');
  if (laboratorio.estadoOperativo !== 'Activo') {
    throw new ReservaServiceError(400, `El laboratorio no se encuentra operativo (Estado: ${laboratorio.estadoOperativo})`);
  }
  if (data.cantidadAlumnos > laboratorio.capacidad) {
    throw new ReservaServiceError(400, `La cantidad de alumnos (${data.cantidadAlumnos}) supera la capacidad máxima (${laboratorio.capacidad})`);
  }

  // Generación y validación modular de bloques (puntual o semestral)
  let bloquesReserva = [];
  try {
    bloquesReserva = generarBloquesReserva(inicio, fin, data.recurrente, data.fechaFinSemestre);
  } catch (err: any) {
    throw new ReservaServiceError(400, err.message);
  }

  try {
    await validarFeriadosYMantenimientos(bloquesReserva, data.laboratorioId, laboratorio.horarios);
  } catch (err: any) {
    throw new ReservaServiceError(err.status || 400, err.message, err.code);
  }

  // Transacción serializable protegida contra solapamientos
  return prisma.$transaction(async (tx) => {
    const reservasCreadas = [];
    const serieId = data.recurrente ? `SERIE-${Date.now()}` : undefined;

    for (const bloque of bloquesReserva) {
      const conflicto = await tx.reserva.findFirst({
        where: {
          laboratorioId: data.laboratorioId,
          numeroComputadora: data.numeroComputadora ? data.numeroComputadora : null,
          estado: { in: ESTADOS_ACTIVOS },
          fechaInicio: { lt: bloque.fin },
          fechaFin: { gt: bloque.inicio }
        }
      });

      if (conflicto) throw new Error('CONFLICTO_HORARIO');

      const tokenQr = crypto.randomBytes(32).toString('hex');
      const nueva = await tx.reserva.create({
        data: {
          usuarioId,
          laboratorioId: data.laboratorioId,
          fechaInicio: bloque.inicio,
          fechaFin: bloque.fin,
          materia: data.materia.trim(),
          cantidadAlumnos: data.cantidadAlumnos,
          numeroComputadora: data.numeroComputadora || null,
          motivo: data.recurrente ? `[Serie: ${serieId}] ${data.motivo ? data.motivo.trim() : ''}`.trim() : (data.motivo ? data.motivo.trim() : null),
          estado: 'Aprobada',
          tokenQr
        }
      });

      reservasCreadas.push(nueva);
    }

    await tx.notificacion.create({
      data: {
        usuarioId,
        mensaje: data.recurrente
          ? `Tu serie semestral de ${reservasCreadas.length} reservas para ${laboratorio.nombre} (${data.materia}) fue aprobada y confirmada automáticamente. Tus códigos QR de ingreso están disponibles en tu perfil.`
          : `Tu reserva para ${laboratorio.nombre} (${data.materia}) fue aprobada y confirmada automáticamente. Tu código QR de ingreso ya está disponible en tu perfil.`
      }
    }).catch(() => null);

    return reservasCreadas;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
  });
};

export const listarMisReservasService = async (usuarioId: number) => {
  const reservas = await prisma.reserva.findMany({
    where: { usuarioId },
    include: {
      laboratorio: { select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true, capacidad: true } }
    },
    orderBy: { fechaInicio: 'desc' }
  });

  return Promise.all(
    reservas.map(async (r) => {
      let tokenQr = null;
      if (r.estado === 'Aprobada') {
        if (!r.tokenQr) {
          tokenQr = crypto.randomBytes(32).toString('hex');
          await prisma.reserva.update({
            where: { id: r.id },
            data: { tokenQr }
          });
        } else {
          tokenQr = r.tokenQr;
        }
      }

      return {
        id: r.id,
        fechaInicio: r.fechaInicio,
        fechaFin: r.fechaFin,
        motivo: r.motivo,
        materia: r.materia,
        numeroComputadora: r.numeroComputadora,
        estado: r.estado,
        horaAsistencia: r.horaAsistencia,
        laboratorio: r.laboratorio,
        tokenQr
      };
    })
  );
};

export const listarTodasLasReservasService = async (filtros?: { estado?: string; laboratorioId?: number }) => {
  const where: any = {};
  if (filtros?.estado && typeof filtros.estado === 'string') {
    where.estado = filtros.estado;
  }
  if (filtros?.laboratorioId && !isNaN(Number(filtros.laboratorioId))) {
    where.laboratorioId = Number(filtros.laboratorioId);
  }

  return prisma.reserva.findMany({
    where,
    include: {
      usuario: { select: { id: true, nombreCompleto: true, correo: true } },
      laboratorio: { select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true, capacidad: true } }
    },
    orderBy: { fechaInicio: 'desc' }
  });
};

export const listarReservasPendientesService = async (laboratorioId?: number) => {
  const whereClause: any = { estado: 'Pendiente' };
  if (laboratorioId && Number.isInteger(Number(laboratorioId))) {
    whereClause.laboratorioId = Number(laboratorioId);
  }

  return prisma.reserva.findMany({
    where: whereClause,
    include: {
      usuario: {
        select: {
          id: true,
          nombreCompleto: true,
          correo: true,
          rol: { select: { nombre: true } }
        }
      },
      laboratorio: {
        select: {
          id: true,
          nombre: true,
          capacidad: true,
          ubicacion: true
        }
      }
    },
    orderBy: { fechaInicio: 'asc' }
  });
};

export const aprobarReservaService = async (reservaId: number) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { laboratorio: true }
  });

  if (!reserva) throw new ReservaServiceError(404, 'Reserva no encontrada');

  const tokenQr = crypto.randomBytes(32).toString('hex');
  const reservaAprobada = await prisma.reserva.update({
    where: { id: reservaId },
    data: {
      estado: 'Aprobada',
      tokenQr
    },
    include: {
      laboratorio: true,
      usuario: { select: { nombreCompleto: true, correo: true } }
    }
  });

  if (reservaAprobada.usuarioId && reservaAprobada.laboratorio) {
    emitirNotificacionEstadoReserva(
      reservaAprobada.usuarioId,
      reservaAprobada.id,
      'Aprobada',
      reservaAprobada.laboratorio.nombre
    ).catch(() => {});
  }

  return reservaAprobada;
};

export const rechazarReservaService = async (reservaId: number, motivo?: string) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { laboratorio: { select: { nombre: true } } }
  });

  if (!reserva) throw new ReservaServiceError(404, 'Reserva no encontrada');
  if (reserva.estado !== 'Pendiente') {
    throw new ReservaServiceError(400, `Solo se pueden rechazar reservas en estado 'Pendiente'. Estado actual: '${reserva.estado}'`);
  }

  const reservaRechazada = await prisma.reserva.update({
    where: { id: reservaId },
    data: {
      estado: 'Rechazada',
      motivo: motivo ? `Rechazado: ${motivo.trim()}` : reserva.motivo
    },
    include: {
      laboratorio: true,
      usuario: { select: { nombreCompleto: true, correo: true } }
    }
  });

  if (reserva.usuarioId && reserva.laboratorio) {
    emitirNotificacionEstadoReserva(
      reserva.usuarioId,
      reserva.id,
      'Rechazada',
      reserva.laboratorio.nombre,
      motivo || 'Sin motivo especificado'
    ).catch(() => {});
  }

  return reservaRechazada;
};

export const gestionarReservaService = async (id: number, accion: 'Aprobar' | 'Rechazar', motivoRechazo?: string) => {
  if (accion === 'Aprobar') {
    return aprobarReservaService(id);
  }
  return rechazarReservaService(id, motivoRechazo);
};

export const cancelarReservaService = async (id: number, usuarioId?: number, rol?: string, motivo?: string) => {
  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) throw new ReservaServiceError(404, 'Reserva no encontrada');

  const esPropietario = reserva.usuarioId === usuarioId;
  const esAdmin = rol === 'Admin' || rol === 'Administrador' || rol === 'Responsable de Laboratorio';

  if (!esPropietario && !esAdmin) {
    throw new ReservaServiceError(403, 'No tienes permiso para cancelar esta reserva');
  }

  if (['Cancelada', 'Ausente', 'Asistió'].includes(reserva.estado)) {
    throw new ReservaServiceError(400, `No se puede cancelar una reserva que ya está en estado '${reserva.estado}'`);
  }

  const motivoLimpio = motivo && typeof motivo === 'string' && motivo.trim() !== ''
    ? motivo.trim()
    : 'Cancelación voluntaria por el titular de la reserva';

  const reservaActualizada = await prisma.reserva.update({
    where: { id },
    data: { 
      estado: 'Cancelada',
      motivo: `Cancelada: ${motivoLimpio}`
    },
    include: { laboratorio: { select: { nombre: true } } }
  });

  await prisma.auditoria.create({
    data: {
      usuarioId: usuarioId || null,
      accion: `Cancelación Voluntaria: Reserva #${id} (${reservaActualizada.laboratorio.nombre}). Motivo: ${motivoLimpio}`
    }
  }).catch(() => null);

  if (reservaActualizada.usuarioId) {
    emitirNotificacionEstadoReserva(
      reservaActualizada.usuarioId,
      reservaActualizada.id,
      'Cancelada',
      reservaActualizada.laboratorio.nombre
    ).catch(() => {});
  }

  return reservaActualizada;
};

export const cancelarReservaFuerzaMayorService = async (
  reservaId: number,
  motivo: string,
  operadorId?: number
) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: {
      laboratorio: { select: { id: true, nombre: true } },
      usuario: { select: { id: true, nombreCompleto: true, correo: true } }
    }
  });

  if (!reserva) throw new ReservaServiceError(404, 'Reserva no encontrada');
  if (['Cancelada', 'Ausente', 'Asistió'].includes(reserva.estado)) {
    throw new ReservaServiceError(400, `No se puede cancelar una reserva que ya está en estado '${reserva.estado}'`);
  }

  const reservaActualizada = await prisma.reserva.update({
    where: { id: reservaId },
    data: { estado: 'Cancelada', motivo: `Cancelada por fuerza mayor: ${motivo.trim()}` },
    include: {
      laboratorio: { select: { id: true, nombre: true } },
      usuario: { select: { id: true, nombreCompleto: true, correo: true } }
    }
  });

  await prisma.auditoria.create({
    data: {
      usuarioId: operadorId || null,
      accion: `Cancelación por Fuerza Mayor: Reserva #${reserva.id} (${reserva.laboratorio.nombre}) de ${reserva.usuario?.nombreCompleto || 'Docente'}. Causa: ${motivo.trim()}`
    }
  }).catch(() => null);

  if (reserva.usuarioId) {
    await prisma.notificacion.create({
      data: {
        usuarioId: reserva.usuarioId,
        mensaje: `AVISO IMPORTANTE: Tu reserva #${reserva.id} para el ${reserva.laboratorio.nombre} ha sido cancelada por razones de fuerza mayor universitaria. Motivo: ${motivo.trim()}`
      }
    }).catch(() => null);
  }

  return reservaActualizada;
};