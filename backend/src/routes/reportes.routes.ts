import { Router } from 'express';
import {
  reporteAsistenciasDiarias,
  obtenerMetricasAcademicas,
  exportarCsvMetricasAcademicas
} from '../controllers/reportes.controller';
import { permitirRoles, verificarToken } from '../middlewares/auth.middleware';

const router = Router();

// HU-24: Auditoría general de reservas disponible para Administrador y Responsable de Laboratorio
router.get(
  '/asistencias',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  reporteAsistenciasDiarias
);

// HU-35: Consulta de métricas consolidadas de ocupación para Dashboard e Informes
router.get(
  '/metricas',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  obtenerMetricasAcademicas
);

// HU-35: Exportación directa en CSV compatible con Excel de métricas académicas de ocupación
router.get(
  '/exportar-csv',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  exportarCsvMetricasAcademicas
);

export default router;

