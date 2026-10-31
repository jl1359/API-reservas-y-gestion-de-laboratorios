import { prisma } from '../config/prisma';

export interface MetricasLaboratorio {
  laboratorioId: number;
  nombre: string;
  ubicacion: string;
  carreraNombre?: string | null;
  capacidad: number;
  totalReservas: number;
  reservasAsistidas: number;
  reservasAusentes: number;
  reservasCanceladas: number;
  reservasAprobadas: number;
  horasUsoEfectivo: number;
  tasaAsistencia: number;
  alumnosBeneficiados: number;
}

export interface ResumenMetricasAcademicas {
  totalReservasCampus: number;
  totalHorasCampus: number;
  tasaAsistenciaPromedio: number;
  totalAlumnosBeneficiados: number;
  laboratorioMasDemandado: string;
  laboratorios: MetricasLaboratorio[];
}

/**
 * Obtener métricas consolidadas de ocupación e impacto académico.
 */
export const obtenerMetricasOcupacionAcademicas = async (
  fechaInicioStr?: string,
  fechaFinStr?: string,
  laboratorioId?: number
): Promise<ResumenMetricasAcademicas> => {
  const whereReserva: any = {};

  if (fechaInicioStr && fechaFinStr) {
    const inicio = new Date(`${fechaInicioStr}T00:00:00.000Z`);
    const fin = new Date(`${fechaFinStr}T23:59:59.999Z`);
    whereReserva.fechaInicio = { gte: inicio, lte: fin };
  } else if (fechaInicioStr) {
    whereReserva.fechaInicio = { gte: new Date(`${fechaInicioStr}T00:00:00.000Z`) };
  } else if (fechaFinStr) {
    whereReserva.fechaInicio = { lte: new Date(`${fechaFinStr}T23:59:59.999Z`) };
  }

  if (laboratorioId) {
    whereReserva.laboratorioId = laboratorioId;
  }

  // Traer laboratorios relevantes
  const laboratoriosDb = await prisma.laboratorio.findMany({
    where: laboratorioId ? { id: laboratorioId } : {},
    select: { 
      id: true, 
      nombre: true, 
      ubicacion: true, 
      capacidad: true,
      carrera: { select: { nombre: true } }
    }
  });

  // Traer reservas correspondientes
  const reservasDb = await prisma.reserva.findMany({
    where: whereReserva,
    select: {
      id: true,
      laboratorioId: true,
      fechaInicio: true,
      fechaFin: true,
      estado: true,
      horaAsistencia: true,
      cantidadAlumnos: true
    }
  });

  let totalHorasCampus = 0;
  let totalAlumnosBeneficiados = 0;
  let totalAsistidasCampus = 0;
  let totalAusentesCampus = 0;

  const metricasPorLab: MetricasLaboratorio[] = laboratoriosDb.map((lab) => {
    const reservasLab = reservasDb.filter((r) => r.laboratorioId === lab.id);
    const totalReservas = reservasLab.length;

    let asistidas = 0;
    let ausentes = 0;
    let canceladas = 0;
    let aprobadas = 0;
    let horasUso = 0;
    let alumnosLab = 0;

    for (const r of reservasLab) {
      if (r.horaAsistencia !== null || r.estado === 'Asistió') {
        asistidas++;
      } else if (r.estado === 'Ausente') {
        ausentes++;
      } else if (r.estado === 'Cancelada') {
        canceladas++;
      } else if (r.estado === 'Aprobada') {
        aprobadas++;
      }

      // Cálculo de horas y estudiantes para reservas donde efectivamente se asistió
      if (r.horaAsistencia !== null || r.estado === 'Asistió') {
        const diffMs = new Date(r.fechaFin).getTime() - new Date(r.fechaInicio).getTime();
        const diffHoras = Math.max(0, diffMs / (1000 * 60 * 60));
        horasUso += diffHoras;
        alumnosLab += r.cantidadAlumnos || 1;
      }
    }

    const evaluadas = asistidas + ausentes;
    const tasaAsistencia = evaluadas > 0 ? Number(((asistidas / evaluadas) * 100).toFixed(1)) : (totalReservas > 0 ? 100 : 0);

    totalHorasCampus += horasUso;
    totalAlumnosBeneficiados += alumnosLab;
    totalAsistidasCampus += asistidas;
    totalAusentesCampus += ausentes;

    return {
      laboratorioId: lab.id,
      nombre: lab.nombre,
      ubicacion: lab.ubicacion || 'Campus Central',
      carreraNombre: lab.carrera?.nombre || 'General / Sin Asignar',
      capacidad: lab.capacidad,
      totalReservas,
      reservasAsistidas: asistidas,
      reservasAusentes: ausentes,
      reservasCanceladas: canceladas,
      reservasAprobadas: aprobadas,
      horasUsoEfectivo: Number(horasUso.toFixed(1)),
      tasaAsistencia,
      alumnosBeneficiados: alumnosLab
    };
  });

  // Ordenar de mayor a menor uso
  metricasPorLab.sort((a, b) => b.totalReservas - a.totalReservas);

  const labTop = metricasPorLab[0]?.nombre || 'N/A';
  const totalEvaluadasCampus = totalAsistidasCampus + totalAusentesCampus;
  const tasaAsistenciaPromedio = totalEvaluadasCampus > 0
    ? Number(((totalAsistidasCampus / totalEvaluadasCampus) * 100).toFixed(1))
    : 100;

  return {
    totalReservasCampus: reservasDb.length,
    totalHorasCampus: Number(totalHorasCampus.toFixed(1)),
    tasaAsistenciaPromedio,
    totalAlumnosBeneficiados,
    laboratorioMasDemandado: labTop,
    laboratorios: metricasPorLab
  };
};

/**
 * Generar archivo CSV compatible con Excel (BOM UTF-8, delimitador coma).
 */
export const generarCsvMetricasAcademicas = (datos: ResumenMetricasAcademicas): string => {
  const encabezados = [
    'ID_Laboratorio',
    'Laboratorio',
    'Ubicacion',
    'Capacidad_Asientos',
    'Total_Reservas',
    'Reservas_Asistidas',
    'Inasistencias_Ausentes',
    'Reservas_Canceladas',
    'Reservas_Aprobadas',
    'Horas_Uso_Efectivo',
    'Tasa_Asistencia_Pct',
    'Alumnos_Beneficiados'
  ];

  const filas = datos.laboratorios.map((lab) => {
    const nombre = (lab.nombre || '').replace(/"/g, '""');
    const ubicacion = (lab.ubicacion || '').replace(/"/g, '""');

    return [
      lab.laboratorioId,
      `"${nombre}"`,
      `"${ubicacion}"`,
      lab.capacidad,
      lab.totalReservas,
      lab.reservasAsistidas,
      lab.reservasAusentes,
      lab.reservasCanceladas,
      lab.reservasAprobadas,
      lab.horasUsoEfectivo,
      `${lab.tasaAsistencia}%`,
      lab.alumnosBeneficiados
    ].join(',');
  });

  // Resumen al pie del CSV
  const filaTotal = [
    'TOTAL_CAMPUS',
    '"Consolidado General"',
    '"Todos los espacios"',
    '--',
    datos.totalReservasCampus,
    '--',
    '--',
    '--',
    '--',
    datos.totalHorasCampus,
    `${datos.tasaAsistenciaPromedio}%`,
    datos.totalAlumnosBeneficiados
  ].join(',');

  return '\uFEFF' + [encabezados.join(','), ...filas, '', filaTotal].join('\r\n');
};