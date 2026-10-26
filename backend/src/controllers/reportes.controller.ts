import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  obtenerMetricasOcupacionAcademicas,
  generarCsvMetricasAcademicas
} from '../services/reportes.service';


/**
 * Auditoría diaria o por rango de fechas de reservas programadas y asistencia registrada.
 * Las fechas se interpretan en horario de Bolivia (UTC-04:00).
 */
export const reporteAsistenciasDiarias = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fecha, fechaInicio, fechaFin, laboratorioId, carreraId } = req.query;

  const fechaDesde = (fechaInicio || fecha) as string;
  if (typeof fechaDesde !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaDesde)) {
    res.status(400).json({ error: 'Indica fecha o fechaInicio en formato AAAA-MM-DD' });
    return;
  }

  const fechaUtcDesde = new Date(`${fechaDesde}T00:00:00.000Z`);
  if (Number.isNaN(fechaUtcDesde.getTime()) || fechaUtcDesde.toISOString().slice(0, 10) !== fechaDesde) {
    res.status(400).json({ error: 'La fecha de inicio indicada no existe' });
    return;
  }

  let fechaHasta = fechaDesde;
  if (fechaFin !== undefined && fechaFin !== '') {
    if (typeof fechaFin !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)) {
      res.status(400).json({ error: 'fechaFin debe tener formato AAAA-MM-DD' });
      return;
    }
    const fechaUtcHasta = new Date(`${fechaFin}T00:00:00.000Z`);
    if (Number.isNaN(fechaUtcHasta.getTime()) || fechaUtcHasta.toISOString().slice(0, 10) !== fechaFin) {
      res.status(400).json({ error: 'La fecha fin indicada no existe' });
      return;
    }
    fechaHasta = fechaFin;
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

  const inicio = new Date(`${fechaDesde}T00:00:00-04:00`);
  const finDiaHasta = new Date(`${fechaHasta}T00:00:00-04:00`);
  const fin = new Date(finDiaHasta.getTime() + 24 * 60 * 60 * 1000);

  if (inicio.getTime() >= fin.getTime()) {
    res.status(400).json({ error: 'La fecha de inicio no puede ser posterior a la fecha final' });
    return;
  }

  let idCarrera: number | undefined;
  if (carreraId !== undefined && carreraId !== '') {
    if (typeof carreraId === 'string' && /^[1-9]\d*$/.test(carreraId)) {
      idCarrera = Number(carreraId);
    }
  }

  const where: Prisma.ReservaWhereInput = {
    fechaInicio: { gte: inicio, lt: fin },
    ...(idLaboratorio !== undefined && { laboratorioId: idLaboratorio }),
    ...(idCarrera !== undefined && { laboratorio: { carreraId: idCarrera } }),
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
        usuario: { 
          select: { 
            id: true, 
            nombreCompleto: true, 
            correo: true,
            carrera: { select: { id: true, nombre: true } }
          } 
        },
        laboratorio: { 
          select: { 
            id: true, 
            nombre: true, 
            ubicacion: true,
            carreraId: true,
            carrera: { select: { id: true, nombre: true } }
          } 
        },
      },
      orderBy: [{ fechaInicio: 'asc' }, { id: 'asc' }],
    });

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const porEstado = new Map<string, number>();
    const porCarrera = new Map<string, { id: number | null; nombre: string; total: number; porcentaje: number }>();
    const porLaboratorio = new Map<number, { id: number; nombre: string; total: number; porcentaje: number }>();
    const porDia = new Map<string, { fecha: string; diaSemana: string; total: number; porcentaje: number }>();

    for (const reserva of reservas) {
      // Conteo por estado
      porEstado.set(reserva.estado, (porEstado.get(reserva.estado) ?? 0) + 1);

      // Conteo por Carrera (asociada al laboratorio)
      const cId = reserva.laboratorio?.carrera?.id ?? 0;
      const cNombre = reserva.laboratorio?.carrera?.nombre ?? 'General / Sin Carrera Asignada';
      const keyCarrera = cId === 0 ? 'sin_carrera' : `carrera_${cId}`;
      if (!porCarrera.has(keyCarrera)) {
        porCarrera.set(keyCarrera, {
          id: cId === 0 ? null : cId,
          nombre: cNombre,
          total: 0,
          porcentaje: 0
        });
      }
      porCarrera.get(keyCarrera)!.total += 1;

      // Conteo por laboratorio
      if (reserva.laboratorio) {
        const labId = reserva.laboratorio.id;
        const labNombre = reserva.laboratorio.nombre;
        if (!porLaboratorio.has(labId)) {
          porLaboratorio.set(labId, { id: labId, nombre: labNombre, total: 0, porcentaje: 0 });
        }
        porLaboratorio.get(labId)!.total += 1;
      }

      // Conteo por día en hora de Bolivia (UTC-04:00)
      const offsetBoliviaMs = 4 * 60 * 60 * 1000;
      const dBolivia = new Date(reserva.fechaInicio.getTime() - offsetBoliviaMs);
      const strFecha = dBolivia.toISOString().slice(0, 10);
      const diaSem = diasSemana[dBolivia.getUTCDay()];
      if (!porDia.has(strFecha)) {
        porDia.set(strFecha, { fecha: strFecha, diaSemana: diaSem, total: 0, porcentaje: 0 });
      }
      porDia.get(strFecha)!.total += 1;
    }

    const totalReservas = reservas.length;

    // Métricas por carrera
    const listaPorCarrera = Array.from(porCarrera.values()).map(item => ({
      ...item,
      porcentaje: totalReservas > 0 ? Math.round((item.total / totalReservas) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    const carreraMasDemandada = listaPorCarrera.length > 0 ? listaPorCarrera[0] : null;

    // Métricas por laboratorio
    const listaPorLaboratorio = Array.from(porLaboratorio.values()).map(item => ({
      ...item,
      porcentaje: totalReservas > 0 ? Math.round((item.total / totalReservas) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    const laboratorioMasReservado = listaPorLaboratorio.length > 0 ? listaPorLaboratorio[0] : null;

    // Métricas por día cronológico
    const listaPorDia = Array.from(porDia.values()).map(item => ({
      ...item,
      porcentaje: totalReservas > 0 ? Math.round((item.total / totalReservas) * 100) : 0
    })).sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Día con mayor demanda absoluta
    const diaMasReservado = listaPorDia.length > 0 
      ? [...listaPorDia].sort((a, b) => b.total - a.total)[0] 
      : null;

    res.status(200).json({
      fecha: fechaDesde,
      fechaFin: fechaHasta !== fechaDesde ? fechaHasta : null,
      esRango: fechaHasta !== fechaDesde,
      zonaHoraria: 'America/La_Paz',
      criterio: 'fechaInicio de la reserva',
      laboratorioId: idLaboratorio ?? null,
      resumen: {
        totalReservas,
        asistenciasRegistradas: reservas.filter((r) => r.horaAsistencia !== null).length,
        inasistenciasRegistradas: reservas.filter((r) => r.estado === 'Ausente').length,
        porEstado: Object.fromEntries(porEstado),
        porCarrera: listaPorCarrera,
        carreraMasDemandada,
        porLaboratorio: listaPorLaboratorio,
        laboratorioMasReservado,
        porDia: listaPorDia,
        diaMasReservado,
      },
      reservas,
    });
  } catch (error) {
    console.error('Error al obtener el reporte de asistencias:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de asistencias' });
  }
};

/**
 * Consulta de métricas consolidadas de ocupación para Dashboard e Informes Académicos.
 */
export const obtenerMetricasAcademicas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fechaInicio, fechaFin, laboratorioId } = req.query;

    const idLab = laboratorioId && typeof laboratorioId === 'string' && /^[1-9]\d*$/.test(laboratorioId)
      ? Number(laboratorioId)
      : undefined;

    const datos = await obtenerMetricasOcupacionAcademicas(
      typeof fechaInicio === 'string' ? fechaInicio : undefined,
      typeof fechaFin === 'string' ? fechaFin : undefined,
      idLab
    );

    res.status(200).json({
      success: true,
      data: datos
    });
  } catch (error) {
    console.error('Error al obtener métricas académicas:', error);
    res.status(500).json({ success: false, error: 'No se pudieron calcular las métricas de ocupación' });
  }
};

/**
 * Descarga directa de archivo CSV para Excel con métricas académicas y de ocupación.
 */
export const exportarCsvMetricasAcademicas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fechaInicio, fechaFin, laboratorioId } = req.query;

    const idLab = laboratorioId && typeof laboratorioId === 'string' && /^[1-9]\d*$/.test(laboratorioId)
      ? Number(laboratorioId)
      : undefined;

    const datos = await obtenerMetricasOcupacionAcademicas(
      typeof fechaInicio === 'string' ? fechaInicio : undefined,
      typeof fechaFin === 'string' ? fechaFin : undefined,
      idLab
    );

    const csvData = generarCsvMetricasAcademicas(datos);
    const fechaActual = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Metricas_Ocupacion_Campus_${fechaActual}.csv"`);
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error al exportar CSV de métricas:', error);
    res.status(500).json({ success: false, error: 'No se pudo exportar el informe CSV' });
  }
};