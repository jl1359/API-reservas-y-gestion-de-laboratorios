import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  verificarSancionActiva,
  procesarInasistenciasPendientes,
  listarTodasLasSancionesService,
  perdonarSancionService,
  aplicarSancionManualService
} from '../services/sanciones.service';
import {
  crearSancionManualSchema,
  perdonarSancionSchema
} from '../validators/sancion.validator';

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
 * [ADMIN/RESPONSABLE] Lista todas las sanciones registradas en el sistema (HU-33).
 */
export const listarTodasLasSanciones = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { estado } = req.query;
    const sanciones = await listarTodasLasSancionesService(typeof estado === 'string' ? estado : undefined);

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
 * [ADMIN] Levantar o perdonar una sanción activa manualmente (HU-33).
 */
export const perdonarSancion = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const parseResult = perdonarSancionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Datos de justificación inválidos'
      });
    }

    const sancionActualizada = await perdonarSancionService(
      Number(id),
      adminId,
      parseResult.data.motivoPerdon
    );

    return res.status(200).json({
      success: true,
      mensaje: 'Sanción disciplinaria levantada exitosamente. El usuario ya puede realizar reservas.',
      data: sancionActualizada
    });
  } catch (error: any) {
    console.error('Error al perdonar sanción:', error);
    return res.status(400).json({ success: false, error: error.message || 'Error al actualizar sanción' });
  }
};

/**
 * [ADMIN] Aplicar sanción disciplinaria manual (HU-33).
 */
export const aplicarSancionManual = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const adminId = req.user?.id;
    const parseResult = crearSancionManualSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.issues[0]?.message || 'Datos de sanción inválidos'
      });
    }

    const { usuarioId, horasDuracion, motivo } = parseResult.data;
    const nuevaSancion = await aplicarSancionManualService(usuarioId, horasDuracion, motivo, adminId);

    return res.status(201).json({
      success: true,
      mensaje: `Sanción disciplinaria de ${horasDuracion} horas aplicada con éxito.`,
      data: nuevaSancion
    });
  } catch (error: any) {
    console.error('Error al aplicar sanción manual:', error);
    return res.status(400).json({ success: false, error: error.message || 'Error al aplicar sanción manual' });
  }
};

