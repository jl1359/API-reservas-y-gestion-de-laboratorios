import { prisma } from '../config/prisma';
import { enviarCorreoRecordatorioReserva } from '../helpers/mailer';
import { enviarPushAUsuario } from '../services/notificaciones.service';

const VENTANA_ANTICIPACION_MINUTOS = 11;

/**
 * Envía recordatorio (~10 min antes del inicio) por correo (con QR), notificación web y Web Push.
 * Usa actualización atómica sobre `recordatorioEnviado` para evitar envíos duplicados.
 */
export const procesarRecordatoriosProximos = async () => {
  const ahora = new Date();
  const limiteVentana = new Date(ahora.getTime() + VENTANA_ANTICIPACION_MINUTOS * 60 * 1000);

  const proximas = await prisma.reserva.findMany({
    where: {
      estado: 'Aprobada',
      horaAsistencia: null,
      recordatorioEnviado: false,
      usuarioId: { not: null },
      tokenQr: { not: null },
      fechaInicio: {
        gt: ahora,
        lte: limiteVentana
      }
    },
    include: {
      usuario: { select: { id: true, nombreCompleto: true, correo: true } },
      laboratorio: { select: { id: true, nombre: true, ubicacion: true } }
    }
  });

  let enviados = 0;

  for (const r of proximas) {
    if (!r.usuario || !r.usuarioId || !r.tokenQr) continue;

    // Reclamar atómicamente para que nunca se envíe dos veces la misma alerta
    const reclamada = await prisma.reserva.updateMany({
      where: { id: r.id, recordatorioEnviado: false },
      data: { recordatorioEnviado: true }
    });
    if (reclamada.count === 0) continue;

    const minutosRestantes = Math.max(
      1,
      Math.round((r.fechaInicio.getTime() - Date.now()) / 60000)
    );

    const mensaje = `Recordatorio: Tu reserva #${r.id} en ${r.laboratorio.nombre} inicia en ${minutosRestantes} min. Registra tu asistencia con el código QR al ingresar.`;

    await prisma.notificacion
      .create({
        data: {
          usuarioId: r.usuarioId,
          mensaje
        }
      })
      .catch(() => null);

    enviarPushAUsuario(
      r.usuarioId,
      `Reserva en ${minutosRestantes} min - LabReserve`,
      mensaje,
      '/perfil'
    ).catch(() => null);

    await enviarCorreoRecordatorioReserva(r.usuario.correo, r.usuario.nombreCompleto, {
      id: r.id,
      laboratorioNombre: r.laboratorio.nombre,
      ubicacion: r.laboratorio.ubicacion,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      materia: r.materia,
      motivo: r.motivo,
      numeroComputadora: r.numeroComputadora,
      tokenQr: r.tokenQr,
      minutosRestantes
    });

    enviados++;
  }

  return enviados;
};

export const iniciarWorkerRecordatorios = (intervaloMinutos = 1) => {
  console.log(`[Worker Recordatorios] Iniciado. Verificación cada ${intervaloMinutos} minuto(s).`);

  const ejecutar = async () => {
    try {
      const enviados = await procesarRecordatoriosProximos();
      if (enviados > 0) {
        console.log(`[Worker Recordatorios] ${enviados} recordatorio(s) de asistencia enviado(s).`);
      }
    } catch (error: any) {
      console.error('[Worker Recordatorios] Error durante verificación:', error?.message || error);
    }
  };

  setTimeout(ejecutar, 15000);
  const timer = setInterval(ejecutar, intervaloMinutos * 60 * 1000);

  return () => clearInterval(timer);
};
