import app from './app';
import { prisma } from './config/prisma';
import { iniciarWorkerInasistencias } from './workers/inasistencias.worker';

/**
 * ARCHIVO: server.ts
 * PROPOSITO: Punto de entrada del backend con protocolos de resiliencia y proteccion de caidas.
 */

// Protocolo de resiliencia: Atrapa excepciones no capturadas y previene caidas del proceso
process.on('uncaughtException', (error) => {
  console.error('ALERTA DE SEGURIDAD: Excepcion no controlada capturada:', error);
});

// Protocolo de resiliencia: Atrapa promesas rechazadas no manejadas
process.on('unhandledRejection', (reason) => {
  console.error('ALERTA DE SEGURIDAD: Rechazo de promesa no controlado capturado:', reason);
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en el puerto ${PORT}`);

  // HU-35: Iniciar proceso autonomo desatendido en segundo plano
  iniciarWorkerInasistencias(5);
});

// Protocolo de alta disponibilidad: Apagado controlado (Graceful Shutdown)
const apagarServidor = async (senal: string) => {
  console.log(`Recibida senal ${senal}. Iniciando apagado seguro y ordenado...`);

  server.close(async () => {
    console.log('Servidor HTTP cerrado exitosamente.');
    try {
      await prisma.$disconnect();
      console.log('Conexion con la base de datos cerrada.');
      process.exit(0);
    } catch (err) {
      console.error('Error al desconectar la base de datos:', err);
      process.exit(1);
    }
  });

  // Forzar salida si el servidor tarda mas de 10 segundos en liberar conexiones
  setTimeout(() => {
    console.error('Tiempo maximo de espera excedido. Forzando detencion del servidor.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => apagarServidor('SIGTERM'));
process.on('SIGINT', () => apagarServidor('SIGINT'));