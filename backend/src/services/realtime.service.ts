import crypto from 'crypto';
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

interface SseClient {
  id: string;
  userId: number;
  rol: string;
  res: Response;
}

const clients = new Set<SseClient>();

const esRolPrivilegiado = (rol: string): boolean => {
  const norm = rol.toLowerCase();
  return norm === 'admin' || norm === 'administrador' || norm === 'responsable de laboratorio';
};

export const suscribirClienteRealtime = (req: AuthRequest, res: Response): void => {
  const userId = req.user?.id;
  const rol = req.user?.rol || 'Estudiante';

  if (!userId) {
    res.status(401).json({ error: 'No autorizado para suscripción en tiempo real' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const client: SseClient = {
    id: crypto.randomUUID(),
    userId,
    rol,
    res,
  };
  clients.add(client);

  res.write(
    `event: conectado\ndata: ${JSON.stringify({
      status: 'connected',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAlive);
      clients.delete(client);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(client);
  });
};

export const emitirEventoRealtime = (
  evento: string,
  payload: Record<string, unknown> = {},
  opciones: { publico?: boolean } = {}
): void => {
  if (clients.size === 0) return;

  const cuerpo = JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  });
  const frame = `event: ${evento}\ndata: ${cuerpo}\n\n`;
  const usuarioObjetivoId =
    typeof payload.usuarioId === 'number' ? payload.usuarioId : undefined;

  for (const client of clients) {
    const autorizado =
      opciones.publico === true ||
      esRolPrivilegiado(client.rol) ||
      (usuarioObjetivoId !== undefined && client.userId === usuarioObjetivoId);

    if (!autorizado) continue;

    try {
      client.res.write(frame);
    } catch {
      clients.delete(client);
    }
  }
};

export const obtenerEstadisticasRealtime = () => ({
  clientesConectados: clients.size,
  timestamp: new Date().toISOString(),
});
