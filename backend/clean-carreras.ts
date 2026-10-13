import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanDuplicates() {
  const carreras = await prisma.carrera.findMany({
    orderBy: { id: 'asc' }
  });

  const vistos = new Set();
  let eliminados = 0;

  for (const carrera of carreras) {
    if (vistos.has(carrera.nombre)) {
      await prisma.carrera.delete({ where: { id: carrera.id } });
      eliminados++;
    } else {
      vistos.add(carrera.nombre);
    }
  }

  console.log('Limpieza completada. Se eliminaron ' + eliminados + ' carreras duplicadas.');
}

cleanDuplicates().catch(console.error).finally(() => prisma.$disconnect());