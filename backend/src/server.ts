import app from './app';

/**
 * ARCHIVO: server.ts
 * PROPÓSITO: Es el punto de entrada de la aplicación.
 * Únicamente se encarga de arrancar el servidor HTTP en el puerto especificado.
 * No debe contener lógica de rutas ni configuraciones de Express.
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en el puerto ${PORT}`);
});
