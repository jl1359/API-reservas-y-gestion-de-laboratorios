import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando poblamiento completo de la base de datos (Seeding)...');

  // 1. Roles
  const roles = [
    'Admin',
    'Docente',
    'Estudiante',
    'Auxiliar de Docencia',
    'Responsable de Laboratorio'
  ];

  for (const nombreRol of roles) {
    const existe = await prisma.rol.findFirst({ where: { nombre: nombreRol } });
    if (!existe) {
      await prisma.rol.create({ data: { nombre: nombreRol } });
    }
  }
  console.log('✅ 1. Roles del sistema registrados.');

  // 2. Carreras de la UMSS (FCyT)
  const carrerasUMSS = [
    'Ingeniería Informática',
    'Ingeniería de Sistemas',
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
    const existe = await prisma.carrera.findFirst({ where: { nombre: nombreCarrera } });
    if (!existe) {
      await prisma.carrera.create({ data: { nombre: nombreCarrera } });
    }
  }
  console.log('✅ 2. Carreras de la UMSS insertadas.');

  // 3. Equipamientos Comunes
  const equipamientos = [
    { nombre: 'Proyector Epson', tipo: 'Audiovisual' },
    { nombre: 'Pizarra Acrílica', tipo: 'Mobiliario' },
    { nombre: 'Aire Acondicionado', tipo: 'Climatización' },
    { nombre: 'Computadora Core i7', tipo: 'Hardware' },
    { nombre: 'Switch Cisco 24 Puertos', tipo: 'Redes' },
    { nombre: 'Osciloscopio Digital', tipo: 'Instrumental' }
  ];

  for (const eq of equipamientos) {
    const existe = await prisma.equipamiento.findFirst({ where: { nombre: eq.nombre } });
    if (!existe) {
      await prisma.equipamiento.create({ data: eq });
    }
  }
  console.log('✅ 3. Equipamientos base insertados.');

  // Obtener referencias clave
  const rolAdmin = await prisma.rol.findFirst({ where: { nombre: 'Admin' } });
  const rolDocente = await prisma.rol.findFirst({ where: { nombre: 'Docente' } });
  const rolEstudiante = await prisma.rol.findFirst({ where: { nombre: 'Estudiante' } });
  const carreraInformatica = await prisma.carrera.findFirst({ where: { nombre: 'Ingeniería Informática' } });
  const carreraSistemas = await prisma.carrera.findFirst({ where: { nombre: 'Ingeniería de Sistemas' } });
  const carreraFisica = await prisma.carrera.findFirst({ where: { nombre: 'Licenciatura en Física' } });

  const salt = await bcrypt.genSalt(10);
  const hashAdmin = await bcrypt.hash('Admin123!', salt);
  const hashDocente = await bcrypt.hash('Docente123!', salt);
  const hashEstudiante = await bcrypt.hash('Estudiante123!', salt);

  // 4. Usuarios de prueba verificados
  const usuariosSeed = [
    {
      correo: 'admin@umss.edu',
      nombreCompleto: 'Administrador del Sistema',
      passwordHash: hashAdmin,
      rolId: rolAdmin!.id,
      carreraId: carreraInformatica!.id,
      correoVerificado: true,
      activo: true,
      telefono: '70011223'
    },
    {
      correo: 'docente@umss.edu',
      nombreCompleto: 'Ing. Carlos Mendoza (Docente)',
      passwordHash: hashDocente,
      rolId: rolDocente!.id,
      carreraId: carreraSistemas!.id,
      correoVerificado: true,
      activo: true,
      telefono: '71122334'
    },
    {
      correo: 'estudiante@umss.edu',
      nombreCompleto: 'Juan Pérez (Estudiante)',
      passwordHash: hashEstudiante,
      rolId: rolEstudiante!.id,
      carreraId: carreraInformatica!.id,
      correoVerificado: true,
      activo: true,
      telefono: '72233445'
    }
  ];

  for (const u of usuariosSeed) {
    const existe = await prisma.usuario.findUnique({ where: { correo: u.correo } });
    if (!existe) {
      await prisma.usuario.create({ data: u });
    } else {
      await prisma.usuario.update({
        where: { correo: u.correo },
        data: {
          correoVerificado: true,
          activo: true,
          rolId: u.rolId
        }
      });
    }
  }
  console.log('✅ 4. Usuarios de demostración listos (admin@umss.edu, docente@umss.edu, estudiante@umss.edu).');

  // 5. Laboratorios iniciales
  const laboratoriosSeed = [
    {
      nombre: 'Laboratorio de Cómputo 1 (LabCom 1)',
      capacidad: 30,
      ubicacion: 'Edificio Nuevo de Informática, Piso 2',
      carreraId: carreraInformatica!.id,
      reservaPorComputadora: true,
      estadoOperativo: 'Activo',
      imagenUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80'
    },
    {
      nombre: 'Laboratorio de Redes y Telecomunicaciones',
      capacidad: 25,
      ubicacion: 'Bloque Central FCyT, Aula 104',
      carreraId: carreraSistemas!.id,
      reservaPorComputadora: false,
      estadoOperativo: 'Activo',
      imagenUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80'
    },
    {
      nombre: 'Laboratorio de Física Moderna',
      capacidad: 40,
      ubicacion: 'Edificio de Física, Planta Baja',
      carreraId: carreraFisica!.id,
      reservaPorComputadora: false,
      estadoOperativo: 'Activo',
      imagenUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'
    }
  ];

  for (const labData of laboratoriosSeed) {
    let lab = await prisma.laboratorio.findUnique({ where: { nombre: labData.nombre } });
    if (!lab) {
      lab = await prisma.laboratorio.create({ data: labData });
    }

    // Vincular Horarios de Lunes a Viernes (08:00 a 18:00)
    const countHorarios = await prisma.horarioLaboratorio.count({ where: { laboratorioId: lab.id } });
    if (countHorarios === 0) {
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      for (const dia of dias) {
        await prisma.horarioLaboratorio.create({
          data: {
            laboratorioId: lab.id,
            dia,
            horaApertura: new Date('1970-01-01T08:00:00Z'),
            horaCierre: new Date('1970-01-01T18:00:00Z')
          }
        });
      }
    }

    // Vincular Equipamientos al laboratorio
    const proyector = await prisma.equipamiento.findFirst({ where: { nombre: 'Proyector Epson' } });
    const pc = await prisma.equipamiento.findFirst({ where: { nombre: 'Computadora Core i7' } });
    const pizarra = await prisma.equipamiento.findFirst({ where: { nombre: 'Pizarra Acrílica' } });

    if (proyector) {
      const eqExiste = await prisma.laboratorioEquipamiento.findFirst({
        where: { laboratorioId: lab.id, equipamientoId: proyector.id }
      });
      if (!eqExiste) {
        await prisma.laboratorioEquipamiento.create({
          data: { laboratorioId: lab.id, equipamientoId: proyector.id, cantidad: 1 }
        });
      }
    }

    if (pc) {
      const eqExiste = await prisma.laboratorioEquipamiento.findFirst({
        where: { laboratorioId: lab.id, equipamientoId: pc.id }
      });
      if (!eqExiste) {
        await prisma.laboratorioEquipamiento.create({
          data: { laboratorioId: lab.id, equipamientoId: pc.id, cantidad: lab.capacidad }
        });
      }
    }

    if (pizarra) {
      const eqExiste = await prisma.laboratorioEquipamiento.findFirst({
        where: { laboratorioId: lab.id, equipamientoId: pizarra.id }
      });
      if (!eqExiste) {
        await prisma.laboratorioEquipamiento.create({
          data: { laboratorioId: lab.id, equipamientoId: pizarra.id, cantidad: 1 }
        });
      }
    }
  }
  console.log('✅ 5. Laboratorios, horarios y equipamientos iniciales vinculados.');

  console.log('\n🚀 ¡Poblamiento completado con éxito! El sistema está listo para pruebas y demostración.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });