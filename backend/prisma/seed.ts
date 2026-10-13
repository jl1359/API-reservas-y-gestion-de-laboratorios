import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando poblamiento de la base de datos (Seeding)...');

  // 1. Llenar Roles
  const roles = ['Admin', 'Docente', 'Estudiante'];
  for (const nombreRol of roles) {
    await prisma.rol.upsert({
      where: { id: roles.indexOf(nombreRol) + 1 }, // Solo para intentar mantener un ID predecible
      update: { nombre: nombreRol },
      create: { nombre: nombreRol },
    }).catch(async () => {
        // Fallback en caso de que busque por ID y no coincida con un upsert de nombre, mejor buscar el primero o crear
        const existe = await prisma.rol.findFirst({ where: { nombre: nombreRol }});
        if (!existe) await prisma.rol.create({ data: { nombre: nombreRol }});
    });
  }
  console.log('✅ Roles base insertados.');

  // 2. Llenar Carreras de la UMSS (FCyT)
  const carrerasUMSS = [
    'Ingeniería de Sistemas',
    'Ingeniería Informática',
    'Ingeniería Civil',
    'Ingeniería Industrial',
    'Ingeniería Electromecánica',
    'Ingeniería Química',
    'Ingeniería de Alimentos',
    'Licenciatura en Matemáticas',
    'Licenciatura en Física',
    'Licenciatura en Química',
    'Licenciatura en Biología',
    'Sin Especificar'
  ];

  for (const nombreCarrera of carrerasUMSS) {
    const existe = await prisma.carrera.findFirst({ where: { nombre: nombreCarrera }});
    if (!existe) {
      await prisma.carrera.create({ data: { nombre: nombreCarrera }});
    }
  }
  console.log('✅ Carreras de la UMSS insertadas.');

  // 3. Llenar Equipamientos Comunes
  const equipamientos = [
    { nombre: 'Proyector Epson', tipo: 'Audiovisual' },
    { nombre: 'Pizarra Acrílica', tipo: 'Mobiliario' },
    { nombre: 'Aire Acondicionado', tipo: 'Climatización' },
    { nombre: 'Computadora Core i7', tipo: 'Hardware' }
  ];

  for (const eq of equipamientos) {
    const existe = await prisma.equipamiento.findFirst({ where: { nombre: eq.nombre }});
    if (!existe) {
      await prisma.equipamiento.create({ data: eq });
    }
  }
  console.log('✅ Equipamientos base insertados.');

  console.log('¡Seeding completado con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });