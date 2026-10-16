import { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// =========================================================================
// HU-22: VER CÓDIGO QR DE RESERVA APROBADA
// =========================================================================

/**
 * Obtiene o genera el token criptográfico del código QR para una reserva aprobada.
 * Si la reserva no está en estado "Aprobada", se deniega el acceso al QR (AC3).
 */
export const obtenerQrReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const usuarioId = req.user?.id;
    const userRol = req.user?.rol;

    const reserva = await prisma.reserva.findUnique({
      where: { id: Number(id) },
      include: {
        laboratorio: {
          select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true }
        },
        usuario: {
          select: { id: true, nombreCompleto: true, correo: true }
        }
      }
    });

    if (!reserva) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    // Validación de autorización: El dueño o personal administrativo/auxiliar
    const rolesAutorizados = ['Admin', 'Responsable de Laboratorio', 'Auxiliar de Docencia'];
    const esPropietario = reserva.usuarioId === usuarioId;
    const esPersonal = userRol && rolesAutorizados.includes(userRol);

    if (!esPropietario && !esPersonal) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado: No tienes permisos para consultar el código QR de esta reserva'
      });
    }

    // CRITERIO AC3: Ocultamiento condicional por seguridad
    if (reserva.estado !== 'Aprobada') {
      return res.status(400).json({
        success: false,
        codigo: 'QR_BLOQUEADO_POR_ESTADO',
        error: `El código QR solo está disponible para reservas en estado 'Aprobada'. Estado actual: '${reserva.estado}'`
      });
    }

    // CRITERIO AC1: Generación de token encriptado si no existe aún
    let tokenQr = reserva.tokenQr;
    if (!tokenQr) {
      tokenQr = crypto.randomBytes(32).toString('hex');
      await prisma.reserva.update({
        where: { id: reserva.id },
        data: { tokenQr }
      });
    }

    return res.status(200).json({
      success: true,
      mensaje: 'Código QR obtenido exitosamente',
      data: {
        reservaId: reserva.id,
        tokenQr,
        estado: reserva.estado,
        fechaInicio: reserva.fechaInicio,
        fechaFin: reserva.fechaFin,
        motivo: reserva.motivo,
        materia: reserva.materia,
        numeroComputadora: reserva.numeroComputadora,
        laboratorio: {
          id: reserva.laboratorio.id,
          nombre: reserva.laboratorio.nombre,
          ubicacion: reserva.laboratorio.ubicacion,
          reservaPorComputadora: reserva.laboratorio.reservaPorComputadora
        },
        usuario: reserva.usuario
      }
    });

  } catch (error) {
    console.error('Error al obtener código QR:', error);
    return res.status(500).json({ success: false, error: 'Error interno al consultar el código QR' });
  }
};

/**
 * Lista las reservas personales del usuario autenticado.
 * Solo incluye el token QR si la reserva está "Aprobada" (HU-22).
 */
export const listarMisReservas = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const reservas = await prisma.reserva.findMany({
      where: { usuarioId },
      include: {
        laboratorio: {
          select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    });

    // Mapeo seguro: sólo revelar/asegurar tokenQr si la reserva está Aprobada
    const reservasConQrSeguro = await Promise.all(
      reservas.map(async (r) => {
        let tokenQr = null;
        if (r.estado === 'Aprobada') {
          if (!r.tokenQr) {
            tokenQr = crypto.randomBytes(32).toString('hex');
            await prisma.reserva.update({
              where: { id: r.id },
              data: { tokenQr }
            });
          } else {
            tokenQr = r.tokenQr;
          }
        }

        return {
          id: r.id,
          fechaInicio: r.fechaInicio,
          fechaFin: r.fechaFin,
          motivo: r.motivo,
          materia: r.materia,
          numeroComputadora: r.numeroComputadora,
          estado: r.estado,
          horaAsistencia: r.horaAsistencia,
          laboratorio: r.laboratorio,
          tokenQr // Oculto (null) si no está Aprobada
        };
      })
    );

    return res.status(200).json({
      success: true,
      total: reservasConQrSeguro.length,
      reservas: reservasConQrSeguro
    });

  } catch (error) {
    console.error('Error al listar mis reservas:', error);
    return res.status(500).json({ success: false, error: 'Error interno al obtener reservas personales' });
  }
};

// =========================================================================
// HU-23: ESCANEAR CÓDIGO QR DE RESERVA
// =========================================================================

/**
 * Escanea y valida el token criptográfico del código QR de una reserva.
 * Verifica autenticidad, estado, no repetición y rango temporal de la reserva.
 * Si es válida, marca asistencia física y sella la hora exacta.
 */
export const escanearQr = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { tokenQr, forzarValidacionTiempo } = req.body;
    const operadorId = req.user?.id;

    if (!tokenQr || typeof tokenQr !== 'string' || !tokenQr.trim()) {
      return res.status(400).json({
        success: false,
        codigo: 'QR_REQUERIDO',
        error: 'Acceso Denegado: Se requiere un token de código QR válido'
      });
    }

    const tokenLimpio = tokenQr.trim();

    // 1. Buscar reserva por el token único criptográfico
    const reserva = await prisma.reserva.findUnique({
      where: { tokenQr: tokenLimpio },
      include: {
        usuario: {
          select: { id: true, nombreCompleto: true, correo: true, rol: { select: { nombre: true } } }
        },
        laboratorio: {
          select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true }
        }
      }
    });

    // CRITERIO AC3: Detección de falsificaciones o token desconocido
    if (!reserva) {
      return res.status(404).json({
        success: false,
        codigo: 'QR_INVALIDO',
        error: 'Acceso Denegado / QR Inválido: El código QR no corresponde a ninguna reserva registrada en el sistema'
      });
    }

    // 2. CRITERIO AC3: Detección de re-uso (Ya asistió)
    if (reserva.estado === 'Asistió' || reserva.horaAsistencia !== null) {
      return res.status(400).json({
        success: false,
        codigo: 'QR_YA_UTILIZADO',
        error: 'Acceso Denegado / QR Inválido: Este código QR ya fue utilizado anteriormente para registrar el ingreso',
        detalles: {
          horaAsistenciaRegistrada: reserva.horaAsistencia,
          reservaId: reserva.id,
          usuario: reserva.usuario?.nombreCompleto
        }
      });
    }

    // 3. CRITERIO AC3: Validar estado de la reserva
    if (reserva.estado === 'Cancelada') {
      return res.status(400).json({
        success: false,
        codigo: 'RESERVA_CANCELADA',
        error: 'Acceso Denegado / QR Inválido: La reserva fue cancelada previamente'
      });
    }

    if (reserva.estado === 'Ausente') {
      return res.status(400).json({
        success: false,
        codigo: 'RESERVA_EXPIRADA_AUSENTE',
        error: 'Acceso Denegado / QR Inválido: La reserva fue cancelada automáticamente por inasistencia'
      });
    }

    if (reserva.estado !== 'Aprobada') {
      return res.status(400).json({
        success: false,
        codigo: 'RESERVA_NO_APROBADA',
        error: `Acceso Denegado / QR Inválido: La reserva se encuentra en estado '${reserva.estado}'`
      });
    }

    // 4. CRITERIO AC3: Detección de destiempo (Validación de ventana horaria)
    const ahora = new Date();
    const fechaInicio = new Date(reserva.fechaInicio);
    const fechaFin = new Date(reserva.fechaFin);

    // Margen de anticipación permitido: hasta 30 minutos antes de la hora pactada
    const MARGEN_ANTICIPACION_MS = 30 * 60 * 1000;
    const tiempoMinimoIngreso = new Date(fechaInicio.getTime() - MARGEN_ANTICIPACION_MS);

    // Se valida la ventana temporal a menos que se desactive explícitamente para pruebas unitarias
    if (forzarValidacionTiempo !== false) {
      if (ahora.getTime() < tiempoMinimoIngreso.getTime()) {
        return res.status(400).json({
          success: false,
          codigo: 'HORARIO_ANTICIPADO',
          error: `Acceso Denegado / A destiempo: Aún no es la hora de ingreso para esta reserva. La reserva inicia a las ${fechaInicio.toISOString()}`,
          detalles: {
            horaActual: ahora.toISOString(),
            horaInicio: fechaInicio.toISOString()
          }
        });
      }

      if (ahora.getTime() > fechaFin.getTime()) {
        return res.status(400).json({
          success: false,
          codigo: 'HORARIO_EXPIRADO',
          error: `Acceso Denegado / A destiempo: El horario de la reserva ya ha finalizado a las ${fechaFin.toISOString()}`,
          detalles: {
            horaActual: ahora.toISOString(),
            horaFin: fechaFin.toISOString()
          }
        });
      }
    }

    // 5. CRITERIO AC2: Validación exitosa, marcaje de asistencia y sello de hora
    const ahoraMarcaje = new Date();
    const reservaActualizada = await prisma.reserva.update({
      where: { id: reserva.id },
      data: {
        estado: 'Asistió',
        horaAsistencia: ahoraMarcaje
      },
      include: {
        usuario: {
          select: { id: true, nombreCompleto: true, correo: true }
        },
        laboratorio: {
          select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true }
        }
      }
    });

    // Registro de Auditoría
    try {
      await prisma.auditoria.create({
        data: {
          usuarioId: operadorId || null,
          accion: `Validación de ingreso QR exitosa: Reserva #${reserva.id} (${reserva.laboratorio.nombre}) de ${reserva.usuario?.nombreCompleto || 'Usuario'}`
        }
      });
    } catch (auditError) {
      console.warn('Advertencia al registrar auditoría:', auditError);
    }

    return res.status(200).json({
      success: true,
      mensaje: 'Acceso Permitido: Ingreso validado y asistencia confirmada exitosamente',
      data: {
        reservaId: reservaActualizada.id,
        estado: reservaActualizada.estado,
        horaAsistencia: reservaActualizada.horaAsistencia,
        usuario: reservaActualizada.usuario,
        laboratorio: reservaActualizada.laboratorio,
        numeroComputadora: reservaActualizada.numeroComputadora,
        fechaInicio: reservaActualizada.fechaInicio,
        fechaFin: reservaActualizada.fechaFin,
        materia: reservaActualizada.materia,
        motivo: reservaActualizada.motivo
      }
    });

  } catch (error) {
    console.error('Error al escanear código QR:', error);
    return res.status(500).json({ success: false, error: 'Error interno al procesar escaneo de código QR' });
  }
};

// =========================================================================
// MÉTODOS DE APOYO: APROBACIÓN Y GESTIÓN
// =========================================================================

/**
 * Aprueba una reserva pendiente y genera su token QR criptográfico único.
 */
export const aprobarReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const reserva = await prisma.reserva.findUnique({
      where: { id: Number(id) }
    });

    if (!reserva) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada' });
    }

    const tokenQr = crypto.randomBytes(32).toString('hex');

    const reservaAprobada = await prisma.reserva.update({
      where: { id: Number(id) },
      data: {
        estado: 'Aprobada',
        tokenQr
      },
      include: {
        laboratorio: true,
        usuario: { select: { nombreCompleto: true, correo: true } }
      }
    });

    return res.status(200).json({
      success: true,
      mensaje: 'Reserva aprobada exitosamente y código QR generado',
      data: reservaAprobada
    });

  } catch (error) {
    console.error('Error al aprobar reserva:', error);
    return res.status(500).json({ success: false, error: 'Error interno al aprobar la reserva' });
  }
};

/**
 * Lista todas las reservas del sistema con soporte de filtros.
 */
export const listarTodasLasReservas = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { estado, laboratorioId } = req.query;

    const where: any = {};
    if (estado && typeof estado === 'string') {
      where.estado = estado;
    }
    if (laboratorioId && !isNaN(Number(laboratorioId))) {
      where.laboratorioId = Number(laboratorioId);
    }

    const reservas = await prisma.reserva.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombreCompleto: true, correo: true } },
        laboratorio: { select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true } }
      },
      orderBy: { fechaInicio: 'desc' }
    });

    return res.status(200).json({
      success: true,
      total: reservas.length,
      reservas
    });

  } catch (error) {
    console.error('Error al listar todas las reservas:', error);
    return res.status(500).json({ success: false, error: 'Error interno al obtener reservas' });
  }
};
