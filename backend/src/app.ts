import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import rolesRoutes from './routes/roles.routes';
import laboratoriosRoutes from './routes/laboratorios.routes';
import equipamientoRoutes from './routes/equipamiento.routes';
import horariosRoutes from './routes/horarios.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/laboratorios', laboratoriosRoutes);
app.use('/api/laboratorios', horariosRoutes); 
app.use('/api/equipamientos', equipamientoRoutes);

// Manejador global de errores (debe ir al final de las rutas)
app.use(errorHandler);

export default app;