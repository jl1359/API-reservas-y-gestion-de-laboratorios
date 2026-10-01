import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import laboratoriosRoutes from './modules/laboratorios/laboratorios.routes';

/**
 * ARCHIVO: app.ts
 * PROPÓSITO: Configurar la aplicación de Express.
 * Aquí se registran los middlewares y las rutas principales.
 */

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/roles', require('./modules/roles/roles.routes').default);
app.use('/api/laboratorios', laboratoriosRoutes);

export default app;