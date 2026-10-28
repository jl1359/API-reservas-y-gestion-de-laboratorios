import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Limitador de tasa en memoria de alto rendimiento y cero dependencias externas.
 * Protege contra ataques de fuerza bruta, escaneo automatizado y denegacion de servicio (DoS).
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  const ipStore = new Map<string, RateLimitRecord>();

  // Limpieza periodica de memoria para prevenir fugas (memory leaks)
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipStore.entries()) {
      if (now > record.resetTime) {
        ipStore.delete(ip);
      }
    }
  }, 60000);

  // Evitar que el timer impida el cierre limpio del proceso en shutdown
  if (timer.unref) {
    timer.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown') as string;
    const now = Date.now();

    const record = ipStore.get(clientIp);

    if (!record || now > record.resetTime) {
      ipStore.set(clientIp, {
        count: 1,
        resetTime: now + options.windowMs
      });
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', options.max - 1);
      return next();
    }

    if (record.count >= options.max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({
        error: options.message,
        reintentarEnSegundos: retryAfterSeconds
      });
      return;
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - record.count));
    next();
  };
}

// Limitador estricto para autenticacion: maximo 15 intentos por 15 minutos por IP
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Demasiados intentos de acceso desde esta conexion. Por seguridad, espera 15 minutos.'
});

// Limitador general para la API: maximo 300 peticiones por minuto por IP
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Limite de peticiones excedido temporalmente. Reduce la frecuencia de solicitudes.'
});