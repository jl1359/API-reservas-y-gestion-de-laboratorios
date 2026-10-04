import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "tu_correo@gmail.com",
    pass: process.env.EMAIL_PASS || "tu_contraseña_de_aplicacion",
  },
});

export const enviarCorreoRecuperacion = async (correo: string, resetToken: string) => {
  const resetLink = "http://localhost:5173/reset-password?token=" + resetToken;
  const mailOptions = {
    from: "\"Sistema de Laboratorios UMSS\" <no-reply@umss.edu>",
    to: correo,
    subject: "Recuperación de Contraseña",
    html: "<h2>¿Olvidaste tu contraseña?</h2><p>Haz clic en el siguiente enlace para crear una nueva:</p><a href=\"" + resetLink + "\" style=\"padding: 10px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;\">Restablecer Contraseña</a>",
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("Correo de recuperación enviado a " + correo);
  } catch (error) {
    throw new Error("No se pudo enviar el correo");
  }
};

export const enviarCorreoActivacion = async (correo: string, tokenActivacion: string) => {
  const activacionLink = "http://localhost:5173/verificar-correo?token=" + tokenActivacion;
  const mailOptions = {
    from: "\"Sistema de Laboratorios UMSS\" <no-reply@umss.edu>",
    to: correo,
    subject: "Confirma tu correo electronico - UMSS",
    html: "<h2>¡Bienvenido al Sistema de Laboratorios UMSS!</h2><p>Para poder iniciar sesion y usar el sistema, necesitamos verificar que este correo te pertenece.</p><p>Haz clic en el siguiente enlace para activar tu cuenta:</p><a href=\"" + activacionLink + "\" style=\"padding: 10px 15px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;\">Activar mi Cuenta</a>",
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("Correo de activacion enviado a " + correo);
  } catch (error) {
    throw new Error("No se pudo enviar el correo de activacion");
  }
};
