import { prisma } from '../config/prisma';

export const cambiarEstadoOperativoService = async (
  laboratorioId: number,
  estadoOperativo: 'Activo' | 'Mantenimiento' | 'Inactivo',
  operadorId?: number
) => {
  const lab = await prisma.laboratorio.findUnique({
    where: { id: laboratorioId }
  });

  if (!lab) {
    throw new Error('Laboratorio no encontrado');
  }

  const estadoAnterior = lab.estadoOperativo;

  const labActualizado = await prisma.laboratorio.update({
    where: { id: laboratorioId },
    data: { estadoOperativo },
    include: {
      carrera: { select: { id: true, nombre: true } }
    }
  });

  if (operadorId) {
    await prisma.auditoria.create({
      data: {
        usuarioId: operadorId,
        accion: `Cambio de Estado Operativo (HU-10): Laboratorio '${lab.nombre}' cambiado de [${estadoAnterior}] a [${estadoOperativo}].`
      }
    }).catch(() => null);
  }

  return labActualizado;
};

export const registrarMantenimientoService = async (
  datos: {
    laboratorioId: number;
    fechaInicio: string;
    fechaFin: string;
    motivo: string;
  },
  operadorId?: number
) => {
  const fInicio = new Date(datos.fechaInicio);
  const fFin = new Date(datos.fechaFin);

  if (isNaN(fInicio.getTime()) || isNaN(fFin.getTime())) {
    throw new Error('Las fechas proporcionadas no son válidas');
  }

  if (fInicio >= fFin) {
    throw new Error('La fecha de inicio debe ser estrictamente anterior a la fecha de fin');
  }

  const lab = await prisma.laboratorio.findUnique({
    where: { id: datos.laboratorioId }
  });

  if (!lab) {
    throw new Error('Laboratorio no encontrado');
  }

  // Verificar si hay reservas en ese horario
  const reservasAfectadas = await prisma.reserva.findMany({
    where: {
      laboratorioId: datos.laboratorioId,
      estado: { in: ['Aprobada', 'Pendiente'] },
      fechaInicio: { lt: fFin },
      fechaFin: { gt: fInicio }
    },
    include: {
      usuario: { select: { id: true, nombreCompleto: true, correo: true } }
    }
  });

  // Crear el registro de mantenimiento
  const mantenimiento = await prisma.mantenimiento.create({
    data: {
      laboratorioId: datos.laboratorioId,
      fechaInicio: fInicio,
      fechaFin: fFin,
      motivo: datos.motivo.trim()
    },
    include: {
      laboratorio: { select: { id: true, nombre: true } }
    }
  });

  // Notificar a usuarios de reservas afectadas si las hubiere
  for (const r of reservasAfectadas) {
    if (r.usuarioId) {
      await prisma.notificacion.create({
        data: {
          usuarioId: r.usuarioId,
          mensaje: `Alerta: Tu reserva #${r.id} para el ${lab.nombre} coincide con un periodo de mantenimiento programado (${fInicio.toLocaleDateString('es-ES')} - ${fFin.toLocaleDateString('es-ES')}). Por favor revisa la programación.`
        }
      }).catch(() => null);
    }
  }

  if (operadorId) {
    await prisma.auditoria.create({
      data: {
        usuarioId: operadorId,
        accion: `Programación de Mantenimiento (HU-11): Laboratorio '${lab.nombre}' bloqueado del ${fInicio.toISOString()} al ${fFin.toISOString()}. Motivo: ${datos.motivo.trim()}`
      }
    }).catch(() => null);
  }

  return {
    mantenimiento,
    reservasAfectadasTotal: reservasAfectadas.length
  };
};

export const listarMantenimientosService = async (laboratorioId?: number) => {
  const where: any = {};
  if (laboratorioId) {
    where.laboratorioId = laboratorioId;
  }

  return prisma.mantenimiento.findMany({
    where,
    include: {
      laboratorio: {
        select: { id: true, nombre: true, ubicacion: true, estadoOperativo: true }
      }
    },
    orderBy: { fechaInicio: 'asc' }
  });
};

export const eliminarMantenimientoService = async (
  mantenimientoId: number,
  operadorId?: number
) => {
  const mant = await prisma.mantenimiento.findUnique({
    where: { id: mantenimientoId },
    include: { laboratorio: true }
  });

  if (!mant) {
    throw new Error('Registro de mantenimiento no encontrado');
  }

  await prisma.mantenimiento.delete({
    where: { id: mantenimientoId }
  });

  if (operadorId) {
    await prisma.auditoria.create({
      data: {
        usuarioId: operadorId,
        accion: `Cancelación de Mantenimiento (HU-11): Mantenimiento del laboratorio '${mant.laboratorio.nombre}' programado para ${mant.fechaInicio.toISOString()} ha sido cancelado y liberado.`
      }
    }).catch(() => null);
  }

  return { success: true };
};
