import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { emitirNotificacionEstadoReserva } from './notificaciones.service';
import { ReservaServiceError } from '../errors/reserva.error';

export const obtenerQrReservaService = async (id: number, usuarioId?: number, userRol?: string) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: {
      laboratorio: { select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true } },
      usuario: { select: { id: true, nombreCompleto: true, correo: true } }
    }
  });

  if (!reserva) throw new ReservaServiceError(404, 'Reserva no encontrada');

  const rolesAutorizados = ['Admin', 'Administrador', 'Responsable de Laboratorio', 'Auxiliar de Docencia'];
  const esPropietario = reserva.usuarioId === usuarioId;
  const esPersonal = userRol && rolesAutorizados.includes(userRol);

  if (!esPropietario && !esPersonal) {
    throw new ReservaServiceError(403, 'No tienes permisos para consultar el código QR de esta reserva');
  }

  if (reserva.estado !== 'Aprobada') {
    throw new ReservaServiceError(400, `El código QR solo está disponible para reservas en estado 'Aprobada'. Estado actual: '${reserva.estado}'`, 'QR_BLOQUEADO_POR_ESTADO');
  }

  let tokenQr = reserva.tokenQr;
  if (!tokenQr) {
    tokenQr = crypto.randomBytes(32).toString('hex');
    await prisma.reserva.update({
      where: { id: reserva.id },
      data: { tokenQr }
    });
  }

  return {
    reservaId: reserva.id,
    tokenQr,
    estado: reserva.estado,
    fechaInicio: reserva.fechaInicio,
    fechaFin: reserva.fechaFin,
    motivo: reserva.motivo,
    materia: reserva.materia,
    numeroComputadora: reserva.numeroComputadora,
    laboratorio: reserva.laboratorio,
    usuario: reserva.usuario
  };
};

export const escanearQrService = async (tokenQr: string, operadorId?: number, forzarValidacionTiempo?: boolean) => {
  if (!tokenQr || !tokenQr.trim()) {
    throw new ReservaServiceError(400, 'Ingresa un código QR o documento de identidad válido', 'QR_REQUERIDO');
  }

  const tokenLimpio = tokenQr.trim();
  let reserva = await prisma.reserva.findUnique({
    where: { tokenQr: tokenLimpio },
    include: {
      usuario: { select: { id: true, nombreCompleto: true, ci: true, correo: true, rol: { select: { nombre: true } } } },
      laboratorio: { select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true } }
    }
  });

  // Contingencia: Si no coincide por token exacto, verificar si es un ID de reserva (#123 o 123)
  if (!reserva) {
    const posibleId = tokenLimpio.startsWith('#') ? tokenLimpio.substring(1) : tokenLimpio;
    if (/^\d+$/.test(posibleId) && Number(posibleId) < 2147483647) {
      reserva = await prisma.reserva.findUnique({
        where: { id: Number(posibleId) },
        include: {
          usuario: { select: { id: true, nombreCompleto: true, ci: true, correo: true, rol: { select: { nombre: true } } } },
          laboratorio: { select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true } }
        }
      });
    }
  }

  // Contingencia: Verificar si corresponde a la Cedula de Identidad (CI) con reserva aprobada para hoy
  if (!reserva) {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    reserva = await prisma.reserva.findFirst({
      where: {
        usuario: { ci: tokenLimpio },
        fechaInicio: { gte: inicioHoy, lte: finHoy },
        estado: { in: ['Aprobada', 'Asistió'] }
      },
      include: {
        usuario: { select: { id: true, nombreCompleto: true, ci: true, correo: true, rol: { select: { nombre: true } } } },
        laboratorio: { select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true } }
      },
      orderBy: { fechaInicio: 'asc' }
    });
  }

  if (!reserva) {
    throw new ReservaServiceError(404, 'No se encontró ninguna reserva activa con este código o documento de identidad', 'QR_INVALIDO');
  }

  if (reserva.estado === 'Asistió' || reserva.horaAsistencia !== null) {
    throw new ReservaServiceError(400, 'Esta reserva ya tiene registrada su asistencia', 'QR_YA_UTILIZADO', {
      horaAsistenciaRegistrada: reserva.horaAsistencia,
      reservaId: reserva.id,
      usuario: reserva.usuario?.nombreCompleto
    });
  }

  if (reserva.estado === 'Cancelada') {
    throw new ReservaServiceError(400, 'Esta reserva fue cancelada previamente', 'RESERVA_CANCELADA');
  }

  if (reserva.estado === 'Ausente') {
    throw new ReservaServiceError(400, 'La reserva expiró y fue marcada como ausente por inasistencia', 'RESERVA_EXPIRADA_AUSENTE');
  }

  if (reserva.estado !== 'Aprobada') {
    throw new ReservaServiceError(400, `La reserva se encuentra en estado '${reserva.estado}'`, 'RESERVA_NO_APROBADA');
  }

  const ahora = new Date();
  const fechaInicio = new Date(reserva.fechaInicio);
  const fechaFin = new Date(reserva.fechaFin);
  const tiempoMinimoIngreso = new Date(fechaInicio.getTime() - 30 * 60 * 1000);

  if (forzarValidacionTiempo !== false) {
    const horaInicioStr = fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const horaFinStr = fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    if (ahora.getTime() < tiempoMinimoIngreso.getTime()) {
      throw new ReservaServiceError(400, `Aún no es la hora de ingreso para esta reserva. Inicia a las ${horaInicioStr}`, 'HORARIO_ANTICIPADO');
    }
    if (ahora.getTime() > fechaFin.getTime()) {
      throw new ReservaServiceError(400, `El horario de la reserva ya finalizó a las ${horaFinStr}`, 'HORARIO_EXPIRADO');
    }
  }

  const reservaActualizada = await prisma.reserva.update({
    where: { id: reserva.id },
    data: {
      estado: 'Asistió',
      horaAsistencia: new Date()
    },
    include: {
      usuario: { select: { id: true, nombreCompleto: true, ci: true, correo: true } },
      laboratorio: { select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true } }
    }
  });

  await prisma.auditoria.create({
    data: {
      usuarioId: operadorId || null,
      accion: `Validación de ingreso exitosa: Reserva #${reserva.id} (${reserva.laboratorio.nombre}) de ${reserva.usuario?.nombreCompleto || 'Usuario'} (CI: ${reserva.usuario?.ci || 'S/N'})`
    }
  }).catch(() => null);

  if (reservaActualizada.usuarioId) {
    emitirNotificacionEstadoReserva(
      reservaActualizada.usuarioId,
      reservaActualizada.id,
      'Asistió',
      reservaActualizada.laboratorio.nombre
    ).catch(() => {});
  }

  return reservaActualizada;
};

/**
 * Registrar asistencia manual de contingencia
 * Permite que auxiliares o responsables validen el ingreso presencial sin depender de camaras opticas.
 */
export const registrarAsistenciaManualService = async (
  reservaId: number,
  operadorId?: number,
  motivo: string = 'Validacion presencial manual (Sin dispositivo optico)'
) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: {
      usuario: { select: { id: true, nombreCompleto: true, ci: true, correo: true } },
      laboratorio: { select: { id: true, nombre: true, ubicacion: true } }
    }
  });

  if (!reserva) {
    throw new ReservaServiceError(404, 'Reserva no encontrada', 'RESERVA_NO_ENCONTRADA');
  }

  if (reserva.estado === 'Asistió' || reserva.horaAsistencia !== null) {
    throw new ReservaServiceError(400, 'Esta reserva ya tiene asistencia registrada', 'YA_ASISTIO', {
      horaAsistenciaRegistrada: reserva.horaAsistencia,
      reservaId: reserva.id,
      usuario: reserva.usuario?.nombreCompleto
    });
  }

  if (reserva.estado !== 'Aprobada') {
    throw new ReservaServiceError(400, `No se puede validar asistencia a una reserva en estado '${reserva.estado}'`, 'ESTADO_INVALIDO');
  }

  const reservaActualizada = await prisma.reserva.update({
    where: { id: reservaId },
    data: {
      estado: 'Asistió',
      horaAsistencia: new Date()
    },
    include: {
      usuario: { select: { id: true, nombreCompleto: true, ci: true, correo: true } },
      laboratorio: { select: { id: true, nombre: true, ubicacion: true } }
    }
  });

  await prisma.auditoria.create({
    data: {
      usuarioId: operadorId || null,
      accion: `Asistencia presencial manual: Reserva #${reserva.id} (${reserva.laboratorio.nombre}) de ${reserva.usuario?.nombreCompleto || 'Usuario'} (CI: ${reserva.usuario?.ci || 'S/N'}). Motivo: ${motivo}`
    }
  }).catch(() => null);

  if (reservaActualizada.usuarioId) {
    emitirNotificacionEstadoReserva(
      reservaActualizada.usuarioId,
      reservaActualizada.id,
      'Asistió',
      reservaActualizada.laboratorio.nombre
    ).catch(() => {});
  }

  return reservaActualizada;
};

/**
 * Listar reservas del dia o turno actual para el control de asistencia
 */
export const listarReservasTurnoActualService = async (filtros?: {
  laboratorioId?: number;
  q?: string;
  fecha?: string;
}) => {
  const inicioDia = filtros?.fecha ? new Date(filtros.fecha + 'T00:00:00') : new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const finDia = filtros?.fecha ? new Date(filtros.fecha + 'T23:59:59') : new Date();
  finDia.setHours(23, 59, 59, 999);

  const where: any = {
    fechaInicio: { gte: inicioDia, lte: finDia },
    estado: { in: ['Aprobada', 'Asistió', 'Ausente'] }
  };

  if (filtros?.laboratorioId && !isNaN(Number(filtros.laboratorioId))) {
    where.laboratorioId = Number(filtros.laboratorioId);
  }

  if (filtros?.q && filtros.q.trim()) {
    const busqueda = filtros.q.trim();
    const esNumero = /^\d+$/.test(busqueda);

    where.OR = [
      { usuario: { nombreCompleto: { contains: busqueda, mode: 'insensitive' } } },
      { usuario: { ci: { contains: busqueda, mode: 'insensitive' } } },
      { materia: { contains: busqueda, mode: 'insensitive' } }
    ];

    if (esNumero && Number(busqueda) < 2147483647) {
      where.OR.push({ id: Number(busqueda) });
    }
  }

  return prisma.reserva.findMany({
    where,
    include: {
      usuario: {
        select: {
          id: true,
          nombreCompleto: true,
          ci: true,
          correo: true,
          telefono: true,
          rol: { select: { nombre: true } }
        }
      },
      laboratorio: {
        select: {
          id: true,
          nombre: true,
          ubicacion: true,
          reservaPorComputadora: true
        }
      }
    },
    orderBy: { fechaInicio: 'asc' }
  });
};