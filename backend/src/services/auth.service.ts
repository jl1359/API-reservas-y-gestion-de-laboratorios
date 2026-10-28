import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/prisma';
import { enviarCorreoRecuperacion, enviarCorreoActivacion } from '../helpers/mailer';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_respaldo';

export class AuthServiceError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export const registrarUsuarioService = async (datos: {
  nombreCompleto: string;
  correo: string;
  password: string;
  ci: string;
  telefono: string;
  carreraId?: number;
}) => {
  const correoNormalizado = datos.correo.toLowerCase().trim();
  const ciNormalizado = datos.ci.trim();
  const telefonoNormalizado = datos.telefono.trim();

  const usuarioExistente = await prisma.usuario.findUnique({ where: { correo: correoNormalizado } });
  if (usuarioExistente && usuarioExistente.correoVerificado) {
    throw new AuthServiceError(400, 'El correo electrónico ya está registrado');
  }

  const ciExistente = await prisma.usuario.findFirst({ where: { ci: ciNormalizado } });
  if (ciExistente && ciExistente.correoVerificado && ciExistente.id !== usuarioExistente?.id) {
    throw new AuthServiceError(400, 'La Cédula de Identidad (CI) ya se encuentra registrada en el sistema');
  }

  // Si existe un registro anterior no verificado que retenia este CI bajo otro correo, se libera
  if (ciExistente && !ciExistente.correoVerificado && (!usuarioExistente || ciExistente.id !== usuarioExistente.id)) {
    await prisma.notificacion.deleteMany({ where: { usuarioId: ciExistente.id } }).catch(() => null);
    await prisma.auditoria.deleteMany({ where: { usuarioId: ciExistente.id } }).catch(() => null);
    await prisma.usuario.delete({ where: { id: ciExistente.id } });
  }

  let rolEstudiante = await prisma.rol.findFirst({ where: { nombre: 'Estudiante' } });
  if (!rolEstudiante) {
    rolEstudiante = await prisma.rol.create({ data: { nombre: 'Estudiante' } });
  }

  let carreraFinalId = datos.carreraId;
  if (!carreraFinalId) {
    let carreraDummy = await prisma.carrera.findFirst({ where: { nombre: 'Sin Especificar' } });
    if (!carreraDummy) carreraDummy = await prisma.carrera.create({ data: { nombre: 'Sin Especificar' } });
    carreraFinalId = carreraDummy.id;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(datos.password, salt);

  // Si el correo ya existia pero no habia sido verificado, actualizamos sus datos y reenviamos activacion
  if (usuarioExistente && !usuarioExistente.correoVerificado) {
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuarioExistente.id },
      data: {
        nombreCompleto: datos.nombreCompleto.trim(),
        passwordHash,
        ci: ciNormalizado,
        telefono: telefonoNormalizado,
        carreraId: Number(carreraFinalId),
        rolId: rolEstudiante.id,
        correoVerificado: false
      }
    });

    const activacionToken = jwt.sign({ id: usuarioActualizado.id }, JWT_SECRET, { expiresIn: '1d' });
    enviarCorreoActivacion(usuarioActualizado.correo, activacionToken).catch(e => console.error(e));

    return usuarioActualizado;
  }

  const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombreCompleto: datos.nombreCompleto.trim(),
      correo: correoNormalizado,
      passwordHash,
      ci: ciNormalizado,
      telefono: telefonoNormalizado,
      carreraId: Number(carreraFinalId),
      rolId: rolEstudiante.id,
      correoVerificado: false
    },
  });

  const activacionToken = jwt.sign({ id: nuevoUsuario.id }, JWT_SECRET, { expiresIn: '1d' });
  enviarCorreoActivacion(nuevoUsuario.correo, activacionToken).catch(e => console.error(e));

  return nuevoUsuario;
};

export const reenviarActivacionService = async (correo: string) => {
  if (!correo) {
    throw new AuthServiceError(400, 'Debes ingresar un correo electrónico');
  }

  const correoNormalizado = correo.toLowerCase().trim();
  const usuario = await prisma.usuario.findUnique({
    where: { correo: correoNormalizado }
  });

  if (!usuario) {
    throw new AuthServiceError(404, 'No se encontró ninguna cuenta registrada con este correo');
  }

  if (usuario.correoVerificado) {
    return { mensaje: 'Esta cuenta ya está verificada. Puedes iniciar sesión directamente.' };
  }

  const activacionToken = jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: '1d' });
  await enviarCorreoActivacion(usuario.correo, activacionToken);

  return { mensaje: 'Enlace de activación reenviado con éxito. Revisa tu bandeja de entrada o spam.' };
};

export const verificarCorreoService = async (token: string) => {
  const decoded = jwt.verify(token, JWT_SECRET) as any as { id: number };

  await prisma.usuario.update({
    where: { id: decoded.id },
    data: { correoVerificado: true }
  });

  return { mensaje: 'Cuenta activada correctamente. Ya puedes iniciar sesión.' };
};

export const loginService = async (correo: string, password: string) => {
  const correoNormalizado = correo.toLowerCase().trim();

  const usuario = await prisma.usuario.findUnique({
    where: { correo: correoNormalizado },
    include: { rol: true }
  });

  if (!usuario) {
    throw new AuthServiceError(401, 'Correo o contraseña incorrectos');
  }

  const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordValida) {
    throw new AuthServiceError(401, 'Correo o contraseña incorrectos');
  }

  if (!usuario.activo) {
    throw new AuthServiceError(403, 'Tu cuenta se encuentra desactivada. Contacta al administrador.');
  }

  if (!usuario.correoVerificado) {
    throw new AuthServiceError(403, 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.');
  }

  const token = jwt.sign({ id: usuario.id, rol: usuario.rol.nombre }, JWT_SECRET, { expiresIn: '8h' });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      ci: usuario.ci,
      telefono: usuario.telefono,
      rol: usuario.rol.nombre
    }
  };
};

export const forgotPasswordService = async (correo: string) => {
  const correoNormalizado = correo.toLowerCase().trim();
  const usuario = await prisma.usuario.findUnique({ where: { correo: correoNormalizado } });

  // Proteccion anti-enumeracion de cuentas (OWASP): responder mensaje generico sin revelar existencia
  if (!usuario) {
    return { mensaje: 'Enlace de recuperación enviado. Revisa tu bandeja de entrada o spam.' };
  }

  const resetToken = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET || 'secreto', { expiresIn: '15m' });
  await enviarCorreoRecuperacion(usuario.correo, resetToken);
  return { mensaje: 'Enlace de recuperación enviado. Revisa tu bandeja de entrada o spam.' };
};

export const resetPasswordService = async (token: string, newPassword: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto') as any as { id: number };
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await prisma.usuario.update({ where: { id: decoded.id }, data: { passwordHash } });
  return { mensaje: 'Contraseña actualizada correctamente' };
};

export const loginConGoogleService = async (token: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID as string
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AuthServiceError(400, 'No se pudo verificar la cuenta de Google o no se obtuvo el correo.');
  }

  const correoNormalizado = payload.email.toLowerCase().trim();
  let usuario = await prisma.usuario.findUnique({
    where: { correo: correoNormalizado },
    include: { rol: true }
  });

  if (!usuario) {
    let rolEstudiante = await prisma.rol.findFirst({ where: { nombre: 'Estudiante' } });
    if (!rolEstudiante) rolEstudiante = await prisma.rol.create({ data: { nombre: 'Estudiante' } });

    let carreraDummy = await prisma.carrera.findFirst({ where: { nombre: 'Sin Especificar' } });
    if (!carreraDummy) carreraDummy = await prisma.carrera.create({ data: { nombre: 'Sin Especificar' } });

    usuario = await prisma.usuario.create({
      data: {
        nombreCompleto: payload.name || 'Usuario de Google',
        correo: correoNormalizado,
        passwordHash: '',
        carreraId: carreraDummy.id,
        rolId: rolEstudiante.id,
        correoVerificado: true
      },
      include: { rol: true },
    });
  }

  if (!usuario.activo) {
    throw new AuthServiceError(403, 'Tu cuenta se encuentra suspendida.');
  }

  const jwtToken = jwt.sign({ id: usuario.id, rol: usuario.rol.nombre }, JWT_SECRET, { expiresIn: '8h' });

  return {
    token: jwtToken,
    usuario: {
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      ci: usuario.ci,
      telefono: usuario.telefono,
      rol: usuario.rol.nombre
    }
  };
};

export const desactivarCuentaService = async (usuarioId: number) => {
  await prisma.usuario.update({ where: { id: usuarioId }, data: { activo: false } });
  return { mensaje: 'Cuenta desactivada exitosamente' };
};

export const cambiarPasswordService = async (usuarioId: number, passwordActual: string, nuevaPassword: string) => {
  if (!passwordActual || !nuevaPassword) {
    throw new AuthServiceError(400, 'Debes proporcionar tu contraseña actual y la nueva contraseña');
  }

  if (nuevaPassword.length < 6) {
    throw new AuthServiceError(400, 'La nueva contraseña debe tener al menos 6 caracteres');
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    throw new AuthServiceError(404, 'Usuario no encontrado');
  }

  // Si el usuario se registro con Google y no tiene passwordHash establecido
  if (!usuario.passwordHash) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nuevaPassword, salt);

    await prisma.usuario.update({ where: { id: usuarioId }, data: { passwordHash } });
    await prisma.auditoria.create({
      data: { usuarioId, accion: 'Asignacion de contrasena local para usuario OAuth Google' }
    }).catch(() => null);

    return { mensaje: 'Contraseña establecida exitosamente' };
  }

  const coincide = await bcrypt.compare(passwordActual, usuario.passwordHash);
  if (!coincide) {
    throw new AuthServiceError(400, 'La contraseña actual no es correcta');
  }

  const esMisma = await bcrypt.compare(nuevaPassword, usuario.passwordHash);
  if (esMisma) {
    throw new AuthServiceError(400, 'La nueva contraseña no puede ser igual a la contraseña actual');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(nuevaPassword, salt);

  await prisma.usuario.update({ where: { id: usuarioId }, data: { passwordHash } });
  await prisma.auditoria.create({
    data: { usuarioId, accion: 'Cambio de contrasena realizado por el propio usuario' }
  }).catch(() => null);

  return { mensaje: 'Contraseña actualizada correctamente' };
};