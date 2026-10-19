import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de migración física en PostgreSQL para HU-15 (Motor de Concurrencia):
 * 1. Habilita la extensión btree_gist en PostgreSQL.
 * 2. Aplica restricción CHECK para validar que fecha_fin > fecha_inicio.
 * 3. Aplica restricción de exclusión EXCLUDE USING gist sobre laboratorio_id,
 *    numero_computadora y tsrange(fecha_inicio, fecha_fin, '[)') para evitar matemáticamente
 *    solapamientos en reservas 'Pendiente', 'Aprobada' y 'Confirmada'.
 */
export async function aplicarRestriccionConcurrencia() {
  console.log('--- APLICANDO EXTENSIÓN Y RESTRICCIÓN FÍSICA EN POSTGRESQL (HU-15) ---');
  try {
    // 1. Habilitar extensión btree_gist
    console.log('1. Creando extensión btree_gist si no existe...');
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);
    console.log('✓ Extensión btree_gist activa.');

    // 2. Limpiar restricciones previas si existen
    console.log('2. Limpiando restricciones anteriores de reservas si existen...');
    await prisma.$executeRawUnsafe(`ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_sin_solapamiento;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_rango_valido;`);

    // 3. Crear restricción de rango válido
    console.log('3. Creando constraint reservas_rango_valido (fecha_fin > fecha_inicio)...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE reservas
      ADD CONSTRAINT reservas_rango_valido
      CHECK (fecha_fin > fecha_inicio);
    `);
    console.log('✓ Restricción reservas_rango_valido creada.');

    // 4. Crear restricción de exclusión física EXCLUDE USING gist
    console.log('4. Creando constraint de exclusión matemática reservas_sin_solapamiento...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE reservas
      ADD CONSTRAINT reservas_sin_solapamiento
      EXCLUDE USING gist (
        laboratorio_id WITH =,
        COALESCE(numero_computadora, 0) WITH =,
        tsrange(fecha_inicio, fecha_fin, '[)') WITH &&
      ) WHERE (estado IN ('Pendiente', 'Aprobada', 'Confirmada'));
    `);
    console.log('✓ Restricción reservas_sin_solapamiento (EXCLUDE USING gist) creada con éxito.');
    console.log('--- MOTOR DE CONCURRENCIA HU-15 APLICADO EXITOSAMENTE ---');
  } catch (error) {
    console.error('Error al aplicar la restricción en PostgreSQL:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  aplicarRestriccionConcurrencia().catch(() => process.exit(1));
}
