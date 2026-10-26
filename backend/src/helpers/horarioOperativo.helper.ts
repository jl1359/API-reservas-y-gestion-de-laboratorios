import { Prisma } from '@prisma/client';

export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

export const contarComputadoras = (
  laboratorio: Prisma.LaboratorioGetPayload<{
    include: { equipos: { include: { equipamiento: true } } };
  }>
) => {
  const cantidadRegistrada = laboratorio.equipos
    .filter(({ equipamiento }) => equipamiento.nombre.toLocaleLowerCase().includes('computadora'))
    .reduce((total, equipo) => total + equipo.cantidad, 0);

  return cantidadRegistrada || laboratorio.capacidad;
};

export function validarHorarioOperativo(horarios: any[], inicio: Date, fin: Date) {
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