import { prisma } from '../config/prisma';

export const listarMisNotificacionesService = async (usuarioId: number) => {
  const [notificaciones, noLeidas] = await Promise.all([
    prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { fechaCreacion: 'desc' },
      take: 30
    }),
    prisma.notificacion.count({
      where: { usuarioId, leido: false }
    })
  ]);

  return {
    total: notificaciones.length,
    noLeidas,
    notificaciones
  };
};

export const marcarNotificacionLeidaService = async (id: number, usuarioId: number) => {
  return prisma.notificacion.updateMany({
    where: {
      id,
      usuarioId
    },
    data: { leido: true }
  });
};

export const marcarTodasComoLeidasService = async (usuarioId: number) => {
  return prisma.notificacion.updateMany({
    where: {
      usuarioId,
      leido: false
    },
    data: { leido: true }
  });
};

export const emitirNotificacionEstadoReserva = async (
  usuarioId: number,
  reservaId: number,
  nuevoEstado: string,
  laboratorioNombre: string,
  detalleExtra?: string
) => {
  try {
    let mensaje = '';
    switch (nuevoEstado) {
      case 'Aprobada':
        mensaje = `Tu solicitud de reserva #${reservaId} para el ${laboratorioNombre} ha sido Aprobada. Tu código QR de ingreso ya está disponible en tu perfil.`;
        break;
      case 'Rechazada':
        mensaje = `Tu solicitud de reserva #${reservaId} para el ${laboratorioNombre} fue Rechazada.${detalleExtra ? ` Motivo: ${detalleExtra}` : ''}`;
        break;
      case 'Cancelada':
        mensaje = `La reserva #${reservaId} para el ${laboratorioNombre} ha sido Cancelada.`;
        break;
      case 'Asistió':
        mensaje = `Asistencia confirmada: Se ha validado exitosamente tu ingreso al ${laboratorioNombre}.`;
        break;
      case 'Ausente':
        mensaje = `Alerta de inasistencia: Tu reserva #${reservaId} en ${laboratorioNombre} fue marcada como Ausente tras finalizar el tiempo de tolerancia.`;
        break;

      default:
        mensaje = `Tu reserva #${reservaId} para el ${laboratorioNombre} cambió a estado '${nuevoEstado}'.`;
    }

    await prisma.notificacion.create({
      data: {
        usuarioId,
        mensaje
      }
    });
  } catch (error) {
    console.warn('Advertencia al emitir notificación de cambio de estado:', error);
  }
};
