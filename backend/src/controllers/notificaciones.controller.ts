import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  listarMisNotificacionesService,
  marcarNotificacionLeidaService,
  marcarTodasComoLeidasService,
  emitirNotificacionEstadoReserva
} from '../services/notificaciones.service';

export { emitirNotificacionEstadoReserva };

/**
 * Obtiene el listado de notificaciones del usuario autenticado,
 * junto con el contador de notificaciones pendientes (no leídas).
 */
export const listarMisNotificaciones = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const resultado = await listarMisNotificacionesService(usuarioId);

    return res.status(200).json({
      success: true,
      ...resultado
    });
  } catch (error) {
    console.error('Error al listar notificaciones:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar notificaciones' });
  }
};

/**
 * Marca una notificación específica como leída.
 */
export const marcarNotificacionLeida = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    await marcarNotificacionLeidaService(Number(id), usuarioId);

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
 * Marca todas las notificaciones pendientes del usuario como leídas.
 */
export const marcarTodasComoLeidas = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    await marcarTodasComoLeidasService(usuarioId);

    return res.status(200).json({
      success: true,
      mensaje: 'Todas las notificaciones fueron marcadas como leídas'
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar notificaciones' });
  }
};
