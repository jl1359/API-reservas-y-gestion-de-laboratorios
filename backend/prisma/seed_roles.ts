import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const rolesFaltantes = ['Auxiliar de Docencia', 'Responsable de Laboratorio'];
  for (const nombreRol of rolesFaltantes) {
    const existe = await prisma.rol.findFirst({ where: { nombre: nombreRol }});
    if (!existe) await prisma.rol.create({ data: { nombre: nombreRol }});
  }
  console.log('✅ Roles adicionales insertados.');
}
main().finally(async () => { await prisma.$disconnect(); });