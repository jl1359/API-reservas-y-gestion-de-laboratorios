import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando poblamiento de la base de datos (Seeding completo)...');

  // 1. Roles institucionales (Los 5 roles oficiales del sistema)
  const rolesOficiales = [
    'Admin',
    'Docente',
    'Estudiante',
    'Responsable de Laboratorio',
    'Auxiliar de Docencia'
  ];

  for (const nombreRol of rolesOficiales) {
    const existe = await prisma.rol.findFirst({ where: { nombre: nombreRol } });
    if (!existe) {
      await prisma.rol.create({ data: { nombre: nombreRol } });
    }
  }
  console.log('Roles oficiales asegurados (5 roles).');

  const roles = await prisma.rol.findMany();
  const getRolId = (nombre: string) => roles.find(r => r.nombre === nombre)?.id || 3;

  // 2. Carreras de la UMSS (FCyT)
  const carrerasUMSS = [
    'Ingeniería de Sistemas',
    'Ingeniería Informática',
    'Ingeniería Civil',
    'Ingeniería Industrial',
    'Ingeniería Electromecánica',
    'Ingeniería Química',
    'Licenciatura en Biología',
    'Licenciatura en Física'
  ];

  for (const nombreCarrera of carrerasUMSS) {
    const existe = await prisma.carrera.findFirst({ where: { nombre: nombreCarrera } });
    if (!existe) {
      await prisma.carrera.create({ data: { nombre: nombreCarrera } });
    }
  }
  console.log('Carreras FCyT insertadas.');

  let carreraSistemas = await prisma.carrera.findFirst({ where: { nombre: 'Ingeniería de Sistemas' } });
  if (!carreraSistemas) {
    carreraSistemas = await prisma.carrera.findFirst();
  }

  // 3. Usuarios de Prueba para cada Rol
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const usuariosData = [
    { correo: 'admin@umss.edu', nombreCompleto: 'Administrador General', rolId: getRolId('Admin') },
    { correo: 'docente1@umss.edu', nombreCompleto: 'Docente Prueba Uno', rolId: getRolId('Docente') },
    { correo: 'docente2@umss.edu', nombreCompleto: 'Docente Prueba Dos', rolId: getRolId('Docente') },
    { correo: 'estudiante1@umss.edu', nombreCompleto: 'Estudiante Prueba Uno', rolId: getRolId('Estudiante') },
    { correo: 'estudiante2@umss.edu', nombreCompleto: 'Estudiante Prueba Dos', rolId: getRolId('Estudiante') },
    { correo: 'responsable@umss.edu', nombreCompleto: 'Resp. Laboratorio Prueba', rolId: getRolId('Responsable de Laboratorio') },
    { correo: 'auxiliar@umss.edu', nombreCompleto: 'Auxiliar Prueba', rolId: getRolId('Auxiliar de Docencia') }
  ];

  const usuariosCreados: Record<string, any> = {};
  for (const u of usuariosData) {
    let user = await prisma.usuario.findUnique({ where: { correo: u.correo } });
    if (!user) {
      user = await prisma.usuario.create({
        data: {
          ...u,
          passwordHash,
          carreraId: carreraSistemas!.id,
          correoVerificado: true,
          activo: true
        }
      });
    }
    usuariosCreados[u.correo] = user;
  }
  console.log('Usuarios de prueba generados para cada rol.');

  // 4. Catálogo de Equipamiento
  const equiposNombres = [
    'Computadora',
    'Router',
    'Switch',
    'Proyector',
    'Pizarra Acrílica',
    'Microscopio',
    'Osciloscopio',
    'Multímetro'
  ];

  const equiposMap: Record<string, any> = {};
  for (const nombre of equiposNombres) {
    let eq = await prisma.equipamiento.findFirst({ where: { nombre } });
    if (!eq) {
      eq = await prisma.equipamiento.create({ data: { nombre, tipo: 'Hardware' } });
    }
    equiposMap[nombre] = eq;
  }
  console.log('Equipamientos base asegurados.');

  // 5. Laboratorios con modalidades y horarios
  const labsData = [
    { nombre: 'Laboratorio de Redes', capacidad: 30, reservaPorComputadora: false, equipos: { 'Router': 15, 'Switch': 15, 'Computadora': 30, 'Proyector': 1 } },
    { nombre: 'Laboratorio de Cómputo 1', capacidad: 40, reservaPorComputadora: true, equipos: { 'Computadora': 40, 'Proyector': 1 } },
    { nombre: 'Laboratorio de Cómputo 2', capacidad: 40, reservaPorComputadora: false, equipos: { 'Computadora': 40, 'Proyector': 1 } },
    { nombre: 'Laboratorio de Física', capacidad: 25, reservaPorComputadora: false, equipos: { 'Osciloscopio': 10, 'Multímetro': 15 } },
    { nombre: 'Laboratorio de Química', capacidad: 25, reservaPorComputadora: false, equipos: { 'Microscopio': 10 } }
  ];

  const labsCreados: Record<string, any> = {};
  for (const lab of labsData) {
    let l = await prisma.laboratorio.findUnique({ where: { nombre: lab.nombre } });
    if (!l) {
      l = await prisma.laboratorio.create({
        data: {
          nombre: lab.nombre,
          capacidad: lab.capacidad,
          reservaPorComputadora: lab.reservaPorComputadora,
          estadoOperativo: 'Activo',
          carreraId: carreraSistemas?.id || null
        }
      });

      // Horarios semanales
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      for (const dia of dias) {
        await prisma.horarioLaboratorio.create({
          data: {
            laboratorioId: l.id,
            dia,
            horaApertura: new Date('1970-01-01T08:00:00Z'),
            horaCierre: new Date('1970-01-01T18:00:00Z')
          }
        });
      }

      // Equipamiento relacional
      for (const [eqName, qty] of Object.entries(lab.equipos)) {
        if (equiposMap[eqName]) {
          await prisma.laboratorioEquipamiento.create({
            data: {
              laboratorioId: l.id,
              equipamientoId: equiposMap[eqName].id,
              cantidad: qty as number
            }
          });
        }
      }
    }
    labsCreados[lab.nombre] = l;
  }
  console.log('Laboratorios y horarios configurados.');

  // 6. Feriados
  const feriados = [
    { fecha: new Date(new Date().getFullYear(), 11, 25), motivo: 'Navidad' },
    { fecha: new Date(new Date().getFullYear() + 1, 0, 1), motivo: 'Año Nuevo' },
    { fecha: new Date(new Date().getFullYear(), 4, 1), motivo: 'Día del Trabajo' }
  ];
  for (const f of feriados) {
    const exist = await prisma.feriado.findFirst({ where: { motivo: f.motivo } });
    if (!exist) await prisma.feriado.create({ data: f });
  }

  // 7. Reservas Estratégicas para Pruebas (incluyendo token QR para HU-22 y HU-23)
  await prisma.reserva.deleteMany({});
  const ahora = new Date();

  const reservasData = [
    // Reserva Pasada
    {
      usuarioId: usuariosCreados['docente1@umss.edu'].id,
      laboratorioId: labsCreados['Laboratorio de Redes'].id,
      fechaInicio: new Date(ahora.getTime() - 86400000 * 3),
      fechaFin: new Date(ahora.getTime() - 86400000 * 3 + 7200000),
      estado: 'Completada',
      motivo: 'Clase de Redes I'
    },
    // Reserva Aprobada Vigente Hoy (Lista para probar QR ahora mismo)
    {
      usuarioId: usuariosCreados['docente1@umss.edu'].id,
      laboratorioId: labsCreados['Laboratorio de Redes'].id,
      fechaInicio: new Date(ahora.getTime() - 15 * 60 * 1000), // Inició hace 15 min
      fechaFin: new Date(ahora.getTime() + 105 * 60 * 1000),   // Termina en 1h45m
      estado: 'Aprobada',
      motivo: 'Evaluación Práctica Redes',
      tokenQr: 'qr_test_aprobada_hoy_123456789'
    },
    // Reserva de PC Individual Aprobada
    {
      usuarioId: usuariosCreados['estudiante1@umss.edu'].id,
      laboratorioId: labsCreados['Laboratorio de Cómputo 1'].id,
      fechaInicio: new Date(ahora.getTime() + 86400000),
      fechaFin: new Date(ahora.getTime() + 86400000 + 3600000),
      numeroComputadora: 12,
      estado: 'Aprobada',
      motivo: 'Práctica de Programación',
      tokenQr: 'qr_test_pc12_estudiante1_987654321'
    },
    // Reserva Pendiente (Para probar bloqueo de QR)
    {
      usuarioId: usuariosCreados['estudiante2@umss.edu'].id,
      laboratorioId: labsCreados['Laboratorio de Cómputo 1'].id,
      fechaInicio: new Date(ahora.getTime() + 86400000 * 2),
      fechaFin: new Date(ahora.getTime() + 86400000 * 2 + 3600000),
      numeroComputadora: 5,
      estado: 'Pendiente',
      motivo: 'Trabajo Final de Grado'
    }
  ];

  for (const r of reservasData) {
    await prisma.reserva.create({ data: r });
  }
  console.log('Reservas de prueba inyectadas (incluyendo casos aprobados con QR y pendientes).');

  console.log('Seeding completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });