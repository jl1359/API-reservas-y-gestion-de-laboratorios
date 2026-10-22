import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  crearReservaSchema,
  crearReservaIndividualSchema,
  CrearReservaInput
} from '../validators/reserva.validator';
import {
  ReservaServiceError,
  crearReservaIndividualService,
  crearReservaService,
  listarMisReservasService,
  listarTodasLasReservasService,
  listarReservasPendientesService,
  aprobarReservaService,
  rechazarReservaService,
  gestionarReservaService,
  cancelarReservaService,
  cancelarReservaFuerzaMayorService,
  obtenerQrReservaService,
  escanearQrService
} from '../services/reservas.service';

export { crearReservaSchema } from '../validators/reserva.validator';

const handleServiceError = (res: Response, error: any, defaultMsg = 'Error al procesar la reserva') => {
  if (error instanceof ReservaServiceError) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      codigo: error.code,
      error: error.message,
      detalles: error.details
    });
  }

  // Conflicto de exclusión PostgreSQL (solapamiento concurrente)
  if (
    error.message?.includes('23P01') ||
    error.message?.includes('reservas_sin_solapamiento') ||
    error.message === 'CONFLICTO_HORARIO' ||
    error.code === 'P2034'
  ) {
    return res.status(409).json({
      success: false,
      code: 'RESERVA_SOLAPADA',
      error: 'El horario solicitado entra en colisión con otra reserva activa o pendiente en este laboratorio.'
    });
  }

  console.error(`[ReservasController Error]:`, error);
  return res.status(500).json({ success: false, error: error.message || defaultMsg });
};

/**
 * Reserva individual de computadora
 * POST /api/reservas/laboratorio/:id/computadora
 */
export const crearReservaIndividual = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const laboratorioId = Number(req.params.id);
    const usuarioId = req.user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const parseResult = crearReservaIndividualSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Datos inválidos' });
    }

    const { numeroComputadora, fechaInicio, fechaFin, motivo } = parseResult.data;
    const reserva = await crearReservaIndividualService(
      laboratorioId,
      numeroComputadora,
      new Date(fechaInicio),
      new Date(fechaFin),
      motivo || '',
      usuarioId
    );

    return res.status(201).json({
      success: true,
      message: `Reserva de PC-${numeroComputadora} confirmada automáticamente con código QR generado`,
      data: reserva
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al registrar reserva individual');
  }
};

/**
 * Reserva de aula completa y serie semestral recurrente
 * POST /api/reservas
 */
export const crearReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado' });

    const parseResult = crearReservaSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Datos de reserva inválidos',
        issues: parseResult.error.issues
      });
    }

    const resultado = await crearReservaService(parseResult.data, usuarioId, req.user?.rol);

    return res.status(201).json({
      success: true,
      mensaje: parseResult.data.recurrente
        ? `Serie semestral de ${resultado.length} reservas aprobada y confirmada exitosamente. Códigos QR generados.`
        : 'Reserva aprobada y confirmada automáticamente. Tu código QR de ingreso ha sido generado.',
      totalReservas: resultado.length,
      reserva: resultado[0],
      reservas: resultado
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al registrar la reserva');
  }
};

/**
 * Bandeja de reservas pendientes
 * GET /api/reservas/pendientes
 */
export const listarReservasPendientes = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { laboratorioId } = req.query;
    const reservas = await listarReservasPendientesService(
      laboratorioId ? Number(laboratorioId) : undefined
    );

    return res.status(200).json({
      success: true,
      total: reservas.length,
      reservas,
      data: reservas
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al obtener solicitudes pendientes');
  }
};

/**
 * Gestión unificada de reservas (Aprobar / Rechazar)
 * PATCH /api/reservas/:id/gestionar
 */
export const gestionarReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    const { accion, motivoRechazo } = req.body;

    if (!accion || !['Aprobar', 'Rechazar'].includes(accion)) {
      return res.status(400).json({ error: "La acción debe ser 'Aprobar' o 'Rechazar'" });
    }

    const reserva = await gestionarReservaService(id, accion, motivoRechazo);
    return res.json({
      success: true,
      mensaje: accion === 'Aprobar' ? 'Reserva APROBADA exitosamente' : 'Reserva RECHAZADA exitosamente',
      data: reserva
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al gestionar reserva');
  }
};

/**
 * Visualización de código QR para ingreso presencial
 * GET /api/reservas/:id/qr
 */
export const obtenerQrReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    const qrData = await obtenerQrReservaService(id, req.user?.id, req.user?.rol);

    return res.status(200).json({
      success: true,
      mensaje: 'Código QR obtenido exitosamente',
      data: qrData
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al consultar código QR');
  }
};

/**
 * Historial personal de reservas
 * GET /api/reservas/mis-reservas
 */
export const listarMisReservas = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });

    const reservas = await listarMisReservasService(usuarioId);
    return res.status(200).json({
      success: true,
      total: reservas.length,
      data: reservas,
      reservas
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al obtener reservas personales');
  }
};

export const obtenerMisReservas = listarMisReservas;

/**
 * Escaneo y validación presencial de código QR
 * POST /api/reservas/escanear-qr
 */
export const escanearQr = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { tokenQr, forzarValidacionTiempo } = req.body;
    const reserva = await escanearQrService(tokenQr, req.user?.id, forzarValidacionTiempo);

    return res.status(200).json({
      success: true,
      mensaje: 'Acceso Permitido: Ingreso validado y asistencia confirmada exitosamente',
      data: reserva
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al procesar escaneo QR');
  }
};

/**
 * Aprobar formalmente una reserva
 * PATCH /api/reservas/:id/aprobar
 */
export const aprobarReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    const reserva = await aprobarReservaService(id);
    return res.status(200).json({
      success: true,
      mensaje: 'Reserva aprobada exitosamente',
      data: reserva
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al aprobar reserva');
  }
};

/**
 * Rechazar formalmente una reserva
 * PATCH /api/reservas/:id/rechazar
 */
export const rechazarReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    const { motivo } = req.body;
    const reserva = await rechazarReservaService(id, motivo);
    return res.status(200).json({
      success: true,
      mensaje: 'Reserva rechazada exitosamente',
      data: reserva
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al rechazar reserva');
  }
};

/**
 * Listado administrativo de todas las reservas con filtros
 * GET /api/reservas
 */
export const listarTodasLasReservas = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { estado, laboratorioId } = req.query;
    const reservas = await listarTodasLasReservasService({
      estado: estado as string,
      laboratorioId: laboratorioId ? Number(laboratorioId) : undefined
    });

    return res.status(200).json({
      success: true,
      total: reservas.length,
      data: reservas,
      reservas
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al listar reservas');
  }
};

/**
 * Cancelación voluntaria de reserva propia
 * PATCH /api/reservas/:id/cancelar
 */
export const cancelarReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    const { motivo } = req.body;
    const reserva = await cancelarReservaService(id, req.user?.id, req.user?.rol, motivo);
    return res.status(200).json({
      success: true,
      mensaje: 'Reserva cancelada correctamente',
      data: reserva
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al cancelar reserva');
  }
};

/**
 * Cancelación por Fuerza Mayor con notificación urgente obligatoria
 * PUT /api/reservas/:id/cancelar-fuerza-mayor
 */
export const cancelarReservaFuerzaMayor = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    const { motivo } = req.body;
    if (!motivo || typeof motivo !== 'string' || motivo.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Es obligatorio especificar la causa de fuerza mayor (mínimo 5 caracteres)'
      });
    }

    const reserva = await cancelarReservaFuerzaMayorService(id, motivo, req.user?.id);
    return res.status(200).json({
      success: true,
      mensaje: 'Reserva cancelada por fuerza mayor y notificación urgente enviada',
      data: reserva
    });
  } catch (error) {
    return handleServiceError(res, error, 'Error al cancelar por fuerza mayor');
  }
};
