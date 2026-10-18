const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'trivago_campus_super_secret_jwt_key_2026';

async function ejecutarPruebasConcurrencia() {
  console.log('================================================================');
  console.log('🚀 SUITE DE PRUEBAS DE CONCURRENCIA HU-15 (NIVEL BLOOM: EVALUAR)');
  console.log('================================================================');

  let labTest = null;
  let testReservasIds = [];

  try {
    // 1. Obtener o crear usuario de prueba con rol 'Docente'
    let docente = await prisma.usuario.findFirst({
      where: { rol: { nombre: 'Docente' } },
      include: { rol: true }
    });

    if (!docente) {
      const rolDocente = await prisma.rol.findFirst({ where: { nombre: 'Docente' } });
      const carrera = await prisma.carrera.findFirst();
      docente = await prisma.usuario.create({
        data: {
          nombreCompleto: 'Docente Concurrencia Test',
          correo: 'docente.concurrencia@umss.edu',
          passwordHash: 'dummy',
          rolId: rolDocente.id,
          carreraId: carrera.id,
          correoVerificado: true
        },
        include: { rol: true }
      });
    }

    const token = jwt.sign(
      { id: docente.id, rol: docente.rol.nombre, correo: docente.correo },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Obtener un laboratorio activo con horarios
    labTest = await prisma.laboratorio.findFirst({
      where: { estadoOperativo: 'Activo' },
      include: { horarios: true }
    });

    if (!labTest) {
      throw new Error('No se encontró ningún laboratorio activo para la prueba.');
    }

    console.log(`\n📌 Laboratorio seleccionado: ${labTest.nombre} (ID: ${labTest.id})`);
    console.log(`👤 Usuario solicitante: ${docente.nombreCompleto} (Rol: ${docente.rol.nombre})`);

    // 3. Definir ventana de tiempo futura libre (en 15 días a las 09:00 - 11:00)
    // Buscamos un día de semana operativo para el laboratorio
    const fechaBase = new Date();
    fechaBase.setDate(fechaBase.getDate() + 15);
    // Ajustar a Lunes o Martes (días operativos típicos)
    while (fechaBase.getDay() === 0 || fechaBase.getDay() === 6) {
      fechaBase.setDate(fechaBase.getDate() + 1);
    }

    const anio = fechaBase.getFullYear();
    const mes = String(fechaBase.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaBase.getDate()).padStart(2, '0');

    const fechaInicioStr = `${anio}-${mes}-${dia}T09:00:00.000Z`;
    const fechaFinStr = `${anio}-${mes}-${dia}T11:00:00.000Z`;

    // Limpiar reservas previas que pudieran coincidir
    await prisma.reserva.deleteMany({
      where: {
        laboratorioId: labTest.id,
        fechaInicio: new Date(fechaInicioStr)
      }
    });

    console.log(`📅 Ventana de reserva para el test de colisión:`);
    console.log(`   Inicio: ${fechaInicioStr}`);
    console.log(`   Fin:    ${fechaFinStr}`);

    // 4. PRUEBA 1: Disparo simultáneo de 5 solicitudes en paralelo (Promise.all)
    console.log('\n----------------------------------------------------------------');
    console.log('⚡ DISPARANDO 5 SOLICITUDES SIMULTÁNEAS AL MISMO MILISEGUNDO...');
    console.log('----------------------------------------------------------------');

    const promesas = [1, 2, 3, 4, 5].map((i) =>
      fetch(`${BASE_URL}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          laboratorioId: labTest.id,
          fechaInicio: fechaInicioStr,
          fechaFin: fechaFinStr,
          materia: `Simulación Concurrencia #${i}`,
          cantidadAlumnos: 15,
          motivo: `Prueba de concurrencia Promise.all - Solicitud ${i}`
        })
      }).then(async (res) => {
        const body = await res.json().catch(() => ({}));
        return { intento: i, status: res.status, body };
      })
    );

    const resultados = await Promise.all(promesas);

    console.log('\n📊 RESULTADOS DE LAS 5 PETICIONES SIMULTÁNEAS:');
    let exitos = 0;
    let conflictos = 0;
    let otros = 0;

    resultados.forEach((r) => {
      console.log(`  Intento #${r.intento} -> Status: ${r.status} | Código: ${r.body.code || (r.status === 201 ? 'CREADA' : 'ERR')} | Mensaje: ${r.body.mensaje || r.body.error}`);
      if (r.status === 201) {
        exitos++;
        if (r.body.reserva?.id) testReservasIds.push(r.body.reserva.id);
      } else if (r.status === 409 && (r.body.code === 'RESERVA_SOLAPADA' || r.body.code === 'CONFLICTO_HORARIO')) {
        conflictos++;
      } else {
        otros++;
      }
    });

    // 5. Verificación física en la Base de Datos
    const reservasEnBD = await prisma.reserva.findMany({
      where: {
        laboratorioId: labTest.id,
        fechaInicio: new Date(fechaInicioStr),
        estado: { in: ['Pendiente', 'Aprobada', 'Confirmada'] }
      }
    });

    console.log('\n🔎 VERIFICACIÓN DE INTEGRIDAD EN POSTGRESQL:');
    console.log(`  Total registros físicos persistidos en BD: ${reservasEnBD.length}`);

    // Criterio de Aceptación HU-15:
    // Exactamente 1 petición con 201, exactamente 4 peticiones con 409, exactamente 1 registro en BD.
    const cumpleConcurrencia = exitos === 1 && conflictos === 4 && reservasEnBD.length === 1;

    if (cumpleConcurrencia) {
      console.log('✅ TEST DE CONCURRENCIA HU-15 APROBADO: Prevención matemática de colisiones verificada.');
    } else {
      console.error(`❌ TEST DE CONCURRENCIA FALLÓ: Éxitos=${exitos} (Esperado: 1), Conflictos=${conflictos} (Esperado: 4), BD=${reservasEnBD.length} (Esperado: 1)`);
    }

    // 6. PRUEBA 2: Validación de Recurrencia Atómica Semestral
    console.log('\n----------------------------------------------------------------');
    console.log('🔄 PRUEBA 2: VALIDACIÓN DE RECURRENCIA SEMESTRAL ATÓMICA');
    console.log('----------------------------------------------------------------');

    const fechaSemestreInicio = new Date(fechaBase.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fechaSemestreFin = new Date(fechaBase.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 semanas

    const resRecurrente = await fetch(`${BASE_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        laboratorioId: labTest.id,
        fechaInicio: fechaSemestreInicio.toISOString(),
        fechaFin: new Date(fechaSemestreInicio.getTime() + 2 * 3600 * 1000).toISOString(),
        materia: 'Taller de Sistemas Distribuidos',
        cantidadAlumnos: 20,
        recurrente: true,
        fechaFinSemestre: fechaSemestreFin.toISOString(),
        motivo: 'Serie de clases semestrales'
      })
    });

    const bodyRecurrente = await resRecurrente.json();
    console.log(`Status de serie semestral: ${resRecurrente.status}`);
    console.log(`Respuesta:`, bodyRecurrente.mensaje || bodyRecurrente.error);

    if (resRecurrente.status === 201 && bodyRecurrente.totalReservas > 1) {
      console.log(`✅ TEST DE RECURRENCIA SEMESTRAL APROBADO: Creadas ${bodyRecurrente.totalReservas} semanas atómicas.`);
      if (bodyRecurrente.reservas) {
        bodyRecurrente.reservas.forEach((r) => testReservasIds.push(r.id));
      }
    } else {
      console.log(`ℹ️ Resultado de recurrencia: ${resRecurrente.status}`);
    }

  } catch (error) {
    console.error('❌ Error durante la ejecución del test:', error);
  } finally {
    // 7. Limpieza de datos de prueba
    if (testReservasIds.length > 0) {
      console.log(`\n🧹 Limpiando ${testReservasIds.length} reservas creadas durante las pruebas...`);
      await prisma.reserva.deleteMany({
        where: { id: { in: testReservasIds } }
      }).catch(() => {});
      console.log('✓ Base de datos limpia.');
    }
    await prisma.$disconnect();
    console.log('\n================================================================');
    console.log('🏁 FIN DE LAS PRUEBAS HU-15');
    console.log('================================================================');
  }
}

ejecutarPruebasConcurrencia();
