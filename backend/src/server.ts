import app from './app';
import { procesarInasistenciasPendientes } from './services/sanciones.service';

/**
 * ARCHIVO: server.ts
 * PROPÓSITO: Es el punto de entrada de la aplicación.
 * Únicamente se encarga de arrancar el servidor HTTP en el puerto especificado.
 * No debe contener lógica de rutas ni configuraciones de Express.
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en el puerto ${PORT}`);

  // HU-30: Verificación periódica automática de inasistencias cada 5 minutos
  setInterval(() => {
    procesarInasistenciasPendientes().catch((err) => {
      console.warn('Advertencia en barrido automático de inasistencias:', err);
    });
  }, 5 * 60 * 1000);
});

