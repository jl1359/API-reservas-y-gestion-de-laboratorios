import nodemailer from 'nodemailer';

// Configuración básica de nodemailer (Ideal usar variables de entorno)
// Para pruebas puedes usar cuentas como Ethereal o Gmail con "App Passwords"
const transporter = nodemailer.createTransport({
  service: 'gmail', // O el proveedor que uses
  auth: {
    user: process.env.EMAIL_USER || 'tu_correo@gmail.com',
    pass: process.env.EMAIL_PASS || 'tu_contraseña_de_aplicacion',
  },
});

export const enviarCorreoRecuperacion = async (correo: string, resetToken: string) => {
  // En frontend la URL será algo como: http://localhost:5173/reset-password?token=XYZ
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"Sistema de Laboratorios UMSS" <no-reply@umss.edu>',
    to: correo,
    subject: 'Recuperación de Contraseña',
    html: `
      <h2>¿Olvidaste tu contraseña?</h2>
      <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva:</p>
      <a href="${resetLink}" style="padding: 10px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo de recuperación enviado a ${correo}`);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('No se pudo enviar el correo');
  }
};
