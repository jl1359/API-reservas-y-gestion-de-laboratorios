import app from './app';
import { env } from './config/env';

/**
 * ARCHIVO: server.ts
 * PROPÓSITO: Punto de entrada principal del servidor HTTP.
 */
const server = app.listen(env.PORT, () => {
  console.log(`🚀 Servidor Backend corriendo en http://localhost:${env.PORT} en modo [${env.NODE_ENV}]`);
});

export default server;
