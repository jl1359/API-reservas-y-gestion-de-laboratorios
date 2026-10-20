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

// HU-04: Consultar mi información de perfil
router.get('/perfil', verificarToken, obtenerMiPerfil);

// HU-04: Actualizar información de perfil personal (cualquier usuario autenticado)
router.put('/perfil', verificarToken, validate(actualizarPerfilSchema), actualizarPerfil);

// HU-05: Historial de sesiones y accesos (Solo Admin)
router.get('/auditoria/sesiones', verificarToken, permitirRoles('Admin'), obtenerHistorialSesiones);

// HU-02 Ampliada: Directorio y gestión de usuarios (Solo Admin)
router.get('/', verificarToken, permitirRoles('Admin'), listarUsuarios);

// HU-02 Ampliada: Cambio y revocación directa de rol (Solo Admin)
router.put('/:id/rol', verificarToken, permitirRoles('Admin'), validate(cambiarRolSchema), cambiarRolUsuario);

// HU-02 Ampliada: Modificar estado de activación de cuenta (Solo Admin)
router.patch('/:id/estado', verificarToken, permitirRoles('Admin'), validate(cambiarEstadoUsuarioSchema), cambiarEstadoUsuario);

export default router;
