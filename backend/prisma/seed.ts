import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando configuracion limpia de base de datos para produccion...');

  // 1. Roles Oficiales del Sistema (Obligatorios para la autenticacion y control de acceso)
  const rolesOficiales = [
    'Administrador',
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

  const rolAdmin = await prisma.rol.findFirst({
    where: { nombre: { in: ['Administrador', 'Admin'] } }
  });
  if (!rolAdmin) throw new Error('No se encontro el rol Administrador');

  // 2. Carreras de la Facultad de Ciencias y Tecnologia (UMSS)
  const carrerasUMSS = [
    'Ingenieria de Sistemas',
    'Ingenieria Informatica',
    'Ingenieria Civil',
    'Ingenieria Industrial',
    'Ingenieria Electromecanica',
    'Ingenieria Quimica',
    'Licenciatura en Biologia',
    'Licenciatura en Fisica'
  ];

  for (const nombreCarrera of carrerasUMSS) {
    const existe = await prisma.carrera.findFirst({ where: { nombre: nombreCarrera } });
    if (!existe) {
      await prisma.carrera.create({ data: { nombre: nombreCarrera } });
    }
  }
  console.log('Carreras oficiales FCyT aseguradas.');

  let carreraSistemas = await prisma.carrera.findFirst({ where: { nombre: 'Ingenieria de Sistemas' } });
  if (!carreraSistemas) {
    carreraSistemas = await prisma.carrera.findFirst();
  }

  // 3. Catalogo Base de Equipamiento
  const equiposBase = [
    'Computadora',
    'Router',
    'Switch',
    'Proyector',
    'Pizarra Acrilica',
    'Microscopio',
    'Osciloscopio',
    'Multimetro'
  ];

  for (const nombre of equiposBase) {
    const existe = await prisma.equipamiento.findFirst({ where: { nombre } });
    if (!existe) {
      await prisma.equipamiento.create({ data: { nombre, tipo: 'Hardware' } });
    }
  }
  console.log('Catalogo base de equipamiento asegurado.');

  // 4. Usuario Administrador Inicial del Sistema
  const correoAdmin = 'admin@umss.edu';
  let adminExistente = await prisma.usuario.findUnique({ where: { correo: correoAdmin } });

  if (!adminExistente) {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    adminExistente = await prisma.usuario.create({
      data: {
        correo: correoAdmin,
        nombreCompleto: 'Administrador General',
        passwordHash,
        rolId: rolAdmin.id,
        carreraId: carreraSistemas!.id,
        correoVerificado: true,
        activo: true
      }
    });
    console.log(`Usuario Administrador inicial creado exitosamente (${correoAdmin}).`);
  } else {
    console.log(`Usuario Administrador (${correoAdmin}) ya existe en el sistema.`);
  }

  // 5. Feriados Iniciales Oficiales
  const anioActual = new Date().getFullYear();
  const feriadosBase = [
    { fecha: new Date(anioActual, 0, 1), motivo: 'Ano Nuevo' },
    { fecha: new Date(anioActual, 4, 1), motivo: 'Dia del Trabajo' },
    { fecha: new Date(anioActual, 11, 25), motivo: 'Navidad' }
  ];

  for (const f of feriadosBase) {
    const existe = await prisma.feriado.findFirst({ where: { motivo: f.motivo } });
    if (!existe) {
      await prisma.feriado.create({ data: f });
    }
  }
  console.log('Feriados basicos configurados.');

  console.log('Base de datos inicializada de forma limpia y lista para produccion.');
}

main()
  .catch((e) => {
    console.error('Error durante la inicializacion limpia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
