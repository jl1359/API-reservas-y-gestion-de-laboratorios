import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * HU-19: Obtiene el listado de notificaciones del usuario autenticado,
 * junto con el contador de notificaciones pendientes (no leídas).
 */
export const listarMisNotificaciones = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const [notificaciones, noLeidas] = await Promise.all([
      prisma.notificacion.findMany({
        where: { usuarioId },
        orderBy: { fechaCreacion: 'desc' },
        take: 30 // Últimas 30 notificaciones
      }),
      prisma.notificacion.count({
        where: { usuarioId, leido: false }
      })
    ]);

    return res.status(200).json({
      success: true,
      total: notificaciones.length,
      noLeidas,
      notificaciones
    });
  } catch (error) {
    console.error('Error al listar notificaciones:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar notificaciones' });
  }
};

/**
 * HU-19: Marca una notificación específica como leída.
 */
export const marcarNotificacionLeida = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    await prisma.notificacion.updateMany({
      where: {
        id: Number(id),
        usuarioId
      },
      data: { leido: true }
    });

    return res.status(200).json({
      success: true,
      mensaje: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar notificación' });
  }
};

/**
 * HU-19: Marca todas las notificaciones pendientes del usuario como leídas.
 */
export const marcarTodasComoLeidas = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    await prisma.notificacion.updateMany({
      where: {
        usuarioId,
        leido: false
      },
      data: { leido: true }
    });

    return res.status(200).json({
      success: true,
      mensaje: 'Todas las notificaciones fueron marcadas como leídas'
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar notificaciones' });
  }
};

/**
 * Función utilitaria interna para crear una notificación por cambio de estado de reserva.
 */
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
