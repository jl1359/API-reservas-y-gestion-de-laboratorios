import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import app from '../app';
import { crearReservaIndividualService, ReservaServiceError } from '../services/reservas.service';

describe('Suite de Pruebas Automatizadas: Concurrencia, Seguridad y Servicios Telemáticos', () => {
  let server: http.Server;
  let baseUrl: string;
  let labPruebaId: number;
  let usuarioEstudiante1Id: number;
  let usuarioEstudiante2Id: number;
  let adminToken: string;
  const reservasLimpiar: number[] = [];
  const sancionesLimpiar: number[] = [];

  before(async () => {
    // 1. Iniciar servidor HTTP efímero en puerto dinámico para pruebas de API
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${address.port}`;

    // 2. Localizar un usuario administrador para pruebas protegidas
    const adminUser = await prisma.usuario.findFirst({
      where: {
        activo: true,
        rol: { nombre: { in: ['Administrador', 'Admin'] } }
      }
    });
    if (adminUser) {
      adminToken = jwt.sign(
        { id: adminUser.id, rol: 'Administrador' },
        process.env.JWT_SECRET || 'secreto_de_respaldo'
      );
    }

    // 2. Localizar un laboratorio activo configurado para reserva por computadora
    const lab = await prisma.laboratorio.findFirst({
      where: {
        estadoOperativo: 'Activo',
        reservaPorComputadora: true,
      },
      include: {
        equipos: true,
      },
    });

    if (!lab) {
      throw new Error('No se encontró ningún laboratorio activo con reserva por computadora en la BD.');
    }
    labPruebaId = lab.id;

    // 3. Localizar al menos dos usuarios estudiantes para pruebas de concurrencia
    const estudiantes = await prisma.usuario.findMany({
      where: {
        activo: true,
        rol: { nombre: 'Estudiante' },
      },
      take: 2,
    });

    if (estudiantes.length < 2) {
      // Si no existen 2 estudiantes, buscar cualquier 2 usuarios activos
      const cualquierUsuario = await prisma.usuario.findMany({
        where: { activo: true },
        take: 2,
      });
      usuarioEstudiante1Id = cualquierUsuario[0].id;
      usuarioEstudiante2Id = cualquierUsuario[1].id;
    } else {
      usuarioEstudiante1Id = estudiantes[0].id;
      usuarioEstudiante2Id = estudiantes[1].id;
    }
  });

  after(async () => {
    // Limpieza de datos de prueba para mantener la BD íntegra
    if (reservasLimpiar.length > 0) {
      await prisma.reserva.deleteMany({
        where: { id: { in: reservasLimpiar } },
      }).catch(() => {});
    }

    if (sancionesLimpiar.length > 0) {
      await prisma.sancion.deleteMany({
        where: { id: { in: sancionesLimpiar } },
      }).catch(() => {});
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  });

  // =========================================================================
  // 1. PRUEBAS DE CONCURRENCIA ATÓMICA Y CONDICIÓN DE CARRERA
  // =========================================================================
  describe('1. Control de Concurrencia y Detección de Colisiones (PostgreSQL + Transacciones)', () => {
    it('debe aprobar exactamente una reserva y rechazar la colisión con 409 Conflict al competir en el mismo milisegundo', async () => {
      // Programar una fecha futura segura (en día laborable dentro de 6 meses)
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 90);
      // Asegurar que caiga en día laboral (martes = 2)
      while (fechaFutura.getDay() !== 2) {
        fechaFutura.setDate(fechaFutura.getDate() + 1);
      }
      fechaFutura.setHours(9, 45, 0, 0);

      const fechaFinFutura = new Date(fechaFutura);
      fechaFinFutura.setHours(11, 15, 0, 0);

      const numPc = 1;

      // Disparar dos peticiones idénticas de forma estrictamente simultánea con Promise.allSettled
      const [resultado1, resultado2] = await Promise.allSettled([
        crearReservaIndividualService(
          labPruebaId,
          numPc,
          fechaFutura,
          fechaFinFutura,
          'Test Concurrencia Automatizado Petición A',
          usuarioEstudiante1Id
        ),
        crearReservaIndividualService(
          labPruebaId,
          numPc,
          fechaFutura,
          fechaFinFutura,
          'Test Concurrencia Automatizado Petición B',
          usuarioEstudiante2Id
        ),
      ]);

      const exitosos = [resultado1, resultado2].filter((r) => r.status === 'fulfilled');
      const fallidos = [resultado1, resultado2].filter((r) => r.status === 'rejected');

      // Registrar la reserva creada para que after() la limpie
      if (exitosos.length === 1 && (exitosos[0] as PromiseFulfilledResult<any>).value?.id) {
        reservasLimpiar.push((exitosos[0] as PromiseFulfilledResult<any>).value.id);
      }

      // Verificación matemática de exclusión mutua
      assert.equal(exitosos.length, 1, 'Exactamente una solicitud concurrente debió ser aprobada');
      assert.equal(fallidos.length, 1, 'Exactamente una solicitud debió ser rechazada por conflicto');

      // Verificación de rechazo por colisión transaccional (HTTP 409 Conflict)
      const errorRechazo = (fallidos[0] as PromiseRejectedResult).reason;
      assert.equal(errorRechazo.status, 409, 'El código HTTP de colisión debe ser 409 Conflict');
      assert.ok(
        errorRechazo.message.includes('colisión') || errorRechazo.message.includes('reservada'),
        'El mensaje de error debe explicar el solapamiento o reserva existente'
      );
    });
  });

  // =========================================================================
  // 2. PRUEBAS DE SEGURIDAD Y POLÍTICAS DISCIPLINARIAS
  // =========================================================================
  describe('2. Seguridad y Control de Acceso: Bloqueo de Usuarios Sancionados', () => {
    it('debe rechazar con HTTP 403 Forbidden a un usuario con sanción activa vigente', async () => {
      // Crear una sanción activa temporal de 24 horas para usuarioEstudiante1Id
      const sancionTemporal = await prisma.sancion.create({
        data: {
          usuarioId: usuarioEstudiante1Id,
          motivo: 'Inasistencia no justificada a reserva previa (Prueba de Seguridad)',
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 24 * 60 * 60 * 1000),
          estado: 'Activa',
        },
      });
      sancionesLimpiar.push(sancionTemporal.id);

      const fechaManana = new Date();
      fechaManana.setDate(fechaManana.getDate() + 100);
      while (fechaManana.getDay() !== 3) {
        fechaManana.setDate(fechaManana.getDate() + 1);
      }
      fechaManana.setHours(14, 0, 0, 0);
      const fechaFinManana = new Date(fechaManana);
      fechaFinManana.setHours(15, 30, 0, 0);

      // Intentar reservar mientras la sanción está vigente
      try {
        await crearReservaIndividualService(
          labPruebaId,
          2,
          fechaManana,
          fechaFinManana,
          'Intento de reserva con sanción activa',
          usuarioEstudiante1Id
        );
        assert.fail('El servicio debió arrojar error 403 Forbidden para usuario sancionado');
      } catch (error: any) {
        assert.equal(error.status, 403, 'El status HTTP debe ser 403 Forbidden');
        assert.equal(
          error.code,
          'PRIVILEGIOS_SUSPENDIDOS_SANCION',
          'El código de error debe ser PRIVILEGIOS_SUSPENDIDOS_SANCION'
        );
      }
    });
  });

  // =========================================================================
  // 3. PRUEBAS DE VALIDACIÓN DE ENTRADA Y RESTRICCIONES DE DOMINIO
  // =========================================================================
  describe('3. Validación de Entrada y Reglas de Negocio (HTTP 400)', () => {
    it('debe rechazar reservas con fecha y hora en el pasado con HTTP 400', async () => {
      const fechaPasada = new Date(Date.now() - 3600000);
      const fechaFinPasada = new Date(Date.now() - 1800000);

      try {
        await crearReservaIndividualService(
          labPruebaId,
          1,
          fechaPasada,
          fechaFinPasada,
          'Prueba fecha pasada',
          usuarioEstudiante2Id
        );
        assert.fail('Debió rechazar fecha en el pasado');
      } catch (error: any) {
        assert.equal(error.status, 400);
        assert.ok(error.message.includes('futura'));
      }
    });

    it('debe rechazar solicitudes donde la hora de fin sea anterior o igual a la hora de inicio', async () => {
      const fechaInicio = new Date(Date.now() + 86400000);
      const fechaFin = new Date(fechaInicio.getTime() - 1800000);

      try {
        await crearReservaIndividualService(
          labPruebaId,
          1,
          fechaInicio,
          fechaFin,
          'Prueba rango invertido',
          usuarioEstudiante2Id
        );
        assert.fail('Debió rechazar rango cronológico invertido');
      } catch (error: any) {
        assert.equal(error.status, 400);
        assert.ok(error.message.includes('posterior'));
      }
    });
  });

  // =========================================================================
  // 4. PRUEBAS DE SERVICIO TELEMÁTICO Y TELEMETRÍA EN TIEMPO REAL
  // =========================================================================
  describe('4. Protocolos Telemáticos: Salud del API y Telemetría SSE', () => {
    it('el endpoint /api/health debe responder HTTP 200 con status ok', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, 'ok');
      assert.ok(body.timestamp);
    });

    it('el endpoint /api/realtime/stats debe exponer telemetría telemática del servidor', async () => {
      const res = await fetch(`${baseUrl}/api/realtime/stats`, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(typeof body.clientesConectados, 'number');
      assert.ok(body.timestamp);
    });
  });
});
