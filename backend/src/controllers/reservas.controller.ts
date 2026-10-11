import { Prisma, Reserva } from '@prisma/client';
import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

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
