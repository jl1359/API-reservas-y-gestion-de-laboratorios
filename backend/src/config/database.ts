/**
 * ARCHIVO: database.ts
 * PROPÓSITO: Instanciar y exportar la conexión a la base de datos.
 * Si usas Prisma, aquí exportarás el PrismaClient para que los servicios 
 * lo importen y lo usen (Patrón Singleton).
 */
export const prisma = new PrismaClient();
// export const prisma = new PrismaClient();
