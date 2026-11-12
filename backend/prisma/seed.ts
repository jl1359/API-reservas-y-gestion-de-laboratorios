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
    { nombre: 'Multimetro', tipo: 'Instrumentacion Electronica' },
    { nombre: 'Camara', tipo: 'Audiovisual' },
    { nombre: 'Camara de Seguridad', tipo: 'Audiovisual y Multimedia' }
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

  // 5. Feriados Nacionales, Departamental y Calendario Conmemorativo UMSS
  const anioActual = new Date().getFullYear();
  const feriadosFijos = [
    { fecha: new Date(Date.UTC(anioActual, 0, 1)), motivo: 'Año Nuevo' },
    ...(anioActual !== 2026
      ? [
          { fecha: new Date(Date.UTC(anioActual, 0, 22)), motivo: 'Día de la Fundación del Estado Plurinacional' },
          { fecha: new Date(Date.UTC(anioActual, 5, 21)), motivo: 'Año Nuevo Andino Amazónico Chaqueño' }
        ]
      : []),
    { fecha: new Date(Date.UTC(anioActual, 4, 1)), motivo: 'Día del Trabajo' },
    { fecha: new Date(Date.UTC(anioActual, 7, 6)), motivo: 'Aniversario de Bolivia' },
    { fecha: new Date(Date.UTC(anioActual, 8, 14)), motivo: 'Aniversario de Cochabamba' },
    { fecha: new Date(Date.UTC(anioActual, 8, 21)), motivo: 'Día del Estudiante' },
    { fecha: new Date(Date.UTC(anioActual, 10, 2)), motivo: 'Todos Santos' },
    { fecha: new Date(Date.UTC(anioActual, 11, 25)), motivo: 'Navidad' }
  ];

  // Fechas móviles y traslados oficiales de la gestión 2026
  const feriadosUmss2026 = [
    { fecha: new Date(Date.UTC(2026, 0, 23)), motivo: 'Día de la Fundación del Estado Plurinacional' },
    { fecha: new Date(Date.UTC(2026, 1, 16)), motivo: 'Lunes de Carnaval' },
    { fecha: new Date(Date.UTC(2026, 1, 17)), motivo: 'Martes de Carnaval' },
    { fecha: new Date(Date.UTC(2026, 3, 3)), motivo: 'Viernes Santo' },
    { fecha: new Date(Date.UTC(2026, 5, 4)), motivo: 'Corpus Christi' },
    { fecha: new Date(Date.UTC(2026, 5, 5)), motivo: 'Feriado Adicional de Corpus Christi' },
    { fecha: new Date(Date.UTC(2026, 5, 22)), motivo: 'Año Nuevo Andino Amazónico Chaqueño' },
    { fecha: new Date(Date.UTC(2026, 7, 7)), motivo: 'Feriado Adicional Aniversario de Bolivia' }
  ];

  const feriadosSeed = [...feriadosFijos, ...(anioActual === 2026 ? feriadosUmss2026 : [])];

  for (const f of feriadosSeed) {
    const existe = await prisma.feriado.findFirst({
      where: { fecha: f.fecha }
    });
    if (!existe) {
      await prisma.feriado.create({ data: f });
    }
  }
  console.log(`Feriados oficiales configurados (${feriadosSeed.length} fechas verificadas).`);

  // 6. Laboratorios Oficiales FCyT UMSS (50 Laboratorios Reales)
  console.log(`Cargando ${LABORATORIOS_REALES_FCYT.length} laboratorios reales de la FCyT...`);

  const asegurarEquipamientoLab = async (laboratorioId: number, equipamientoId: number, cantidad: number) => {
    const asignado = await prisma.laboratorioEquipamiento.findFirst({
      where: { laboratorioId, equipamientoId }
    });
    if (!asignado) {
      await prisma.laboratorioEquipamiento.create({
        data: { laboratorioId, equipamientoId, cantidad }
      });
    }
  };

  const eqCatalogo = await prisma.equipamiento.findMany();
  const eqPorNombre = new Map(eqCatalogo.map((e) => [e.nombre, e]));

  const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

  for (const dataLab of LABORATORIOS_REALES_FCYT) {
    const carrera = await prisma.carrera.findFirst({
      where: { nombre: dataLab.carreraNombre }
    });

    const labExistente = await prisma.laboratorio.findUnique({
      where: { nombre: dataLab.nombre },
      select: { imagenUrl: true }
    });

    const conservarImagenExistente = Boolean(labExistente?.imagenUrl?.startsWith('data:image/'));

    const lab = await prisma.laboratorio.upsert({
      where: { nombre: dataLab.nombre },
      update: {
        carreraId: carrera ? carrera.id : null,
        capacidad: dataLab.capacidad,
        ubicacion: dataLab.ubicacion,
        latitud: dataLab.latitud,
        longitud: dataLab.longitud,
        reservaPorComputadora: dataLab.reservaPorComputadora,
        ...(conservarImagenExistente ? {} : { imagenUrl: dataLab.imagenUrl }),
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

    // Horarios operativos (personalizados o estandar facultativos)
    const horariosObjetivo = dataLab.horariosPersonalizados
      ? dataLab.horariosPersonalizados
      : diasSemana.map((dia) => ({
          dia,
          apertura: dia === 'Sabado' ? '08:00:00' : '06:45:00',
          cierre: dia === 'Sabado' ? '12:45:00' : '21:15:00'
        }));

    for (const h of horariosObjetivo) {
      const apertura = new Date(`1970-01-01T${h.apertura}Z`);
      const cierre = new Date(`1970-01-01T${h.cierre}Z`);

      const horarioExistente = await prisma.horarioLaboratorio.findFirst({
        where: { laboratorioId: lab.id, dia: h.dia }
      });

      if (!horarioExistente) {
        await prisma.horarioLaboratorio.create({
          data: {
            laboratorioId: lab.id,
            dia: h.dia,
            horaApertura: apertura,
            horaCierre: cierre
          }
        });
      }
    }

    // Equipamiento (personalizado o estandar segun tipo de laboratorio)
    if (dataLab.equiposPersonalizados) {
      for (const eqItem of dataLab.equiposPersonalizados) {
        const eq = eqPorNombre.get(eqItem.nombre);
        if (eq) {
          await asegurarEquipamientoLab(lab.id, eq.id, eqItem.cantidad);
        }
      }
    } else {
      const eqComputadora = eqPorNombre.get('Computadora');
      const eqProyector = eqPorNombre.get('Proyector');
      const eqPizarra = eqPorNombre.get('Pizarra Acrilica');
      const eqOsciloscopio = eqPorNombre.get('Osciloscopio');
      const eqMultimetro = eqPorNombre.get('Multimetro');
      const eqMicroscopio = eqPorNombre.get('Microscopio');

      if (eqPizarra) await asegurarEquipamientoLab(lab.id, eqPizarra.id, 1);
      if (eqProyector) await asegurarEquipamientoLab(lab.id, eqProyector.id, 1);
      if (dataLab.reservaPorComputadora && eqComputadora) {
        await asegurarEquipamientoLab(lab.id, eqComputadora.id, dataLab.capacidad);
      }

      if (dataLab.carreraNombre.includes('Electrica') || dataLab.carreraNombre.includes('Electronica')) {
        if (eqOsciloscopio) await asegurarEquipamientoLab(lab.id, eqOsciloscopio.id, 10);
        if (eqMultimetro) await asegurarEquipamientoLab(lab.id, eqMultimetro.id, 15);
      }

      if (dataLab.carreraNombre.includes('Biologia') || dataLab.carreraNombre.includes('Alimentos')) {
        if (eqMicroscopio) await asegurarEquipamientoLab(lab.id, eqMicroscopio.id, 12);
      }
    }
  }

  console.log(`Configuracion exitosa de los ${LABORATORIOS_REALES_FCYT.length} laboratorios reales con sus horarios y equipamientos.`);
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
