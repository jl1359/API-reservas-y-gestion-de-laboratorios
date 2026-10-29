import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { LABORATORIOS_REALES_FCYT } from './seed_data/laboratorios_data';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando configuracion de base de datos para produccion...');

  // 1. Roles Oficiales del Sistema (Obligatorios para autenticacion y RBAC)
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

  // 2. Carreras Oficiales de la Facultad de Ciencias y Tecnologia (FCyT - UMSS)
  const carrerasUMSS = [
    'Ingenieria de Sistemas',
    'Ingenieria Informatica',
    'Ingenieria Civil',
    'Ingenieria Industrial',
    'Ingenieria Electromecanica',
    'Ingenieria Mecanica',
    'Ingenieria Electrica',
    'Ingenieria Electronica',
    'Ingenieria Quimica',
    'Ingenieria de Alimentos',
    'Licenciatura en Biologia',
    'Licenciatura en Fisica',
    'Licenciatura en Quimica',
    'Licenciatura en Matematicas'
  ];

  for (const nombreCarrera of carrerasUMSS) {
    const existe = await prisma.carrera.findFirst({ where: { nombre: nombreCarrera } });
    if (!existe) {
      await prisma.carrera.create({ data: { nombre: nombreCarrera } });
    }
  }
  console.log('Carreras oficiales FCyT UMSS aseguradas (14 carreras).');

  let carreraSistemas = await prisma.carrera.findFirst({ where: { nombre: 'Ingenieria de Sistemas' } });
  if (!carreraSistemas) {
    carreraSistemas = await prisma.carrera.findFirst();
  }

  // 3. Catalogo Base de Equipamiento
  const equiposBase = [
    { nombre: 'Computadora', tipo: 'Computo' },
    { nombre: 'Router', tipo: 'Redes' },
    { nombre: 'Switch', tipo: 'Redes' },
    { nombre: 'Proyector', tipo: 'Audiovisual' },
    { nombre: 'Pizarra Acrilica', tipo: 'Mobiliario' },
    { nombre: 'Microscopio', tipo: 'Optica y Biologia' },
    { nombre: 'Osciloscopio', tipo: 'Instrumentacion Electronica' },
    { nombre: 'Multimetro', tipo: 'Instrumentacion Electronica' }
  ];

  for (const eq of equiposBase) {
    const existe = await prisma.equipamiento.findFirst({ where: { nombre: eq.nombre } });
    if (!existe) {
      await prisma.equipamiento.create({ data: { nombre: eq.nombre, tipo: eq.tipo } });
    } else if (existe.tipo !== eq.tipo) {
      await prisma.equipamiento.update({
        where: { id: existe.id },
        data: { tipo: eq.tipo }
      });
    }
  }
  console.log('Catalogo base de equipamiento asegurado con categorias reales.');

  // 4. Cuenta Principal de Administrador del Sistema
  const correoAdmin = 'jl1533336@gmail.com';
  const nombreAdmin = 'Jose Luis Canaviri Lopez';
  const passwordPlano = 'jl13593380';

  let adminExistente = await prisma.usuario.findUnique({ where: { correo: correoAdmin } });

  if (!adminExistente) {
    const passwordHash = await bcrypt.hash(passwordPlano, 10);
    adminExistente = await prisma.usuario.create({
      data: {
        correo: correoAdmin,
        nombreCompleto: nombreAdmin,
        passwordHash,
        rolId: rolAdmin.id,
        carreraId: carreraSistemas!.id,
        correoVerificado: true,
        activo: true
      }
    });
    console.log(`Cuenta de Administrador creada exitosamente para: ${nombreAdmin} (${correoAdmin}).`);
  } else {
    const passwordHash = await bcrypt.hash(passwordPlano, 10);
    await prisma.usuario.update({
      where: { id: adminExistente.id },
      data: {
        nombreCompleto: nombreAdmin,
        rolId: rolAdmin.id,
        passwordHash,
        correoVerificado: true,
        activo: true
      }
    });
    console.log(`Cuenta de Administrador actualizada exitosamente para: ${nombreAdmin} (${correoAdmin}).`);
  }

  // 5. Feriados Nacionales de Bolivia y Departamental Cochabamba (Fechas fijas)
  const anioActual = new Date().getFullYear();
  const feriadosFijos = [
    { fecha: new Date(Date.UTC(anioActual, 0, 1)), motivo: 'Ano Nuevo' },
    { fecha: new Date(Date.UTC(anioActual, 0, 22)), motivo: 'Dia del Estado Plurinacional de Bolivia' },
    { fecha: new Date(Date.UTC(anioActual, 4, 1)), motivo: 'Dia del Trabajo' },
    { fecha: new Date(Date.UTC(anioActual, 5, 21)), motivo: 'Ano Nuevo Andino Amazonico' },
    { fecha: new Date(Date.UTC(anioActual, 7, 6)), motivo: 'Dia de la Independencia de Bolivia' },
    { fecha: new Date(Date.UTC(anioActual, 8, 14)), motivo: 'Efemeride Departamental de Cochabamba' },
    { fecha: new Date(Date.UTC(anioActual, 10, 2)), motivo: 'Dia de Todos Santos' },
    { fecha: new Date(Date.UTC(anioActual, 11, 25)), motivo: 'Navidad' }
  ];

  for (const f of feriadosFijos) {
    const existe = await prisma.feriado.findFirst({ where: { motivo: f.motivo } });
    if (!existe) {
      await prisma.feriado.create({ data: f });
    }
  }
  console.log('Feriados oficiales con fecha fija configurados (8 feriados).');

  // 6. Laboratorios Oficiales FCyT UMSS (45 Laboratorios Reales)
  console.log(`Cargando ${LABORATORIOS_REALES_FCYT.length} laboratorios reales de la FCyT...`);

  const eqComputadora = await prisma.equipamiento.findFirst({ where: { nombre: 'Computadora' } });
  const eqProyector = await prisma.equipamiento.findFirst({ where: { nombre: 'Proyector' } });
  const eqPizarra = await prisma.equipamiento.findFirst({ where: { nombre: 'Pizarra Acrilica' } });
  const eqOsciloscopio = await prisma.equipamiento.findFirst({ where: { nombre: 'Osciloscopio' } });
  const eqMultimetro = await prisma.equipamiento.findFirst({ where: { nombre: 'Multimetro' } });
  const eqMicroscopio = await prisma.equipamiento.findFirst({ where: { nombre: 'Microscopio' } });

  const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

  for (const dataLab of LABORATORIOS_REALES_FCYT) {
    const carrera = await prisma.carrera.findFirst({
      where: { nombre: dataLab.carreraNombre }
    });

    const lab = await prisma.laboratorio.upsert({
      where: { nombre: dataLab.nombre },
      update: {
        carreraId: carrera ? carrera.id : null,
        capacidad: dataLab.capacidad,
        ubicacion: dataLab.ubicacion,
        latitud: dataLab.latitud,
        longitud: dataLab.longitud,
        reservaPorComputadora: dataLab.reservaPorComputadora,
        imagenUrl: dataLab.imagenUrl,
        estadoOperativo: 'Activo'
      },
      create: {
        nombre: dataLab.nombre,
        carreraId: carrera ? carrera.id : null,
        capacidad: dataLab.capacidad,
        ubicacion: dataLab.ubicacion,
        latitud: dataLab.latitud,
        longitud: dataLab.longitud,
        reservaPorComputadora: dataLab.reservaPorComputadora,
        imagenUrl: dataLab.imagenUrl,
        estadoOperativo: 'Activo'
      }
    });

    // Horarios operativos estandar facultativos
    for (const dia of diasSemana) {
      const apertura = dia === 'Sabado'
        ? new Date('1970-01-01T08:00:00Z')
        : new Date('1970-01-01T06:45:00Z');
      const cierre = dia === 'Sabado'
        ? new Date('1970-01-01T12:45:00Z')
        : new Date('1970-01-01T21:15:00Z');

      const horarioExistente = await prisma.horarioLaboratorio.findFirst({
        where: { laboratorioId: lab.id, dia }
      });

      if (!horarioExistente) {
        await prisma.horarioLaboratorio.create({
          data: {
            laboratorioId: lab.id,
            dia,
            horaApertura: apertura,
            horaCierre: cierre
          }
        });
      }
    }

    // Equipamiento base segun tipo de laboratorio
    if (eqPizarra) {
      const asignado = await prisma.laboratorioEquipamiento.findFirst({
        where: { laboratorioId: lab.id, equipamientoId: eqPizarra.id }
      });
      if (!asignado) {
        await prisma.laboratorioEquipamiento.create({
          data: { laboratorioId: lab.id, equipamientoId: eqPizarra.id, cantidad: 1 }
        });
      }
    }

    if (eqProyector) {
      const asignado = await prisma.laboratorioEquipamiento.findFirst({
        where: { laboratorioId: lab.id, equipamientoId: eqProyector.id }
      });
      if (!asignado) {
        await prisma.laboratorioEquipamiento.create({
          data: { laboratorioId: lab.id, equipamientoId: eqProyector.id, cantidad: 1 }
        });
      }
    }

    if (dataLab.reservaPorComputadora && eqComputadora) {
      const asignado = await prisma.laboratorioEquipamiento.findFirst({
        where: { laboratorioId: lab.id, equipamientoId: eqComputadora.id }
      });
      if (!asignado) {
        await prisma.laboratorioEquipamiento.create({
          data: { laboratorioId: lab.id, equipamientoId: eqComputadora.id, cantidad: dataLab.capacidad }
        });
      }
    }

    if (dataLab.carreraNombre.includes('Electrica') || dataLab.carreraNombre.includes('Electronica')) {
      if (eqOsciloscopio) {
        const asig = await prisma.laboratorioEquipamiento.findFirst({
          where: { laboratorioId: lab.id, equipamientoId: eqOsciloscopio.id }
        });
        if (!asig) {
          await prisma.laboratorioEquipamiento.create({
            data: { laboratorioId: lab.id, equipamientoId: eqOsciloscopio.id, cantidad: 10 }
          });
        }
      }
      if (eqMultimetro) {
        const asig = await prisma.laboratorioEquipamiento.findFirst({
          where: { laboratorioId: lab.id, equipamientoId: eqMultimetro.id }
        });
        if (!asig) {
          await prisma.laboratorioEquipamiento.create({
            data: { laboratorioId: lab.id, equipamientoId: eqMultimetro.id, cantidad: 15 }
          });
        }
      }
    }

    if (dataLab.carreraNombre.includes('Biologia') || dataLab.carreraNombre.includes('Alimentos')) {
      if (eqMicroscopio) {
        const asig = await prisma.laboratorioEquipamiento.findFirst({
          where: { laboratorioId: lab.id, equipamientoId: eqMicroscopio.id }
        });
        if (!asig) {
          await prisma.laboratorioEquipamiento.create({
            data: { laboratorioId: lab.id, equipamientoId: eqMicroscopio.id, cantidad: 12 }
          });
        }
      }
    }
  }

  console.log(`Configuracion exitosa de los 45 laboratorios reales con sus horarios y equipamientos.`);
  console.log('Base de datos inicializada de forma limpia, real y lista para produccion.');
}

main()
  .catch((e) => {
    console.error('Error durante la inicializacion limpia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
