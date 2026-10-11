import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import rolesRoutes from './routes/roles.routes';
import laboratoriosRoutes from './routes/laboratorios.routes';
import carrerasRoutes from './routes/carreras.routes';
import equipamientoRoutes from './routes/equipamiento.routes';
import horariosRoutes from './routes/horarios.routes';
import reservasRoutes from './routes/reservas.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/laboratorios', laboratoriosRoutes);
app.use('/api/carreras', carrerasRoutes);
app.use('/api/laboratorios', horariosRoutes); 
app.use('/api/laboratorios', reservasRoutes);
app.use('/api/equipamientos', equipamientoRoutes);

export default app;
