import { PrismaClient } from '@prisma/client';

/**
 * ARCHIVO: database.ts
  * PROPÓSITO: Instanciar y exportar la conexión a la base de datos.
 * Si usas Prisma, aquí exportarás el PrismaClient para que los servicios 
 * lo importen y lo usen (Patrón Singleton).
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
