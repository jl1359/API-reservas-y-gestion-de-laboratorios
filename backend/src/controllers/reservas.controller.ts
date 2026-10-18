import { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { Prisma, Reserva } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// =========================================================================
// CONSTANTES Y HELPERS GENERALES
// =========================================================================

const ESTADOS_ACTIVOS = ['Pendiente', 'Aprobada'];

class ErrorReserva extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const contarComputadoras = (
  laboratorio: Prisma.LaboratorioGetPayload<{
    include: { equipos: { include: { equipamiento: true } } };
  }>,
) => {
  const cantidadRegistrada = laboratorio.equipos
    .filter(({ equipamiento }) => equipamiento.nombre.toLocaleLowerCase().includes('computadora'))
    .reduce((total, equipo) => total + equipo.cantidad, 0);

  return cantidadRegistrada || laboratorio.capacidad;
};

// Esquema Zod de validación estricta para HU-15
export const crearReservaSchema = z.object({
  laboratorioId: z.coerce.number().int().positive('ID de laboratorio inválido'),
  fechaInicio: z.string().min(1, 'fechaInicio es obligatoria'),
  fechaFin: z.string().min(1, 'fechaFin es obligatoria'),
  materia: z.string().min(1, 'El nombre de la materia es obligatorio').max(150),
  cantidadAlumnos: z.coerce.number().int().positive('La cantidad de alumnos debe ser un número entero mayor a 0'),
  motivo: z.string().optional(),
  numeroComputadora: z.coerce.number().int().nonnegative().optional(),
  recurrente: z.boolean().optional().default(false),
  fechaFinSemestre: z.string().optional()
});

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

function validarHorarioOperativo(horarios: any[], inicio: Date, fin: Date) {
  if (!horarios || horarios.length === 0) return { valido: true };

  const diaSemanaLocal = DIAS_SEMANA[inicio.getDay()];
  const diaSemanaUTC = DIAS_SEMANA[inicio.getUTCDay()];

  const horarioDia = horarios.find(h => {
    const d = (h.dia || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const dLocal = diaSemanaLocal.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const dUTC = diaSemanaUTC.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return d === dLocal || d === dUTC;
  });

  if (!horarioDia) {
    return {
      valido: false,
      error: `El laboratorio no abre los días ${diaSemanaLocal}. Seleccione un día operativo.`
    };
  }

  const apMins = horarioDia.horaApertura.getUTCHours() * 60 + horarioDia.horaApertura.getUTCMinutes();
  const ciMins = horarioDia.horaCierre.getUTCHours() * 60 + horarioDia.horaCierre.getUTCMinutes();

  if (apMins < ciMins) {
    const localIniMins = inicio.getHours() * 60 + inicio.getMinutes();
    const localFinMins = fin.getHours() * 60 + fin.getMinutes();
    const utcIniMins = inicio.getUTCHours() * 60 + inicio.getUTCMinutes();
    const utcFinMins = fin.getUTCHours() * 60 + fin.getUTCMinutes();

    const cumpleLocal = localIniMins >= apMins && localFinMins <= ciMins;
    const cumpleUTC = utcIniMins >= apMins && utcFinMins <= ciMins;

    if (!cumpleLocal && !cumpleUTC) {
      const apStr = `${String(Math.floor(apMins / 60)).padStart(2, '0')}:${String(apMins % 60).padStart(2, '0')}`;
      const ciStr = `${String(Math.floor(ciMins / 60)).padStart(2, '0')}:${String(ciMins % 60).padStart(2, '0')}`;
      return {
        valido: false,
        error: `El horario solicitado está fuera del rango operativo de ${horarioDia.dia} (${apStr} - ${ciStr}).`
      };
    }
  }

  return { valido: true };
}

// =========================================================================
// HU-28: RESERVAR COMPUTADORA INDIVIDUAL (MARCO)
// =========================================================================

export const crearReservaIndividual = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  const laboratorioId = Number(req.params.id);
  const numeroComputadora = Number(req.body.numeroComputadora);
  const fechaInicio = new Date(req.body.fechaInicio);
  const fechaFin = new Date(req.body.fechaFin);
  const motivo = typeof req.body.motivo === 'string' ? req.body.motivo.trim() : '';

  if (!Number.isInteger(laboratorioId) || laboratorioId <= 0) {
    return res.status(400).json({ error: 'El laboratorio indicado no es válido' });
  }

  if (!Number.isInteger(numeroComputadora) || numeroComputadora <= 0) {
    return res.status(400).json({ error: 'Debes seleccionar explícitamente una computadora válida' });
  }

  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
    return res.status(400).json({ error: 'La fecha o el horario no son válidos' });
  }

  if (fechaInicio >= fechaFin) {
    return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
  }

  if (fechaInicio <= new Date()) {
    return res.status(400).json({ error: 'La reserva debe comenzar en una fecha futura' });
  }

  if (motivo.length > 255) {
    return res.status(400).json({ error: 'El motivo no puede superar los 255 caracteres' });
  }

  try {
    const reserva = await prisma.$transaction<Reserva>(async (tx) => {
      const laboratorio = await tx.laboratorio.findUnique({
        where: { id: laboratorioId },
        include: { equipos: { include: { equipamiento: true } } },
      });

      if (!laboratorio) {
        throw new ErrorReserva(404, 'Laboratorio no encontrado');
      }

      if (laboratorio.estadoOperativo !== 'Activo') {
        throw new ErrorReserva(409, 'El laboratorio no se encuentra operativo');
      }

      if (!laboratorio.reservaPorComputadora) {
        throw new ErrorReserva(409, 'Este laboratorio no permite reservas por computadora');
      }

      const cantidadComputadoras = contarComputadoras(laboratorio);
      if (numeroComputadora > cantidadComputadoras) {
        throw new ErrorReserva(
          400,
          `La computadora debe estar entre PC-1 y PC-${cantidadComputadoras}`,
        );
      }

      const colision = await tx.reserva.findFirst({
        where: {
          laboratorioId,
          numeroComputadora,
          estado: { in: ESTADOS_ACTIVOS },
          fechaInicio: { lt: fechaFin },
          fechaFin: { gt: fechaInicio },
        },
        select: { id: true },
      });

      if (colision) {
        throw new ErrorReserva(
          409,
          `La computadora PC-${numeroComputadora} ya está reservada en ese horario`,
        );
      }

      return tx.reserva.create({
        data: {
          usuarioId: req.user!.id,
          laboratorioId,
          numeroComputadora,
          fechaInicio,
          fechaFin,
          motivo: motivo || null,
          cantidadAlumnos: 1,
          estado: 'Pendiente',
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    return res.status(201).json({
      success: true,
      message: `Reserva de PC-${numeroComputadora} registrada correctamente`,
      data: reserva,
    });
  } catch (error) {
    if (error instanceof ErrorReserva) {
      return res.status(error.status).json({ error: error.message });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return res.status(409).json({
        error: 'La disponibilidad cambió mientras se procesaba la reserva. Inténtalo nuevamente',
      });
    }

    console.error(error);
    return res.status(500).json({ error: 'Error al registrar la reserva individual' });
  }
};

// =========================================================================
// HU-15: CREAR SOLICITUD DE RESERVA DE LABORATORIO (MIGUEL)
// =========================================================================

export const crearReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    const usuarioRol = req.user?.rol;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Solo Docentes, Auxiliares o Admins pueden reservar un laboratorio completo
    const rolesPermitidos = ['Docente', 'Auxiliar de Docencia', 'Admin', 'Responsable de Laboratorio'];
    if (!rolesPermitidos.includes(usuarioRol || '')) {
      return res.status(403).json({
        error: 'Solo el personal docente, auxiliar o administrativo puede solicitar reservas de laboratorio'
      });
    }

    // Validación de entrada con Zod
    const parseResult = crearReservaSchema.safeParse(req.body);
    if (!parseResult.success) {
      const primerError = parseResult.error.issues[0]?.message || 'Datos de reserva inválidos';
      return res.status(400).json({ error: primerError, issues: parseResult.error.issues });
    }

    const {
      laboratorioId,
      fechaInicio: fechaInicioRaw,
      fechaFin: fechaFinRaw,
      materia,
      cantidadAlumnos,
      motivo,
      numeroComputadora,
      recurrente,
      fechaFinSemestre: fechaFinSemestreRaw
    } = parseResult.data;

    const inicio = new Date(fechaInicioRaw);
    const fin = new Date(fechaFinRaw);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ error: 'Formato de fecha u hora no válido (use formato ISO8601)' });
    }

    if (inicio >= fin) {
      return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio' });
    }

    const ahora = new Date();
    if (inicio <= ahora) {
      return res.status(400).json({ error: 'La reserva debe programarse con fecha y hora futura' });
    }

    // Verificar laboratorio y horarios configurados
    const laboratorio = await prisma.laboratorio.findUnique({
      where: { id: laboratorioId },
      include: { horarios: true }
    });

    if (!laboratorio) {
      return res.status(404).json({ error: 'Laboratorio no encontrado' });
    }

    if (laboratorio.estadoOperativo !== 'Activo') {
      return res.status(400).json({ error: `El laboratorio no se encuentra operativo (Estado: ${laboratorio.estadoOperativo})` });
    }

    if (cantidadAlumnos > laboratorio.capacidad) {
      return res.status(400).json({
        error: `La cantidad de alumnos (${cantidadAlumnos}) supera la capacidad máxima del laboratorio (${laboratorio.capacidad})`
      });
    }

    // Construcción de la lista de fechas (única o serie recurrente semestral)
    const bloquesReserva: { inicio: Date; fin: Date }[] = [];

    if (recurrente) {
      if (!fechaFinSemestreRaw) {
        return res.status(400).json({ error: 'Debes proporcionar la fecha de fin de semestre para reservas recurrentes' });
      }
      const finSemestre = new Date(fechaFinSemestreRaw);
      if (isNaN(finSemestre.getTime()) || finSemestre <= inicio) {
        return res.status(400).json({ error: 'La fecha de fin de semestre debe ser posterior a la fecha de inicio' });
      }

      let curInicio = new Date(inicio.getTime());
      let curFin = new Date(fin.getTime());

      while (curInicio <= finSemestre) {
        bloquesReserva.push({ inicio: new Date(curInicio), fin: new Date(curFin) });
        curInicio = new Date(curInicio.getTime() + 7 * 24 * 60 * 60 * 1000);
        curFin = new Date(curFin.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    } else {
      bloquesReserva.push({ inicio, fin });
    }

    // Validar horarios operativos y feriados para cada bloque
    const feriados = await prisma.feriado.findMany({ where: { bloqueoActivo: true } });

    for (const bloque of bloquesReserva) {
      // 1. Validar horario operativo
      const valHorario = validarHorarioOperativo(laboratorio.horarios, bloque.inicio, bloque.fin);
      if (!valHorario.valido) {
        return res.status(400).json({
          error: valHorario.error,
          fechaConflicto: bloque.inicio.toISOString()
        });
      }

      // 2. Validar feriados
      const inicioUTCStr = bloque.inicio.toISOString().split('T')[0];
      const anioL = bloque.inicio.getFullYear();
      const mesL = String(bloque.inicio.getMonth() + 1).padStart(2, '0');
      const diaL = String(bloque.inicio.getDate()).padStart(2, '0');
      const inicioLocalStr = `${anioL}-${mesL}-${diaL}`;

      const feriadoCoincidente = feriados.find(f => {
        const fStr = f.fecha.toISOString().split('T')[0];
        return fStr === inicioUTCStr || fStr === inicioLocalStr;
      });

      if (feriadoCoincidente) {
        return res.status(409).json({
          code: 'FERIADO_BLOQUEADO',
          error: `No se puede reservar el ${bloque.inicio.toLocaleDateString()}: coincide con feriado (${feriadoCoincidente.motivo})`,
          fechaConflicto: bloque.inicio.toISOString()
        });
      }
    }

    // Ejecución transaccional atómica serializable protegida por PostgreSQL EXCLUDE (HU-15)
    const resultado = await prisma.$transaction(async (tx) => {
      const reservasCreadas = [];
      const serieId = recurrente ? `SERIE-${Date.now()}` : undefined;

      for (const bloque of bloquesReserva) {
        // Doble verificación lógica previa a la inserción
        const conflicto = await tx.reserva.findFirst({
          where: {
            laboratorioId,
            numeroComputadora: numeroComputadora ? numeroComputadora : null,
            estado: { in: ['Pendiente', 'Aprobada', 'Confirmada'] },
            fechaInicio: { lt: bloque.fin },
            fechaFin: { gt: bloque.inicio }
          }
        });

        if (conflicto) {
          throw new Error('CONFLICTO_HORARIO');
        }

        const nueva = await tx.reserva.create({
          data: {
            usuarioId,
            laboratorioId,
            fechaInicio: bloque.inicio,
            fechaFin: bloque.fin,
            materia: materia.trim(),
            cantidadAlumnos,
            numeroComputadora: numeroComputadora || null,
            motivo: recurrente ? `[Serie: ${serieId}] ${motivo ? motivo.trim() : ''}`.trim() : (motivo ? motivo.trim() : null),
            estado: 'Pendiente'
          }
        });

        reservasCreadas.push(nueva);
      }

      // Crear notificación para el solicitante
      await tx.notificacion.create({
        data: {
          usuarioId,
          mensaje: recurrente
            ? `Tu serie semestral de ${reservasCreadas.length} reservas para ${laboratorio.nombre} (${materia}) fue solicitada exitosamente y está en revisión.`
            : `Tu solicitud de reserva para ${laboratorio.nombre} (${materia}) fue enviada exitosamente y está pendiente de aprobación.`
        }
      }).catch(() => null);

      return reservasCreadas;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return res.status(201).json({
      success: true,
      mensaje: recurrente
        ? `Serie semestral de ${resultado.length} solicitudes de reserva registrada exitosamente.`
        : 'Solicitud de reserva enviada exitosamente. El responsable revisará la solicitud.',
      totalReservas: resultado.length,
      reserva: resultado[0],
      reservas: resultado
    });

  } catch (error: any) {
    // Intercepción de conflicto de exclusión de PostgreSQL (23P01) o condición Serializable P2034
    const esConflictoExclusion =
      error.message?.includes('23P01') ||
      error.message?.includes('reservas_sin_solapamiento') ||
      error.message === 'CONFLICTO_HORARIO' ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034');

    if (esConflictoExclusion) {
      return res.status(409).json({
        code: 'RESERVA_SOLAPADA',
        error: 'El horario solicitado entra en colisión con otra reserva activa o pendiente en este laboratorio.'
      });
    }

    console.error('Error al registrar la reserva:', error);
    return res.status(500).json({ error: 'Error interno al procesar la reserva' });
  }
};

// =========================================================================
// HU-16: BANDEJA DE RESERVAS PENDIENTES (MIGUEL)
// =========================================================================

export const listarReservasPendientes = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { laboratorioId } = req.query;

    const whereClause: any = {
      estado: 'Pendiente'
    };

    if (laboratorioId) {
      const parsedId = Number(laboratorioId);
      if (Number.isInteger(parsedId)) {
        whereClause.laboratorioId = parsedId;
      }
    }

    const reservas = await prisma.reserva.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: {
            id: true,
            nombreCompleto: true,
            correo: true,
            rol: { select: { nombre: true } }
          }
        },
        laboratorio: {
          select: {
            id: true,
            nombre: true,
            capacidad: true,
            ubicacion: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'asc'
      }
    });

    return res.json({
      success: true,
      total: reservas.length,
      data: reservas
    });
  } catch (error) {
    console.error('Error al listar reservas pendientes:', error);
    return res.status(500).json({ error: 'Error al obtener la bandeja de reservas pendientes' });
  }
};

// =========================================================================
// HU-17: GESTIONAR RESERVA (APROBAR / RECHAZAR) (MIGUEL)
// =========================================================================

export const gestionarReserva = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID de reserva inválido' });
    }

    const { accion, motivoRechazo } = req.body;

    if (!accion || !['Aprobar', 'Rechazar'].includes(accion)) {
      return res.status(400).json({ error: "La acción debe ser 'Aprobar' o 'Rechazar'" });
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        laboratorio: true,
        usuario: true
      }
    });

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.estado !== 'Pendiente') {
      return res.status(400).json({
        error: `La reserva ya fue gestionada previamente (Estado actual: ${reserva.estado})`
      });
    }

    if (accion === 'Aprobar') {
      // Re-verificar que el laboratorio siga operativo
      if (reserva.laboratorio.estadoOperativo !== 'Activo') {
        return res.status(400).json({
          error: `No se puede aprobar la reserva porque el laboratorio no está activo (${reserva.laboratorio.estadoOperativo})`
        });
      }

      // Generar token criptográfico único para el código QR de acceso
      const tokenQr = crypto.randomBytes(32).toString('hex');

      const reservaActualizada = await prisma.reserva.update({
        where: { id },
        data: {
          estado: 'Aprobada',
          tokenQr
        }
      });

      // Crear notificación para el solicitante
      if (reserva.usuarioId) {
        await prisma.notificacion.create({
          data: {
            usuarioId: reserva.usuarioId,
            mensaje: `Tu reserva para el ${reserva.laboratorio.nombre} (${reserva.materia || 'Práctica'}) ha sido APROBADA.`
          }
        }).catch(() => null);
      }

      return res.json({
        success: true,
        mensaje: 'Reserva APROBADA exitosamente',
        data: reservaActualizada
      });
    }

    if (accion === 'Rechazar') {
      if (!motivoRechazo || typeof motivoRechazo !== 'string' || motivoRechazo.trim().length === 0) {
        return res.status(400).json({
          error: 'Para rechazar una reserva es obligatorio proporcionar un motivo de rechazo'
        });
      }

      const reservaActualizada = await prisma.reserva.update({
        where: { id },
        data: {
          estado: 'Rechazada',
          motivo: `Rechazado: ${motivoRechazo.trim()}`
        }
      });

      // Notificar al solicitante
      if (reserva.usuarioId) {
        await prisma.notificacion.create({
          data: {
            usuarioId: reserva.usuarioId,
            mensaje: `Tu reserva para el ${reserva.laboratorio.nombre} ha sido RECHAZADA. Motivo: ${motivoRechazo.trim()}`
          }
        }).catch(() => null);
      }

      return res.json({
        success: true,
        mensaje: 'Reserva RECHAZADA. El horario queda liberado para nuevas solicitudes.',
        data: reservaActualizada
      });
    }

  } catch (error) {
    console.error('Error al gestionar reserva:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud de gestión' });
  }
};

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

// =========================================================================
// HISTORIAL DE RESERVAS DEL USUARIO (PERFIL & HU-22)
// =========================================================================

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
          select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true, capacidad: true }
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
          tokenQr
        };
      })
    );

    return res.status(200).json({
      success: true,
      total: reservasConQrSeguro.length,
      data: reservasConQrSeguro,
      reservas: reservasConQrSeguro
    });

  } catch (error) {
    console.error('Error al listar mis reservas:', error);
    return res.status(500).json({ success: false, error: 'Error interno al obtener reservas personales' });
  }
};

export const obtenerMisReservas = listarMisReservas;

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
        laboratorio: { select: { id: true, nombre: true, ubicacion: true, reservaPorComputadora: true, capacidad: true } }
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
