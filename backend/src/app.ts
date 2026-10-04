import express from 'express';
import cors from 'cors';
import laboratorioRoutes from './modules/laboratorios/laboratorio.routes';

/**
 * ARCHIVO: app.ts
 * PROPÓSITO: Configurar la instancia de Express.
 * Aquí se añaden los middlewares globales (CORS, JSON Parser)
 * y se registran las rutas principales de cada módulo.
 */

const app = express();

// Middlewares Globales
app.use(cors());
app.use(express.json());

// Ejemplo de registro de rutas modulares (se implementarán después)
// app.use('/api/auth', authRoutes);
// app.use('/api/classrooms', classroomRoutes);
// app.use('/api/laboratories', labRoutes);
// app.use('/api/reservations', reservationRoutes);
// ==========================================
// REGISTRO DE RUTAS MODULARES
// ==========================================
app.use('/api/laboratorios', laboratorioRoutes);

export default app;
