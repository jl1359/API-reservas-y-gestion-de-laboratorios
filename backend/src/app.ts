import express from 'express';
import cors from 'cors';
import { apiRateLimiter } from './middlewares/rateLimiter';
import authRoutes from './routes/auth.routes';
import rolesRoutes from './routes/roles.routes';
import laboratoriosRoutes from './routes/laboratorios.routes';
import carrerasRoutes from './routes/carreras.routes';
import equipamientoRoutes from './routes/equipamiento.routes';
import horariosRoutes from './routes/horarios.routes';
import reservasRoutes from './routes/reservas.routes';
import reportesRoutes from './routes/reportes.routes';
import feriadosRoutes from './routes/feriados.routes';
import sancionesRoutes from './routes/sanciones.routes';
import notificacionesRoutes from './routes/notificaciones.routes';
import usuariosRoutes from './routes/usuarios.routes';
import mantenimientosRoutes from './routes/mantenimientos.routes';
import pushRoutes from './routes/push.routes';

const app = express();

// Protocolo de seguridad: Ocultar huella de software del servidor
app.disable('x-powered-by');

// Habilitar deteccion de proxy inverso (Render, Vercel, Railway, Nginx, Cloudflare)
app.set('trust proxy', 1);

// Protocolo de seguridad: Redireccion forzada a HTTPS y cabeceras de proteccion
app.use((req, res, next) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (process.env.NODE_ENV === 'production' && !isHttps) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  // Cabeceras HTTP de seguridad (HSTS, Anti-sniffing, Anti-clickjacking, Anti-XSS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const envClientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
  : [];

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...envClientUrls
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

// Control de tamano maximo de carga util para prevenir saturacion de memoria (DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Protocolo de seguridad: Mitigacion de ataques DoS y limitacion de tasa en endpoints API
app.use('/api', apiRateLimiter);

// Endpoint de verificacion de salud y protocolo HTTPS
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/laboratorios', laboratoriosRoutes);
app.use('/api/mantenimientos', mantenimientosRoutes);
app.use('/api/carreras', carrerasRoutes);
app.use('/api/laboratorios', horariosRoutes); 
app.use('/api/equipamientos', equipamientoRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/feriados', feriadosRoutes);
app.use('/api/sanciones', sancionesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/push', pushRoutes);

// Protocolo de resiliencia: Manejador global de errores para evitar caidas del servidor
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error interno capturado por el interceptor de resiliencia:', err?.message || err);
  const statusCode = typeof err.status === 'number' ? err.status : 500;
  const mensaje = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Ocurrio un error interno en el servidor'
    : (err.message || 'Error interno del servidor');

  res.status(statusCode).json({
    success: false,
    error: mensaje
  });
});

export default app;