import { Router } from 'express';
import {
  listarUsuarios,
  cambiarRolUsuario,
  cambiarEstadoUsuario,
  obtenerHistorialSesiones,
  actualizarPerfil,
  obtenerMiPerfil
} from '../controllers/usuarios.controller';
import {
  verificarToken,
  permitirRoles
} from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import {
  cambiarRolSchema,
  cambiarEstadoUsuarioSchema,
  actualizarPerfilSchema
} from '../validators/usuario.validator';

const router = Router();

// Consultar mi información de perfil
router.get('/perfil', verificarToken, obtenerMiPerfil);

// Actualizar información de perfil personal (cualquier usuario autenticado)
router.put('/perfil', verificarToken, validate(actualizarPerfilSchema), actualizarPerfil);

// Historial de sesiones y accesos (Solo Admin)
router.get('/auditoria/sesiones', verificarToken, permitirRoles('Admin'), obtenerHistorialSesiones);

// Directorio y gestión de usuarios (Solo Admin)
router.get('/', verificarToken, permitirRoles('Admin'), listarUsuarios);

// Cambio y revocación directa de rol (Solo Admin)
router.put('/:id/rol', verificarToken, permitirRoles('Admin'), validate(cambiarRolSchema), cambiarRolUsuario);

// Modificar estado de activación de cuenta (Solo Admin)
router.patch('/:id/estado', verificarToken, permitirRoles('Admin'), validate(cambiarEstadoUsuarioSchema), cambiarEstadoUsuario);

export default router;