import { procesarInasistenciasPendientes } from '../services/sanciones.service';

/**
 * Worker Autónomo de Barrido de Inasistencias (HU-35)
 * Ejecuta periódicamente la verificación de reservas vencidas sin QR validado
 * tras la ventana de tolerancia de 15 minutos, aplicando la sanción de 24h.
 */
export const iniciarWorkerInasistencias = (intervaloMinutos = 5) => {
  console.log(`[Worker Inasistencias] Iniciado. Frecuencia de barrido: cada ${intervaloMinutos} minutos.`);

  const ejecutarBarrido = async () => {
    try {
      const resultado = await procesarInasistenciasPendientes();
      if (resultado.totalSancionadas > 0) {
        console.log(`[Worker Inasistencias] ${resultado.totalSancionadas} reserva(s) no asistida(s) marcadas como Ausente y sancionadas.`);
      }
    } catch (error: any) {
      console.error('[Worker Inasistencias] Error durante el barrido automático:', error.message);
    }
  };

  // Ejecución inicial diferida (10 segundos tras levantar el servidor)
  setTimeout(ejecutarBarrido, 10000);

  // Intervalo recurrente
  const timer = setInterval(ejecutarBarrido, intervaloMinutos * 60 * 1000);

  return () => clearInterval(timer);
};