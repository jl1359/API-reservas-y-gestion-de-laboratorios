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

// Consultar si el usuario actual tiene sancion activa y tiempo restante
router.get('/mi-estado', verificarToken, consultarMiEstadoSancion);

// Historial personal de sanciones recibidas
router.get('/mis-sanciones', verificarToken, listarMisSanciones);

// Listar todas las sanciones institucionales
router.get(
  '/',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  listarTodasLasSanciones
);

// Ejecutar algoritmo de inasistencias y aplicacion de sanciones
router.post(
  '/procesar-inasistencias',
  verificarToken,
  permitirRoles('Admin', 'Responsable de Laboratorio'),
  ejecutarProcesamientoInasistencias
);

// Perdonar o levantar una sancion manualmente
router.put(
  '/:id/perdonar',
  verificarToken,
  esAdmin,
  perdonarSancion
);

// Aplicar sancion disciplinaria manual
router.post(
  '/manual',
  verificarToken,
  esAdmin,
  aplicarSancionManual
);

export default router;
