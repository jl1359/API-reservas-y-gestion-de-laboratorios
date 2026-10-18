import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  verificarSancionActiva,
  procesarInasistenciasPendientes,
  aplicarSancionPorInasistencia
} from '../services/sanciones.service';

/**
 * Consulta el estado disciplinario actual del usuario autenticado.
 * Informa si puede reservar o si sus privilegios están suspendidos.
 */
export const consultarMiEstadoSancion = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const estado = await verificarSancionActiva(usuarioId);

    return res.status(200).json({
      success: true,
      data: estado
    });
  } catch (error) {
    console.error('Error al consultar estado de sanción:', error);
    return res.status(500).json({ success: false, error: 'Error al consultar estado de sanción' });
  }
};

/**
 * Lista el historial de sanciones del usuario autenticado.
 */
export const listarMisSanciones = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    // Auto-expirar pasadas antes de listar
    await verificarSancionActiva(usuarioId);

    const sanciones = await prisma.sancion.findMany({
      where: { usuarioId },
      include: {
        reserva: {
          include: {
            laboratorio: { select: { nombre: true, ubicacion: true } }
          }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    });

    return res.status(200).json({
      success: true,
      total: sanciones.length,
      data: sanciones
    });
  } catch (error) {
    console.error('Error al listar mis sanciones:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener historial de sanciones' });
  }
};

/**
 * [ADMIN/RESPONSABLE] Lista todas las sanciones registradas en el sistema.
 */
export const listarTodasLasSanciones = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { estado } = req.query;

    const where: any = {};
    if (estado && typeof estado === 'string') {
      where.estado = estado;
    }

    const sanciones = await prisma.sancion.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombreCompleto: true, correo: true } },
        reserva: {
          select: {
            id: true,
            fechaInicio: true,
            fechaFin: true,
            laboratorio: { select: { nombre: true } }
          }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    });

    return res.status(200).json({
      success: true,
      total: sanciones.length,
      data: sanciones
    });
  } catch (error) {
    console.error('Error al listar todas las sanciones:', error);
    return res.status(500).json({ success: false, error: 'Error al obtener listado de sanciones' });
  }
};

/**
 * [ADMIN/CRON] Dispara el proceso de barrido de inasistencias de la HU-30.
 * Detecta reservas ausentes sin registro de QR y aplica las 24 horas de suspensión.
 */
export const ejecutarProcesamientoInasistencias = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { toleranciaMinutos } = req.body;
    const minutos = toleranciaMinutos ? Number(toleranciaMinutos) : 15;

    const resultado = await procesarInasistenciasPendientes(minutos);

    return res.status(200).json({
      success: true,
      mensaje: `Proceso de inasistencias completado exitosamente. Sanciones generadas: ${resultado.totalSancionadas}`,
      data: resultado
    });
  } catch (error) {
    console.error('Error al procesar inasistencias:', error);
    return res.status(500).json({ success: false, error: 'Error interno al procesar inasistencias' });
  }
};

/**
 * [ADMIN] Levantar o perdonar una sanción activa manualmente si el estudiante justificó su falta.
 */
export const perdonarSancion = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const sancion = await prisma.sancion.findUnique({
      where: { id: Number(id) },
      include: { usuario: { select: { nombreCompleto: true } } }
    });

    if (!sancion) {
      return res.status(404).json({ success: false, error: 'Sanción no encontrada' });
    }

    const sancionActualizada = await prisma.sancion.update({
      where: { id: Number(id) },
      data: { estado: 'Perdonada' }
    });

    try {
      await prisma.auditoria.create({
        data: {
          usuarioId: adminId,
          accion: `Sanción #${id} del usuario ${sancion.usuario.nombreCompleto} levantada manualmente por el Administrador.`
        }
      });
    } catch (e) {}

    return res.status(200).json({
      success: true,
      mensaje: 'Sanción levantada exitosamente. El usuario ya puede reservar de nuevo.',
      data: sancionActualizada
    });
  } catch (error) {
    console.error('Error al perdonar sanción:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar sanción' });
  }
};
