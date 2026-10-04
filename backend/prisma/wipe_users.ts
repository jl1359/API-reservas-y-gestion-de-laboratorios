import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.usuario.deleteMany({});
  console.log('✅ Todos los usuarios han sido eliminados correctamente.');
}
main().finally(async () => { await prisma.$disconnect(); });