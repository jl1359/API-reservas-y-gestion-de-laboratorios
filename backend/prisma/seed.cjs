const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando inyeccin de semillas...");

  // 1. Roles y Carreras (Obtener existentes)
  const roles = await prisma.rol.findMany();
  const getRolId = (nombre) => roles.find(r => r.nombre === nombre)?.id || 3;
  
  let carrera = await prisma.carrera.findFirst();
  if (!carrera) {
    carrera = await prisma.carrera.create({ data: { nombre: 'Ingeniera de Sistemas' } });
  }

  // 2. Usuarios de Prueba (Evitando pisar a tus admins)
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const usuariosData = [
    { correo: 'docente1@umss.edu', nombreCompleto: 'Docente Prueba Uno', rolId: getRolId('Docente') },
    { correo: 'docente2@umss.edu', nombreCompleto: 'Docente Prueba Dos', rolId: getRolId('Docente') },
    { correo: 'estudiante1@umss.edu', nombreCompleto: 'Estudiante Prueba Uno', rolId: getRolId('Estudiante') },
    { correo: 'estudiante2@umss.edu', nombreCompleto: 'Estudiante Prueba Dos', rolId: getRolId('Estudiante') },
    { correo: 'responsable@umss.edu', nombreCompleto: 'Resp. Laboratorio Prueba', rolId: getRolId('Responsable de Laboratorio') },
    { correo: 'auxiliar@umss.edu', nombreCompleto: 'Auxiliar Prueba', rolId: getRolId('Auxiliar de Docencia') }
  ];

  const usuariosCreados = {};
  for (const u of usuariosData) {
    let user = await prisma.usuario.findUnique({ where: { correo: u.correo } });
    if (!user) {
      user = await prisma.usuario.create({
        data: { ...u, passwordHash, carreraId: carrera.id, correoVerificado: true, activo: true }
      });
    }
    usuariosCreados[u.correo] = user;
  }
  console.log("Usuarios generados.");

  // 3. Equipamiento Especfico
  const equiposNombres = ['Computadora', 'Router', 'Switch', 'Proyector', 'Pizarra', 'Microscopio', 'Tubos de Ensayo', 'Balanza de Precisin', 'Mechero Bunsen', 'Multmetro', 'Osciloscopio', 'Kit de Mecnica'];
  const equiposMap = {};
  for (const nombre of equiposNombres) {
    let eq = await prisma.equipamiento.findFirst({ where: { nombre } });
    if (!eq) eq = await prisma.equipamiento.create({ data: { nombre, tipo: 'Hardware' } });
    equiposMap[nombre] = eq;
  }
  console.log("Equipamiento generado.");

  // 4. Laboratorios
  const labsData = [
    { nombre: 'Laboratorio de Redes', capacidad: 30, reservaPorComputadora: false, equipos: { 'Router': 15, 'Switch': 15, 'Computadora': 30, 'Pizarra': 1, 'Proyector': 1 } },
    { nombre: 'Laboratorio de Cmputo 1', capacidad: 40, reservaPorComputadora: true, equipos: { 'Computadora': 40, 'Pizarra': 1, 'Proyector': 1 } },
    { nombre: 'Laboratorio de Cmputo 2', capacidad: 40, reservaPorComputadora: false, equipos: { 'Computadora': 40, 'Pizarra': 1, 'Proyector': 1 } },
    { nombre: 'Laboratorio de Fsica', capacidad: 25, reservaPorComputadora: false, equipos: { 'Multmetro': 15, 'Osciloscopio': 10, 'Kit de Mecnica': 5, 'Pizarra': 1 } },
    { nombre: 'Laboratorio de Qumica', capacidad: 25, reservaPorComputadora: false, equipos: { 'Microscopio': 10, 'Tubos de Ensayo': 50, 'Balanza de Precisin': 5, 'Mechero Bunsen': 10 } }
  ];

  const labsCreados = {};
  for (const lab of labsData) {
    let l = await prisma.laboratorio.findUnique({ where: { nombre: lab.nombre } });
    if (!l) {
      l = await prisma.laboratorio.create({
        data: {
          nombre: lab.nombre, capacidad: lab.capacidad, reservaPorComputadora: lab.reservaPorComputadora, estadoOperativo: 'Activo'
        }
      });
      // Horarios
      const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
      for (const dia of dias) {
        await prisma.horarioLaboratorio.create({
          data: {
            laboratorioId: l.id, dia, horaApertura: new Date('1970-01-01T08:00:00Z'), horaCierre: new Date('1970-01-01T18:00:00Z')
          }
        });
      }
      // Equipamiento Relacional
      for (const [eqName, qty] of Object.entries(lab.equipos)) {
        await prisma.laboratorioEquipamiento.create({
          data: { laboratorioId: l.id, equipamientoId: equiposMap[eqName].id, cantidad: qty }
        });
      }
    }
    labsCreados[lab.nombre] = l;
  }
  console.log("Laboratorios generados.");

  // 5. Feriados
  const feriados = [
    { fecha: new Date(new Date().getFullYear(), 11, 25), motivo: 'Navidad' },
    { fecha: new Date(new Date().getFullYear() + 1, 0, 1), motivo: 'Ao Nuevo' },
    { fecha: new Date(new Date().getFullYear(), 4, 1), motivo: 'Da del Trabajo' }
  ];
  for (const f of feriados) {
    let exist = await prisma.feriado.findFirst({ where: { motivo: f.motivo } });
    if (!exist) await prisma.feriado.create({ data: f });
  }

  // 6. Reservas (10 Reservas Estratgicas)
  // Limpiamos reservas previas de prueba si existen
  await prisma.reserva.deleteMany({});
  
  const ahora = new Date();
  const reservasData = [
    // Pasadas
    { usuarioId: usuariosCreados['docente1@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Redes'].id, fechaInicio: new Date(ahora.getTime() - 86400000 * 3), fechaFin: new Date(ahora.getTime() - 86400000 * 3 + 7200000), estado: 'Completada', motivo: 'Clase de Redes I' },
    { usuarioId: usuariosCreados['estudiante1@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Cmputo 1'].id, fechaInicio: new Date(ahora.getTime() - 86400000 * 2), fechaFin: new Date(ahora.getTime() - 86400000 * 2 + 3600000), numeroComputadora: 12, estado: 'Completada', motivo: 'Prctica' },
    { usuarioId: usuariosCreados['docente2@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Fsica'].id, fechaInicio: new Date(ahora.getTime() - 86400000 * 1), fechaFin: new Date(ahora.getTime() - 86400000 * 1 + 7200000), estado: 'Cancelada', motivo: 'Clase de Fsica II' },
    // Futuras
    { usuarioId: usuariosCreados['docente1@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Cmputo 2'].id, fechaInicio: new Date(ahora.getTime() + 86400000 * 1), fechaFin: new Date(ahora.getTime() + 86400000 * 1 + 7200000), estado: 'Aprobada', motivo: 'Examen Prctico' },
    { usuarioId: usuariosCreados['estudiante1@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Cmputo 1'].id, fechaInicio: new Date(ahora.getTime() + 86400000 * 2), fechaFin: new Date(ahora.getTime() + 86400000 * 2 + 3600000), numeroComputadora: 5, estado: 'Pendiente', motivo: 'Trabajo Final' },
    { usuarioId: usuariosCreados['estudiante2@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Cmputo 1'].id, fechaInicio: new Date(ahora.getTime() + 86400000 * 2), fechaFin: new Date(ahora.getTime() + 86400000 * 2 + 3600000), numeroComputadora: 6, estado: 'Aprobada', motivo: 'Trabajo Final' },
    { usuarioId: usuariosCreados['auxiliar@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Qumica'].id, fechaInicio: new Date(ahora.getTime() + 86400000 * 3), fechaFin: new Date(ahora.getTime() + 86400000 * 3 + 7200000), estado: 'Pendiente', motivo: 'Prctica General' },
    { usuarioId: usuariosCreados['docente2@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Redes'].id, fechaInicio: new Date(ahora.getTime() + 86400000 * 4), fechaFin: new Date(ahora.getTime() + 86400000 * 4 + 7200000), estado: 'Aprobada', motivo: 'Evaluacin Redes II' },
    { usuarioId: usuariosCreados['estudiante1@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Cmputo 1'].id, fechaInicio: new Date(ahora.getTime() + 86400000 * 5), fechaFin: new Date(ahora.getTime() + 86400000 * 5 + 3600000), numeroComputadora: 10, estado: 'Pendiente', motivo: 'Investigacin' },
    { usuarioId: usuariosCreados['docente1@umss.edu'].id, laboratorioId: labsCreados['Laboratorio de Fsica'].id, fechaInicio: new Date(ahora.getTime() + 86400000 * 6), fechaFin: new Date(ahora.getTime() + 86400000 * 6 + 7200000), estado: 'Pendiente', motivo: 'Clase Recuperatoria' }
  ];
  
  for(const res of reservasData) {
    await prisma.reserva.create({ data: res });
  }
  console.log("10 Reservas generadas.");

  // 7. Sancin
  await prisma.sancion.deleteMany({});
  await prisma.sancion.create({
    data: {
      usuarioId: usuariosCreados['estudiante2@umss.edu'].id,
      motivo: 'Falta injustificada a prctica de laboratorio',
      fechaInicio: new Date(ahora.getTime() - 3600000), // Empez hace 1 hora
      fechaFin: new Date(ahora.getTime() + 82800000), // Termina en 23 horas (24h total)
      estado: 'Activa'
    }
  });
  console.log("Sancin inyectada.");
  console.log("=== SEMILLAS COMPLETADAS CON EXITO ===");
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());