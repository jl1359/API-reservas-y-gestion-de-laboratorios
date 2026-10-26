import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  listarUsuariosService,
  cambiarRolUsuarioService,
  cambiarEstadoUsuarioService,
  obtenerHistorialSesionesYAuditoriaService,
  actualizarPerfilService
} from '../services/usuarios.service';
import { actualizarPerfilSchema } from '../validators/usuario.validator';

/**
 * Listar todos los usuarios del sistema con filtros de carrera y rol
 * GET /api/usuarios
 */
export const listarUsuarios = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { rolId, carreraId, activo, busqueda } = req.query;

    const filtros = {
      rolId: rolId ? Number(rolId) : undefined,
      carreraId: carreraId ? Number(carreraId) : undefined,
      activo: activo !== undefined ? activo === 'true' : undefined,
      busqueda: typeof busqueda === 'string' ? busqueda : undefined
    };

    const usuarios = await listarUsuariosService(filtros);

    return res.status(200).json({
      success: true,
      total: usuarios.length,
      data: usuarios
    });
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al consultar usuarios'
    });
  }
};

/**
 * Asignación y revocación directa de rol
 * PUT /api/usuarios/:id/rol
 */
export const cambiarRolUsuario = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const adminId = req.user?.id;
    const usuarioId = Number(req.params.id);
    const { rolId, motivo } = req.body;

    if (!adminId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    if (!usuarioId || isNaN(usuarioId)) {
      return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
    }

    const usuarioActualizado = await cambiarRolUsuarioService(adminId, usuarioId, Number(rolId), motivo);

    return res.status(200).json({
      success: true,
      mensaje: `Rol asignado correctamente a '${usuarioActualizado.nombreCompleto}'`,
      data: usuarioActualizado
    });
  } catch (error: any) {
    console.error('Error al cambiar rol de usuario:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar el rol del usuario'
    });
  }
};

/**
 * Activar o suspender cuenta de usuario
 * PATCH /api/usuarios/:id/estado
 */
export const cambiarEstadoUsuario = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const adminId = req.user?.id;
    const usuarioId = Number(req.params.id);
    const { activo, motivo } = req.body;

    if (!adminId) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    if (!usuarioId || isNaN(usuarioId)) {
      return res.status(400).json({ success: false, error: 'ID de usuario inválido' });
    }

    const usuarioActualizado = await cambiarEstadoUsuarioService(adminId, usuarioId, Boolean(activo), motivo);

    return res.status(200).json({
      success: true,
      mensaje: `Estado de cuenta de '${usuarioActualizado.nombreCompleto}' modificado a [${activo ? 'Activa' : 'Suspendida'}]`,
      data: usuarioActualizado
    });
  } catch (error: any) {
    console.error('Error al cambiar estado de usuario:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error al modificar estado de la cuenta'
    });
  }
};

/**
 * Ver historial de accesos y auditoría de sesiones
 * GET /api/usuarios/auditoria/sesiones
 */
export const obtenerHistorialSesiones = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const limite = req.query.limite ? Number(req.query.limite) : 100;
    const auditoria = await obtenerHistorialSesionesYAuditoriaService(limite);

    return res.status(200).json({
      success: true,
      total: auditoria.length,
      data: auditoria
    });
  } catch (error: any) {
    console.error('Error al consultar historial de auditoría:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar historial de sesiones'
    });
  }
};

/**
 * Actualizar información de perfil complementaria
 * PUT /api/usuarios/perfil
 */
export const actualizarPerfil = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    const validacion = actualizarPerfilSchema.safeParse(req.body);
    if (!validacion.success) {
      const errorMsg = (validacion.error as any).issues?.[0]?.message || (validacion.error as any).errors?.[0]?.message || 'Datos de actualización inválidos';
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const { nombreCompleto, ci, telefono, carreraId } = validacion.data;
    const perfilActualizado = await actualizarPerfilService(usuarioId, { nombreCompleto, ci, telefono, carreraId });

    return res.status(200).json({
      success: true,
      mensaje: 'Perfil actualizado exitosamente',
      data: perfilActualizado
    });
  } catch (error: any) {
    console.error('Error al actualizar perfil:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar información de perfil'
    });
  }
};

/**
 * Consultar información completa de mi perfil
 * GET /api/usuarios/perfil
 */
export const obtenerMiPerfil = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    const { prisma } = await import('../config/prisma');
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombreCompleto: true,
        correo: true,
        ci: true,
        telefono: true,
        activo: true,
        correoVerificado: true,
        rol: { select: { id: true, nombre: true } },
        carrera: { select: { id: true, nombre: true } }
      }
    });

    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error: any) {
    console.error('Error al consultar perfil:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar perfil' });
  }
};