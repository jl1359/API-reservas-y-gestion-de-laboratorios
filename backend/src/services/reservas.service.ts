import crypto from 'crypto';
import { Prisma, Reserva } from '@prisma/client';
import { prisma } from '../config/prisma';
import { emitirNotificacionEstadoReserva } from './notificaciones.service';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export const contarComputadoras = (
  laboratorio: Prisma.LaboratorioGetPayload<{
    include: { equipos: { include: { equipamiento: true } } };
  }>
) => {
  const cantidadRegistrada = laboratorio.equipos
    .filter(({ equipamiento }) => equipamiento.nombre.toLocaleLowerCase().includes('computadora'))
    .reduce((total, equipo) => total + equipo.cantidad, 0);

  return cantidadRegistrada || laboratorio.capacidad;
};

export function validarHorarioOperativo(horarios: any[], inicio: Date, fin: Date) {
  if (!horarios || horarios.length === 0) return { valido: true };

  const diaSemanaLocal = DIAS_SEMANA[inicio.getDay()];
  const diaSemanaUTC = DIAS_SEMANA[inicio.getUTCDay()];

  const horarioDia = horarios.find(h => {
    const d = (h.dia || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const dLocal = diaSemanaLocal.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const dUTC = diaSemanaUTC.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return d === dLocal || d === dUTC;
  });

  if (!horarioDia) {
    return {
      valido: false,
      error: `El laboratorio no abre los días ${diaSemanaLocal}.`
    };
  }

  const apMins = horarioDia.horaApertura.getUTCHours() * 60 + horarioDia.horaApertura.getUTCMinutes();
  const ciMins = horarioDia.horaCierre.getUTCHours() * 60 + horarioDia.horaCierre.getUTCMinutes();

  if (apMins < ciMins) {
    const localIniMins = inicio.getHours() * 60 + inicio.getMinutes();
    const localFinMins = fin.getHours() * 60 + fin.getMinutes();
    const utcIniMins = inicio.getUTCHours() * 60 + inicio.getUTCMinutes();
    const utcFinMins = fin.getUTCHours() * 60 + fin.getUTCMinutes();

    const cumpleLocal = localIniMins >= apMins && localFinMins <= ciMins;
    const cumpleUTC = utcIniMins >= apMins && utcFinMins <= ciMins;

    if (!cumpleLocal && !cumpleUTC) {
      const apStr = `${String(Math.floor(apMins / 60)).padStart(2, '0')}:${String(apMins % 60).padStart(2, '0')}`;
      const ciStr = `${String(Math.floor(ciMins / 60)).padStart(2, '0')}:${String(ciMins % 60).padStart(2, '0')}`;
      return {
        valido: false,
        error: `El horario solicitado está fuera del rango operativo de ${horarioDia.dia} (${apStr} - ${ciStr}).`
      };
    }
  }

  return { valido: true };
}

export const listarMisReservasService = async (usuarioId: number) => {
  const reservas = await prisma.reserva.findMany({
    where: { usuarioId },
    include: {
      laboratorio: {
        select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true, capacidad: true }
      }
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

  if (!reserva) throw new Error('Reserva no encontrada');

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

  if (!reserva) throw new Error('Reserva no encontrada');
  if (reserva.estado !== 'Pendiente') {
    throw new Error(`Solo se pueden rechazar reservas en estado 'Pendiente'. Estado actual: '${reserva.estado}'`);
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

  if (!reserva) throw new Error('Reserva no encontrada');
  if (['Cancelada', 'Ausente', 'Asistió'].includes(reserva.estado)) {
    throw new Error(`No se puede cancelar una reserva que ya está en estado '${reserva.estado}'`);
  }

  const reservaActualizada = await prisma.reserva.update({
    where: { id: reservaId },
    data: {
      estado: 'Cancelada',
      motivo: `Cancelada por fuerza mayor: ${motivo.trim()}`
    },
    include: {
      laboratorio: { select: { id: true, nombre: true } },
      usuario: { select: { id: true, nombreCompleto: true, correo: true } }
    }
  });

  await prisma.auditoria.create({
    data: {
      usuarioId: operadorId || null,
      accion: `Cancelación por Fuerza Mayor (HU-19): Reserva #${reserva.id} (${reserva.laboratorio.nombre}) de ${reserva.usuario?.nombreCompleto || 'Docente'}. Causa: ${motivo.trim()}`
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
