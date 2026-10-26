import express from 'express';
import cors from 'cors';
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

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

export default app;