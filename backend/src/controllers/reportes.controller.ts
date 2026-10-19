import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * HU-24: reservas programadas para un día y su asistencia registrada.
 * El día se interpreta en horario de Bolivia (UTC-04:00).
 */
export const reporteAsistenciasDiarias = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fecha, laboratorioId } = req.query;

  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    res.status(400).json({ error: 'Indica fecha en formato AAAA-MM-DD' });
    return;
  }

  const fechaUtc = new Date(`${fecha}T00:00:00.000Z`);
  if (Number.isNaN(fechaUtc.getTime()) || fechaUtc.toISOString().slice(0, 10) !== fecha) {
    res.status(400).json({ error: 'La fecha indicada no existe' });
    return;
  }

  let idLaboratorio: number | undefined;
  if (laboratorioId !== undefined) {
    if (typeof laboratorioId !== 'string' || !/^[1-9]\d*$/.test(laboratorioId)) {
      res.status(400).json({ error: 'laboratorioId debe ser un entero positivo' });
      return;
    }
    idLaboratorio = Number(laboratorioId);
    if (!Number.isSafeInteger(idLaboratorio) || idLaboratorio > 2147483647) {
      res.status(400).json({ error: 'laboratorioId no es válido' });
      return;
    }
  }

  const inicio = new Date(`${fecha}T00:00:00-04:00`);
  const fin = new Date(inicio.getTime() + 24 * 60 * 60 * 1000);
  const where: Prisma.ReservaWhereInput = {
    fechaInicio: { gte: inicio, lt: fin },
    ...(idLaboratorio !== undefined && { laboratorioId: idLaboratorio }),
  };

  try {
    const reservas = await prisma.reserva.findMany({
      where,
      select: {
        id: true,
        fechaInicio: true,
        fechaFin: true,
        estado: true,
        horaAsistencia: true,
        numeroComputadora: true,
        usuario: { select: { id: true, nombreCompleto: true, correo: true } },
        laboratorio: { select: { id: true, nombre: true, ubicacion: true } },
      },
      orderBy: [{ fechaInicio: 'asc' }, { id: 'asc' }],
    });

    const porEstado = new Map<string, number>();
    for (const reserva of reservas) {
      porEstado.set(reserva.estado, (porEstado.get(reserva.estado) ?? 0) + 1);
    }

    res.status(200).json({
      fecha,
      zonaHoraria: 'America/La_Paz',
      criterio: 'fechaInicio de la reserva',
      laboratorioId: idLaboratorio ?? null,
      resumen: {
        totalReservas: reservas.length,
        asistenciasRegistradas: reservas.filter((r) => r.horaAsistencia !== null).length,
        inasistenciasRegistradas: reservas.filter((r) => r.estado === 'Ausente').length,
        porEstado: Object.fromEntries(porEstado),
      },
      reservas,
    });
  } catch (error) {
    console.error('Error al obtener el reporte de asistencias:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de asistencias' });
  }
};
