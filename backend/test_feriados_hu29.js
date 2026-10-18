const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'trivago_campus_super_secret_jwt_key_2026';

async function testHU29Feriados() {
  console.log('================================================================');
  console.log('🚀 SUITE DE PRUEBAS AUTOMATIZADA: HU-29 (DÍAS FERIADOS Y BLOQUEADOS)');
  console.log('================================================================');

  let feriadoCreadoId = null;
  let reservaCreadaId = null;

  try {
    // 1. Obtener Admin y Docente
    const admin = await prisma.usuario.findFirst({
      where: { rol: { nombre: 'Admin' } },
      include: { rol: true }
    });

    const docente = await prisma.usuario.findFirst({
      where: { rol: { nombre: 'Docente' } },
      include: { rol: true }
    });

    const tokenAdmin = jwt.sign(
      { id: admin.id, rol: admin.rol.nombre, correo: admin.correo },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const tokenDocente = jwt.sign(
      { id: docente.id, rol: docente.rol.nombre, correo: docente.correo },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const lab = await prisma.laboratorio.findFirst({
      where: { estadoOperativo: 'Activo' },
      include: { horarios: true }
    });

    console.log(`👤 Admin: ${admin.nombreCompleto}`);
    console.log(`👤 Docente: ${docente.nombreCompleto}`);
    console.log(`🏛️ Laboratorio: ${lab.nombre}`);

    // Fecha objetivo para la prueba: Dentro de 25 días, asegurando día hábil (Lunes o Martes)
    const fechaTest = new Date();
    fechaTest.setDate(fechaTest.getDate() + 25);
    while (fechaTest.getDay() === 0 || fechaTest.getDay() === 6) {
      fechaTest.setDate(fechaTest.getDate() + 1);
    }
    const fechaISO = fechaTest.toISOString().split('T')[0];
    const fechaInicioStr = `${fechaISO}T10:00:00.000Z`;
    const fechaFinStr = `${fechaISO}T12:00:00.000Z`;

    // Limpiar si existía feriado o reserva previa en esa fecha
    const fechaDateOnly = new Date(fechaISO);
    await prisma.feriado.deleteMany({
      where: { fecha: fechaDateOnly }
    });
    await prisma.reserva.deleteMany({
      where: { laboratorioId: lab.id, fechaInicio: new Date(fechaInicioStr) }
    });

    console.log(`\n📅 Fecha seleccionada para la prueba de feriado: ${fechaISO}`);

    // -------------------------------------------------------------
    // PASO 1: Consulta inicial de feriados (GET /api/feriados)
    // -------------------------------------------------------------
    console.log('\n[Paso 1] Consultando feriados existentes (GET /api/feriados)...');
    const resGet1 = await fetch(`${BASE_URL}/feriados`);
    const dataGet1 = await resGet1.json();
    console.log(`✓ Status: ${resGet1.status} | Total feriados actuales: ${dataGet1.total}`);

    // -------------------------------------------------------------
    // PASO 2: Criterio 1 - Registro de Fecha Restrictiva por Admin (POST /api/feriados)
    // -------------------------------------------------------------
    console.log('\n[Paso 2] Admin registra feriado institucional (POST /api/feriados)...');
    const resCrear = await fetch(`${BASE_URL}/feriados`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`
      },
      body: JSON.stringify({
        fecha: fechaISO,
        motivo: 'Día del Estudiante y Aniversario Facultativo',
        bloqueoActivo: true
      })
    });

    const dataCrear = await resCrear.json();
    console.log(`✓ Status: ${resCrear.status} | Mensaje: ${dataCrear.mensaje || dataCrear.error}`);
    if (resCrear.status === 201 && dataCrear.data?.id) {
      feriadoCreadoId = dataCrear.data.id;
      console.log(`✅ Feriado insertado en base de datos con ID: ${feriadoCreadoId}`);
    } else {
      throw new Error(`Fallo al crear feriado: ${JSON.stringify(dataCrear)}`);
    }

    // -------------------------------------------------------------
    // PASO 3: Criterio 2 - Bloqueo Absoluto en Motor de Reservas (POST /api/reservas)
    // -------------------------------------------------------------
    console.log('\n[Paso 3] Docente intenta solicitar reserva en el día bloqueado (POST /api/reservas)...');
    const resReservaBloqueada = await fetch(`${BASE_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenDocente}`
      },
      body: JSON.stringify({
        laboratorioId: lab.id,
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr,
        materia: 'Cálculo Numérico',
        cantidadAlumnos: 25,
        motivo: 'Intento en día feriado'
      })
    });

    const dataReservaBloqueada = await resReservaBloqueada.json();
    console.log(`✓ Status recibido: ${resReservaBloqueada.status} (Esperado: 409 Conflict)`);
    console.log(`✓ Código de respuesta: ${dataReservaBloqueada.code} | Error: ${dataReservaBloqueada.error}`);

    const bloqueoExitoso = resReservaBloqueada.status === 409 && dataReservaBloqueada.code === 'FERIADO_BLOQUEADO';
    if (bloqueoExitoso) {
      console.log('✅ BLOQUEO ABSOLUTO CONFIRMADO: El motor de reservas rechazó la solicitud por feriado activo.');
    } else {
      console.error('❌ FALLÓ EL BLOQUEO: Se debió rechazar con 409 FERIADO_BLOQUEADO.');
    }

    // -------------------------------------------------------------
    // PASO 4: Criterio 3 - Anulación de Restricción por Admin (DELETE /api/feriados/:id)
    // -------------------------------------------------------------
    console.log('\n[Paso 4] Admin cancela/elimina el feriado para reabrir el día (DELETE /api/feriados/:id)...');
    const resDelete = await fetch(`${BASE_URL}/feriados/${feriadoCreadoId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenAdmin}`
      }
    });

    const dataDelete = await resDelete.json();
    console.log(`✓ Status: ${resDelete.status} | Mensaje: ${dataDelete.mensaje}`);
    if (resDelete.status === 200) {
      console.log('✅ RESTRICCIÓN ANULADA: Feriado eliminado de la base de datos.');
      feriadoCreadoId = null;
    } else {
      throw new Error(`Fallo al eliminar feriado: ${JSON.stringify(dataDelete)}`);
    }

    // -------------------------------------------------------------
    // PASO 5: Criterio 3 (Reapertura Inmediata) - Docente puede reservar ahora
    // -------------------------------------------------------------
    console.log('\n[Paso 5] Docente reintenta solicitar reserva tras anulación de feriado...');
    const resReservaReabierta = await fetch(`${BASE_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenDocente}`
      },
      body: JSON.stringify({
        laboratorioId: lab.id,
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr,
        materia: 'Cálculo Numérico (Recuperación)',
        cantidadAlumnos: 25,
        motivo: 'Reserva post reapertura de fecha'
      })
    });

    const dataReservaReabierta = await resReservaReabierta.json();
    console.log(`✓ Status recibido: ${resReservaReabierta.status} (Esperado: 201 Created)`);
    console.log(`✓ Mensaje: ${dataReservaReabierta.mensaje}`);

    if (resReservaReabierta.status === 201 && dataReservaReabierta.reserva?.id) {
      reservaCreadaId = dataReservaReabierta.reserva.id;
      console.log('✅ REAPERTURA CONFIRMADA: La reserva fue aceptada inmediatamente tras retirar el feriado.');
    } else {
      console.error('❌ FALLÓ LA REAPERTURA: La reserva no pudo completarse.');
    }

    // Evaluación final
    if (bloqueoExitoso && resReservaReabierta.status === 201) {
      console.log('\n================================================================');
      console.log('🎉 TODOS LOS CRITERIOS DE HU-29 HAN SIDO SATISFECHOS Y VERIFICADOS');
      console.log('================================================================');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba de HU-29:', error);
  } finally {
    // Limpieza
    if (reservaCreadaId) {
      await prisma.reserva.delete({ where: { id: reservaCreadaId } }).catch(() => {});
    }
    if (feriadoCreadoId) {
      await prisma.feriado.delete({ where: { id: feriadoCreadoId } }).catch(() => {});
    }
    await prisma.$disconnect();
    console.log('✓ Limpieza completada.');
  }
}

testHU29Feriados();
