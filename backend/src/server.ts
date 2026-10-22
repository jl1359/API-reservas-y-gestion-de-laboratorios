import app from './app';
import { iniciarWorkerInasistencias } from './workers/inasistencias.worker';

/**
 * ARCHIVO: server.ts
 * PROPÓSITO: Punto de entrada del backend.
 * Arranca el servidor HTTP y el worker de procesos en segundo plano.
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en el puerto ${PORT}`);

  // HU-35: Iniciar proceso autónomo desatendido en segundo plano
  iniciarWorkerInasistencias(5);
});
