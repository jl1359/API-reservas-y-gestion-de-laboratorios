import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  cambiarEstadoOperativoService,
  registrarMantenimientoService,
  listarMantenimientosService,
  eliminarMantenimientoService
} from '../services/laboratorios.service';

/**
 * Cambiar estado operativo rápido de un laboratorio
 * PATCH /api/laboratorios/:id/estado-operativo
 */
export const cambiarEstadoOperativo = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const laboratorioId = Number(req.params.id);
    const operadorId = req.user?.id;
    const { estadoOperativo, motivo } = req.body;

    if (!laboratorioId || isNaN(laboratorioId)) {
      return res.status(400).json({ success: false, error: 'ID de laboratorio inválido' });
    }

    const labActualizado = await cambiarEstadoOperativoService(
      laboratorioId,
      estadoOperativo,
      operadorId,
      motivo
    );

    return res.status(200).json({
      success: true,
      mensaje: `Estado operativo del laboratorio '${labActualizado.nombre}' actualizado a '${estadoOperativo}'`,
      data: labActualizado
    });
  } catch (error: any) {
    console.error('Error al cambiar estado operativo:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error al actualizar estado operativo'
    });
  }
};

/**
 * Registrar reporte de mantenimiento y bloquear calendario
 * POST /api/mantenimientos
 */
export const registrarMantenimiento = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const operadorId = req.user?.id;
    const { laboratorioId, fechaInicio, fechaFin, motivo } = req.body;

    const resultado = await registrarMantenimientoService(
      {
        laboratorioId: Number(laboratorioId),
        fechaInicio,
        fechaFin,
        motivo
      },
      operadorId
    );

    return res.status(201).json({
      success: true,
      mensaje: `Mantenimiento programado exitosamente. Se alertó a ${resultado.reservasAfectadasTotal} reservas coincidentes.`,
      data: resultado.mantenimiento
    });
  } catch (error: any) {
    console.error('Error al registrar mantenimiento:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error al registrar mantenimiento'
    });
  }
};

/**
 * Listar mantenimientos programados
 * GET /api/mantenimientos
 */
export const listarMantenimientos = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { laboratorioId } = req.query;
    const mantenimientos = await listarMantenimientosService(
      laboratorioId ? Number(laboratorioId) : undefined
    );

    return res.status(200).json({
      success: true,
      total: mantenimientos.length,
      data: mantenimientos
    });
  } catch (error: any) {
    console.error('Error al listar mantenimientos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener la lista de mantenimientos'
    });
  }
};

/**
 * Eliminar o liberar un periodo de mantenimiento
 * DELETE /api/mantenimientos/:id
 */
export const eliminarMantenimiento = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const mantenimientoId = Number(req.params.id);
    const operadorId = req.user?.id;

    if (!mantenimientoId || isNaN(mantenimientoId)) {
      return res.status(400).json({ success: false, error: 'ID de mantenimiento inválido' });
    }

    await eliminarMantenimientoService(mantenimientoId, operadorId);

    return res.status(200).json({
      success: true,
      mensaje: 'Mantenimiento eliminado correctamente y agenda liberada'
    });
  } catch (error: any) {
    console.error('Error al eliminar mantenimiento:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error al eliminar mantenimiento'
    });
  }
};