import express from 'express';
import labsRoutes from './modules/auth/labs/labs.routes';

/**
 * ARCHIVO: app.ts
 * PROPÓSITO: Configurar la instancia de Express.
 * Aquí se añaden los middlewares globales (CORS, JSON Parser)
 * y se registran las rutas principales de cada módulo.
 */

const app = express();

// Middlewares Globales
app.use(express.json());


//MODULO DE APLICACION PRINCIPAL LABS
app.use('/api/labs', labsRoutes);
// Ejemplo de registro de rutas modulares (se implementarán después)
// app.use('/api/auth', authRoutes);
// app.use('/api/classrooms', classroomRoutes);
// app.use('/api/laboratories', labRoutes);
// app.use('/api/reservations', reservationRoutes);

export default app;
