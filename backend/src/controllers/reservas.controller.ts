import { Response } from 'express';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// HU-15: Crear Solicitud de Reserva de Laboratorio
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
        error: 'Solo el personal docente, auxiliar o administrativo puede solicitar reservas de laboratorio completo'
      });
    }

    const { laboratorioId, fechaInicio, fechaFin, materia, cantidadAlumnos, motivo } = req.body;

    const labId = Number(laboratorioId);
    if (!Number.isInteger(labId) || labId <= 0) {
      return res.status(400).json({ error: 'ID de laboratorio inválido' });
    }

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Debes proporcionar la fecha y hora de inicio y fin' });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

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

    if (!materia || typeof materia !== 'string' || materia.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre de la materia o asignatura es obligatorio' });
    }

    const alumnos = Number(cantidadAlumnos);
    if (!Number.isInteger(alumnos) || alumnos <= 0) {
      return res.status(400).json({ error: 'La cantidad de alumnos debe ser un número entero mayor a 0' });
    }

    // Verificar laboratorio
    const laboratorio = await prisma.laboratorio.findUnique({
      where: { id: labId },
      include: { horarios: true }
    });

    if (!laboratorio) {
      return res.status(404).json({ error: 'Laboratorio no encontrado' });
    }

    if (laboratorio.estadoOperativo !== 'Activo') {
      return res.status(400).json({ error: `El laboratorio no se encuentra operativo (Estado: ${laboratorio.estadoOperativo})` });
    }

    if (alumnos > laboratorio.capacidad) {
      return res.status(400).json({
        error: `La cantidad de alumnos (${alumnos}) supera la capacidad máxima del laboratorio (${laboratorio.capacidad})`
      });
    }

    // Validar feriados
    const inicioDateOnly = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    const feriado = await prisma.feriado.findFirst({
      where: {
        fecha: inicioDateOnly,
        bloqueoActivo: true
      }
    });

    if (feriado) {
      return res.status(400).json({
        error: `No se pueden realizar reservas en días feriados: ${feriado.motivo}`
      });
    }

    // Ejecución transaccional serializable para evitar condiciones de carrera (HU-15)
    const resultado = await prisma.$transaction(async (tx) => {
      // Búsqueda de solapamiento en estados activos (Pendiente o Aprobada)
      const conflicto = await tx.reserva.findFirst({
        where: {
          laboratorioId: labId,
          estado: { in: ['Pendiente', 'Aprobada', 'Confirmada'] },
          fechaInicio: { lt: fin },
          fechaFin: { gt: inicio }
        },
        include: {
          usuario: { select: { nombreCompleto: true } }
        }
      });

      if (conflicto) {
        throw new Error('CONFLICTO_HORARIO');
      }

      const nuevaReserva = await tx.reserva.create({
        data: {
          usuarioId,
          laboratorioId: labId,
          fechaInicio: inicio,
          fechaFin: fin,
          materia: materia.trim(),
          cantidadAlumnos: alumnos,
          motivo: motivo ? motivo.trim() : null,
          estado: 'Pendiente'
        },
        include: {
          laboratorio: { select: { nombre: true } }
        }
      });

      // Crear notificación para administradores o responsables
      await tx.notificacion.create({
        data: {
          usuarioId,
          mensaje: `Tu solicitud de reserva para ${nuevaReserva.laboratorio.nombre} (${materia}) fue enviada exitosamente y está pendiente de aprobación.`
        }
      }).catch(() => null);

      return nuevaReserva;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return res.status(201).json({
      success: true,
      mensaje: 'Solicitud de reserva enviada exitosamente. El responsable revisará la solicitud.',
      reserva: resultado
    });

  } catch (error: any) {
    if (error.message === 'CONFLICTO_HORARIO') {
      return res.status(409).json({
        error: 'El horario solicitado entra en colisión con otra reserva activa o pendiente en este laboratorio.'
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return res.status(409).json({
        error: 'Conflicto de concurrencia: el horario fue tomado por otra solicitud en este instante. Intenta nuevamente.'
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
