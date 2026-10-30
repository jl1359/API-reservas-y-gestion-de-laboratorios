import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import webpush, { VAPID_PUBLIC_KEY } from '../config/webpush.config';
import { AuthRequest } from '../middlewares/auth.middleware';

export const obtenerClavePublica = (_req: Request, res: Response) => {
  return res.json({ publicKey: VAPID_PUBLIC_KEY });
};

export const guardarSuscripcion = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Datos de suscripción push incompletos' });
    }

    const suscripcion = await (prisma as any).suscripcionPush.upsert({
      where: { endpoint },
      update: {
        usuarioId,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      create: {
        usuarioId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });

    return res.status(201).json({
      mensaje: 'Dispositivo suscrito a notificaciones push exitosamente',
      suscripcionId: suscripcion.id
    });
  } catch (error: any) {
    console.error('Error al guardar suscripción push:', error);
    return res.status(500).json({ error: 'Error interno al registrar suscripción push' });
  }
};

export const eliminarSuscripcion = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    const { endpoint } = req.body;

    if (!usuarioId || !endpoint) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    await (prisma as any).suscripcionPush.deleteMany({
      where: {
        usuarioId,
        endpoint
      }
    });

    return res.json({ mensaje: 'Suscripción push eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar suscripción push:', error);
    return res.status(500).json({ error: 'Error interno al eliminar suscripción' });
  }
};

export const enviarNotificacionPushPrueba = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const suscripciones = await (prisma as any).suscripcionPush.findMany({
      where: { usuarioId }
    });

    if (suscripciones.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron dispositivos suscritos para este usuario'
      });
    }

    const payload = JSON.stringify({
      title: 'LabReserve - UMSS',
      body: 'Prueba de notificación push en tu celular exitosa.',
      url: '/perfil'
    });

    const envios = suscripciones.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await (prisma as any).suscripcionPush.delete({ where: { id: sub.id } }).catch(() => null);
        }
      }
    });

    await Promise.all(envios);

    return res.json({
      mensaje: 'Notificación push enviada a tus dispositivos',
      totalDispositivos: suscripciones.length
    });
  } catch (error: any) {
    console.error('Error al enviar push de prueba:', error);
    return res.status(500).json({ error: 'Error al enviar notificación push de prueba' });
  }
};
