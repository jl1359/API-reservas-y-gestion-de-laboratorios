import { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

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

// HU-15: Crear Solicitud de Reserva de Laboratorio (Motor de Concurrencia y Recurrencia)
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
      const fechaSoloDia = new Date(bloque.inicio.getFullYear(), bloque.inicio.getMonth(), bloque.inicio.getDate());
      const feriadoCoincidente = feriados.find(f => {
        const fDia = new Date(f.fecha.getFullYear(), f.fecha.getMonth(), f.fecha.getDate());
        return fDia.getTime() === fechaSoloDia.getTime();
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

// HU-16: Listar Solicitudes de Reserva Pendientes (Bandeja para Responsable y Admin)
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

// HU-17: Aprobar o Rechazar Solicitud de Reserva
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

      // Crear notificación para el docente
      if (reserva.usuarioId) {
        await prisma.notificacion.create({
          data: {
            usuarioId: reserva.usuarioId,
            mensaje: `✅ Tu reserva para el ${reserva.laboratorio.nombre} (${reserva.materia || 'Práctica'}) ha sido APROBADA.`
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
            mensaje: `❌ Tu reserva para el ${reserva.laboratorio.nombre} ha sido RECHAZADA. Motivo: ${motivoRechazo.trim()}`
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

// Historial propio de reservas (para el Perfil del usuario)
export const obtenerMisReservas = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const reservas = await prisma.reserva.findMany({
      where: { usuarioId },
      include: {
        laboratorio: {
          select: {
            id: true,
            nombre: true,
            ubicacion: true,
            capacidad: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      }
    });

    return res.json({
      success: true,
      total: reservas.length,
      data: reservas
    });
  } catch (error) {
    console.error('Error al obtener mis reservas:', error);
    return res.status(500).json({ error: 'Error al obtener el historial de reservas' });
  }
};
