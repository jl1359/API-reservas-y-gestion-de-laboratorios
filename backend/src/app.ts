import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';

/**
 * ARCHIVO: app.ts
 * PROPÓSITO: Configurar la instancia de Express.
 * Aquí se añaden los middlewares globales (CORS, JSON Parser)
 * y se registran las rutas principales de cada módulo.
 */

const app = express();

// Middlewares Globales
app.use(cors()); // Permite que el Frontend (React) se comunique con este Backend
app.use(express.json()); // Permite recibir datos en formato JSON desde Postman o React

// ==========================================
// REGISTRO DE RUTAS MODULARES
// ==========================================
app.use('/api/auth', authRoutes); // Conecta todas las rutas de auth (HU-01)

app.use('/api/roles', require('./routes/roles.routes').default);
app.use('/api/laboratorios', require('./routes/laboratorios.routes').default);

export default app;
