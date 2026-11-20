import https from 'https';
import http from 'http';

/**
 * Worker Autonomo de Keep-Alive
 * Realiza un auto-ping al endpoint /api/health cada 10 minutos para mantener
 * caliente el contenedor de Render y mantener activa la base de datos de Supabase.
 */
export const iniciarWorkerKeepAlive = (intervaloMinutos = 10) => {
  const healthUrl = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/api/health`
    : (process.env.CLIENT_URL && process.env.NODE_ENV === 'production'
        ? 'https://api-reservas-y-gestion-de-laboratorios.onrender.com/api/health'
        : `http://localhost:${process.env.PORT || 3000}/api/health`);

  console.log(`[Worker Keep-Alive] Iniciado. Ping programado a: ${healthUrl} cada ${intervaloMinutos} minutos.`);

  const ejecutarPing = () => {
    try {
      const client = healthUrl.startsWith('https') ? https : http;
      client.get(healthUrl, (res) => {
        if (res.statusCode === 200) {
          console.log(`[Worker Keep-Alive] Ping exitoso (HTTP ${res.statusCode}) - Backend y Supabase activos.`);
        } else {
          console.warn(`[Worker Keep-Alive] Ping respondio con codigo HTTP: ${res.statusCode}`);
        }
      }).on('error', (err) => {
        console.error('[Worker Keep-Alive] Error al despachar auto-ping:', err.message);
      });
    } catch (err: any) {
      console.error('[Worker Keep-Alive] Excepcion inesperada en auto-ping:', err.message);
    }
  };

  // Primer ping tras 45 segundos de haber iniciado el servidor
  setTimeout(ejecutarPing, 45000);

  // Intervalo periodico recurrente
  const timer = setInterval(ejecutarPing, intervaloMinutos * 60 * 1000);

  return () => clearInterval(timer);
};
