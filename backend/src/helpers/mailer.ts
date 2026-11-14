import nodemailer from "nodemailer";
import QRCode from "qrcode";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "tu_correo@gmail.com",
    pass: process.env.EMAIL_PASS || "tu_contraseña_de_aplicacion",
  },
});

const getBaseUrl = () => {
  const raw = process.env.CLIENT_URL || process.env.FRONTEND_URL || "";
  const firstValid = raw
    .split(",")
    .map((u) => u.trim().replace(/\/+$/, ""))
    .find(Boolean);
  return firstValid || "http://localhost:5173";
};

const getSenderEmail = () =>
  process.env.EMAIL_USER || "jl1533336@gmail.com";

const getSender = () =>
  `"LabReserve FCyT - UMSS" <${getSenderEmail()}>`;

const escapeHtml = (texto?: string | null): string =>
  (texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatearFechaHoraBolivia = (inicio: Date, fin: Date) => {
  const fecha = inicio.toLocaleDateString("es-BO", {
    timeZone: "America/La_Paz",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const horaInicio = inicio.toLocaleTimeString("es-BO", {
    timeZone: "America/La_Paz",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const horaFin = fin.toLocaleTimeString("es-BO", {
    timeZone: "America/La_Paz",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { fecha, horario: `${horaInicio} - ${horaFin}` };
};

interface AttachmentData {
  filename: string;
  content: Buffer;
  cid?: string;
}

/**
 * Despachador de correos unificado:
 * 1. En la nube (Render): Si existe BREVO_API_KEY, envia mediante HTTPS REST API (Puerto 443 - jamas bloqueado).
 * 2. En local: Si no hay BREVO_API_KEY, utiliza Nodemailer SMTP con Gmail.
 */
async function despacharCorreo({
  to,
  toName,
  subject,
  html,
  attachments = [],
}: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  attachments?: AttachmentData[];
}): Promise<void> {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (brevoApiKey) {
    const senderEmail = getSenderEmail();
    const payload: any = {
      sender: { name: "LabReserve FCyT - UMSS", email: senderEmail },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
    };

    if (attachments.length > 0) {
      payload.attachment = attachments.map((att) => ({
        name: att.filename,
        content: att.content.toString("base64"),
      }));
    }

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[Brevo HTTPS Error]", res.status, errBody);
      throw new Error(`Error en envio por Brevo API (${res.status}): ${errBody}`);
    }

    console.log(`[Brevo HTTPS] Correo despachado con exito a ${to}`);
    return;
  }

  // Fallback para localhost si no hay Brevo configurado
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER / EMAIL_PASS no definidos. Correo omitido.");
    return;
  }

  await transporter.sendMail({
    from: getSender(),
    to,
    subject,
    html,
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      cid: att.cid,
    })),
  });
  console.log(`[Nodemailer SMTP] Correo enviado a ${to}`);
}

export const enviarCorreoRecuperacion = async (correo: string, resetToken: string) => {
  const resetLink = `${getBaseUrl()}/reset-password/${resetToken}`;
  const html = `<h2>¿Olvidaste tu contraseña?</h2><p>Haz clic en el siguiente enlace para crear una nueva:</p><a href="${resetLink}" style="padding: 10px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>`;

  try {
    await despacharCorreo({
      to: correo,
      subject: "Recuperación de Contraseña",
      html,
    });
    console.log("Correo de recuperación enviado a " + correo);
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    throw new Error("No se pudo enviar el correo");
  }
};

export const enviarCorreoActivacion = async (correo: string, tokenActivacion: string) => {
  const activacionLink = `${getBaseUrl()}/verificar-correo/${tokenActivacion}`;
  const html = `<h2>¡Bienvenido al Sistema de Laboratorios UMSS!</h2><p>Para poder iniciar sesion y usar el sistema, necesitamos verificar que este correo te pertenece.</p><p>Haz clic en el siguiente enlace para activar tu cuenta:</p><a href="${activacionLink}" style="padding: 10px 15px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">Activar mi Cuenta</a>`;

  try {
    await despacharCorreo({
      to: correo,
      subject: "Confirma tu correo electronico - UMSS",
      html,
    });
    console.log("Correo de activacion enviado a " + correo);
  } catch (error) {
    console.error("Error al enviar correo de activación:", error);
    throw new Error("No se pudo enviar el correo de activacion");
  }
};

export interface DatosReservaCorreo {
  id: number;
  laboratorioNombre: string;
  ubicacion?: string | null;
  fechaInicio: Date;
  fechaFin: Date;
  materia?: string | null;
  motivo?: string | null;
  numeroComputadora?: number | null;
  tokenQr: string;
  totalSesionesSerie?: number;
}

export const enviarCorreoConfirmacionReserva = async (
  correo: string,
  nombreUsuario: string,
  reserva: DatosReservaCorreo
) => {
  try {
    const { fecha, horario } = formatearFechaHoraBolivia(reserva.fechaInicio, reserva.fechaFin);
    const qrBuffer = await QRCode.toBuffer(reserva.tokenQr, {
      width: 280,
      margin: 2,
      color: { dark: "#002855", light: "#ffffff" },
    });
    const qrBase64 = qrBuffer.toString("base64");

    const detalleActividad = reserva.materia
      ? `<p style="margin:4px 0;"><strong>Materia:</strong> ${escapeHtml(reserva.materia)}</p>`
      : reserva.motivo
      ? `<p style="margin:4px 0;"><strong>Motivo:</strong> ${escapeHtml(reserva.motivo)}</p>`
      : "";

    const detallePc = reserva.numeroComputadora
      ? `<p style="margin:4px 0;"><strong>Equipo asignado:</strong> PC-${reserva.numeroComputadora}</p>`
      : "";

    const detalleSerie =
      reserva.totalSesionesSerie && reserva.totalSesionesSerie > 1
        ? `<p style="margin:8px 0;padding:8px 12px;background:#eef2ff;border-radius:8px;color:#3730a3;font-size:13px;"><strong>Serie semestral:</strong> Se aprobaron ${reserva.totalSesionesSerie} sesiones semanales. Este comprobante corresponde al primer turno.</p>`
        : "";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;color:#0f172a;">
        <h2 style="margin-top:0;color:#1e3a8a;">Reserva Confirmada - LabReserve FCyT</h2>
        <p>Hola <strong>${escapeHtml(nombreUsuario)}</strong>,</p>
        <p>Tu reserva quedó aprobada y confirmada. Presenta este código QR al responsable del laboratorio para registrar tu asistencia:</p>
        <div style="background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;margin:16px 0;font-size:14px;">
          <p style="margin:4px 0;"><strong>Reserva:</strong> #${reserva.id}</p>
          <p style="margin:4px 0;"><strong>Laboratorio:</strong> ${escapeHtml(reserva.laboratorioNombre)}</p>
          ${reserva.ubicacion ? `<p style="margin:4px 0;"><strong>Ubicación:</strong> ${escapeHtml(reserva.ubicacion)}</p>` : ""}
          <p style="margin:4px 0;"><strong>Fecha:</strong> ${escapeHtml(fecha)}</p>
          <p style="margin:4px 0;"><strong>Horario:</strong> ${escapeHtml(horario)}</p>
          ${detallePc}
          ${detalleActividad}
        </div>
        ${detalleSerie}
        <div style="text-align:center;margin:20px 0;">
          <img src="data:image/png;base64,${qrBase64}" alt="Código QR de Reserva" style="width:220px;height:220px;border:1px solid #cbd5e1;border-radius:12px;padding:8px;background:#ffffff;" />
          <p style="font-size:11px;color:#64748b;margin-top:8px;word-break:break-all;">Código manual: ${escapeHtml(reserva.tokenQr)}</p>
        </div>
        <p style="font-size:13px;color:#475569;">Recuerda validar tu ingreso dentro de los primeros <strong>15 minutos</strong> desde la hora de inicio para evitar sanciones por inasistencia.</p>
        <div style="text-align:center;margin-top:20px;">
          <a href="${getBaseUrl()}/perfil" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;">Ver en Mi Perfil</a>
        </div>
      </div>
    `;

    await despacharCorreo({
      to: correo,
      toName: nombreUsuario,
      subject: `Comprobante de Reserva #${reserva.id} - ${reserva.laboratorioNombre}`,
      html,
      attachments: [
        {
          filename: `QR-Reserva-${reserva.id}.png`,
          content: qrBuffer,
          cid: "qr-comprobante",
        },
      ],
    });
  } catch (error: any) {
    console.warn("Advertencia al enviar correo de confirmación de reserva:", error?.message || error);
  }
};

export const enviarCorreoRecordatorioReserva = async (
  correo: string,
  nombreUsuario: string,
  reserva: DatosReservaCorreo & { minutosRestantes: number }
) => {
  try {
    const { fecha, horario } = formatearFechaHoraBolivia(reserva.fechaInicio, reserva.fechaFin);
    const qrBuffer = await QRCode.toBuffer(reserva.tokenQr, {
      width: 260,
      margin: 2,
      color: { dark: "#002855", light: "#ffffff" },
    });
    const qrBase64 = qrBuffer.toString("base64");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #fde68a;border-radius:16px;color:#0f172a;background:#fffbeb;">
        <h2 style="margin-top:0;color:#b45309;">Tu reserva inicia en ${reserva.minutosRestantes} minutos</h2>
        <p>Hola <strong>${escapeHtml(nombreUsuario)}</strong>,</p>
        <p>Te recordamos registrar tu asistencia con tu código QR al llegar al laboratorio para evitar ausencias y suspensión de 24 horas.</p>
        <div style="background:#ffffff;padding:16px;border-radius:12px;border:1px solid #e2e8f0;margin:16px 0;font-size:14px;">
          <p style="margin:4px 0;"><strong>Reserva:</strong> #${reserva.id}</p>
          <p style="margin:4px 0;"><strong>Laboratorio:</strong> ${escapeHtml(reserva.laboratorioNombre)}</p>
          ${reserva.ubicacion ? `<p style="margin:4px 0;"><strong>Ubicación:</strong> ${escapeHtml(reserva.ubicacion)}</p>` : ""}
          <p style="margin:4px 0;"><strong>Fecha:</strong> ${escapeHtml(fecha)}</p>
          <p style="margin:4px 0;"><strong>Horario:</strong> ${escapeHtml(horario)}</p>
          ${reserva.numeroComputadora ? `<p style="margin:4px 0;"><strong>Equipo:</strong> PC-${reserva.numeroComputadora}</p>` : ""}
        </div>
        <div style="text-align:center;margin:18px 0;">
          <img src="data:image/png;base64,${qrBase64}" alt="Código QR de Ingreso" style="width:200px;height:200px;border:1px solid #cbd5e1;border-radius:12px;padding:8px;background:#ffffff;" />
        </div>
        <div style="text-align:center;">
          <a href="${getBaseUrl()}/perfil" style="display:inline-block;padding:10px 20px;background:#d97706;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;">Abrir mi QR en Perfil</a>
        </div>
      </div>
    `;

    await despacharCorreo({
      to: correo,
      toName: nombreUsuario,
      subject: `Recordatorio (${reserva.minutosRestantes} min): Reserva #${reserva.id} en ${reserva.laboratorioNombre}`,
      html,
      attachments: [
        {
          filename: `QR-Reserva-${reserva.id}.png`,
          content: qrBuffer,
          cid: "qr-recordatorio",
        },
      ],
    });
  } catch (error: any) {
    console.warn("Advertencia al enviar correo recordatorio de reserva:", error?.message || error);
  }
};

export const enviarCorreoFuerzaMayor = async (
  correo: string,
  nombreUsuario: string,
  reserva: {
    id: number;
    laboratorioNombre: string;
    fechaInicio: Date;
    fechaFin: Date;
    motivoCancelacion: string;
  }
) => {
  try {
    const { fecha, horario } = formatearFechaHoraBolivia(reserva.fechaInicio, reserva.fechaFin);

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #fecdd3;border-radius:16px;color:#0f172a;background:#fff1f2;">
        <h2 style="margin-top:0;color:#be123c;">Cancelación por Fuerza Mayor</h2>
        <p>Hola <strong>${escapeHtml(nombreUsuario)}</strong>,</p>
        <p>La Administración de Laboratorios FCyT canceló tu reserva programada por razones institucionales o de emergencia (sin generar ninguna sanción en tu cuenta):</p>
        <div style="background:#ffffff;padding:16px;border-radius:12px;border:1px solid #e2e8f0;margin:16px 0;font-size:14px;">
          <p style="margin:4px 0;"><strong>Reserva:</strong> #${reserva.id}</p>
          <p style="margin:4px 0;"><strong>Laboratorio:</strong> ${escapeHtml(reserva.laboratorioNombre)}</p>
          <p style="margin:4px 0;"><strong>Fecha:</strong> ${escapeHtml(fecha)}</p>
          <p style="margin:4px 0;"><strong>Horario:</strong> ${escapeHtml(horario)}</p>
          <p style="margin:4px 0;"><strong>Motivo:</strong> ${escapeHtml(reserva.motivoCancelacion)}</p>
        </div>
        <p style="font-size:13px;color:#475569;">Puedes volver a programar otro turno o ambiente disponible desde la plataforma.</p>
        <div style="text-align:center;margin-top:16px;">
          <a href="${getBaseUrl()}/" style="display:inline-block;padding:10px 20px;background:#1e3a8a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:14px;">Ver Espacios Disponibles</a>
        </div>
      </div>
    `;

    await despacharCorreo({
      to: correo,
      toName: nombreUsuario,
      subject: `Aviso Importante: Reserva #${reserva.id} cancelada por Fuerza Mayor`,
      html,
    });
  } catch (error: any) {
    console.warn("Advertencia al enviar correo por fuerza mayor:", error?.message || error);
  }
};
