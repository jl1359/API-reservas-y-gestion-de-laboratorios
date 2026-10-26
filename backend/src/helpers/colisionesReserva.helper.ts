import { prisma } from '../config/prisma';
import { validarHorarioOperativo } from './horarioOperativo.helper';

export const ESTADOS_ACTIVOS = ['Pendiente', 'Aprobada', 'Confirmada'];

export interface BloqueHorario {
  inicio: Date;
  fin: Date;
}

/**
 * Genera la secuencia de fechas para una reserva puntual o una serie semestral recurrente.
 */
export function generarBloquesReserva(
  inicio: Date,
  fin: Date,
  recurrente?: boolean,
  fechaFinSemestre?: string
): BloqueHorario[] {
  const bloques: BloqueHorario[] = [];

  if (recurrente) {
    if (!fechaFinSemestre) {
      throw new Error('Debes proporcionar la fecha de fin de semestre para reservas recurrentes');
    }
    const finSemestre = new Date(fechaFinSemestre);
    if (isNaN(finSemestre.getTime()) || finSemestre <= inicio) {
      throw new Error('La fecha de fin de semestre debe ser posterior a la fecha de inicio');
    }

    let curInicio = new Date(inicio.getTime());
    let curFin = new Date(fin.getTime());

    while (curInicio <= finSemestre) {
      bloques.push({ inicio: new Date(curInicio), fin: new Date(curFin) });
      curInicio = new Date(curInicio.getTime() + 7 * 24 * 60 * 60 * 1000);
      curFin = new Date(curFin.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  } else {
    bloques.push({ inicio, fin });
  }

  return bloques;
}

/**
 * Valida que ninguno de los bloques solicitados colisione con horarios operativos, feriados o mantenimientos técnicos.
 */
export async function validarFeriadosYMantenimientos(
  bloques: BloqueHorario[],
  laboratorioId: number,
  horarios: any[]
): Promise<void> {
  const feriados = await prisma.feriado.findMany({ where: { bloqueoActivo: true } });

  for (const bloque of bloques) {
    const valHorario = validarHorarioOperativo(horarios, bloque.inicio, bloque.fin);
    if (!valHorario.valido) {
      const err: any = new Error(valHorario.error || 'Horario no operativo');
      err.status = 400;
      throw err;
    }

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
      const err: any = new Error(
        `No se puede reservar el ${bloque.inicio.toLocaleDateString()}: coincide con feriado (${feriadoCoincidente.motivo})`
      );
      err.status = 409;
      err.code = 'FERIADO_BLOQUEADO';
      throw err;
    }

    const mantenimientoCoincidente = await prisma.mantenimiento.findFirst({
      where: {
        laboratorioId,
        fechaInicio: { lt: bloque.fin },
        fechaFin: { gt: bloque.inicio }
      }
    });

    if (mantenimientoCoincidente) {
      const err: any = new Error(
        `No se puede reservar el ${bloque.inicio.toLocaleDateString()}: laboratorio en mantenimiento (${mantenimientoCoincidente.motivo})`
      );
      err.status = 409;
      err.code = 'MANTENIMIENTO_BLOQUEADO';
      throw err;
    }
  }
}
