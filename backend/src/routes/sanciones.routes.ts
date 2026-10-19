import { Router } from 'express';
import {
  consultarMiEstadoSancion,
  listarMisSanciones,
  listarTodasLasSanciones,
  ejecutarProcesamientoInasistencias,
  perdonarSancion,
  aplicarSancionManual
} from '../controllers/sanciones.controller';
import { verificarToken, permitirRoles, esAdmin } from '../middlewares/auth.middleware';

const router = Router();

// =========================================================================
// RUTAS DE CONSULTA PERSONAL
// =========================================================================
// Consultar si el usuario actual tiene sanción activa y cuánto tiempo le resta
router.get('/mi-estado', verificarToken, consultarMiEstadoSancion);

// Historial personal de sanciones recibidas
router.get('/mis-sanciones', verificarToken, listarMisSanciones);

// =========================================================================
// RUTAS DE GESTIÓN ADMINISTRATIVA (HU-30 y HU-33)
// =========================================================================
// Listar todas las sanciones institucionales
router.get(
  '/',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  listarTodasLasSanciones
);

// Ejecutar el algoritmo autónomo de inasistencias y aplicación estricta de sanciones de 24h
router.post(
  '/procesar-inasistencias',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  ejecutarProcesamientoInasistencias
);

// Perdonar o levantar una sanción manualmente (HU-33)
router.put(
  '/:id/perdonar',
  verificarToken,
  esAdmin,
  perdonarSancion
);

// Aplicar sanción disciplinaria manual (HU-33)
router.post(
  '/manual',
  verificarToken,
  esAdmin,
  aplicarSancionManual
);

export default router;

