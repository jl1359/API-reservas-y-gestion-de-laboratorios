import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { enviarCorreoRecuperacion, enviarCorreoActivacion } from '../helpers/mailer';
import { OAuth2Client } from 'google-auth-library';

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { nombreCompleto, correo, password, carreraId } = req.body;
    const correoNormalizado = correo.toLowerCase().trim();

    const usuarioExistente = await prisma.usuario.findUnique({ where: { correo: correoNormalizado } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    let rolEstudiante = await prisma.rol.findFirst({ where: { nombre: 'Estudiante' } });
    if (!rolEstudiante) {
      rolEstudiante = await prisma.rol.create({ data: { nombre: 'Estudiante' } });
    }

    let carreraFinalId = carreraId;
    if (!carreraFinalId) {
      let carreraDummy = await prisma.carrera.findFirst({ where: { nombre: 'Sin Especificar' } });
      if (!carreraDummy) carreraDummy = await prisma.carrera.create({ data: { nombre: 'Sin Especificar' } });
      carreraFinalId = carreraDummy.id;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreCompleto,
        correo: correoNormalizado,
        passwordHash,
        carreraId: Number(carreraFinalId),
        rolId: rolEstudiante.id,
        correoVerificado: false // NUEVO: Obliga a verificar
      },
    });

    // Enviar el token de activación
    const activacionToken = jwt.sign({ id: nuevoUsuario.id }, process.env.JWT_SECRET || 'secreto_de_respaldo', { expiresIn: '1d' });
    
    // Lo mandamos de manera asíncrona para no bloquear la respuesta
    enviarCorreoActivacion(nuevoUsuario.correo, activacionToken).catch(e => console.error(e));

    return res.status(201).json({ 
      mensaje: 'Usuario registrado exitosamente. Revisa tu correo electrónico para activar tu cuenta.', 
      usuarioId: nuevoUsuario.id 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar' });
  }
};

export const verificarCorreo = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET || 'secreto_de_respaldo') as any as { id: number };
    
    await prisma.usuario.update({
      where: { id: decoded.id },
      data: { correoVerificado: true }
    });
    
    return res.json({ mensaje: 'Cuenta activada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    return res.status(400).json({ error: 'Token de activación inválido o expirado' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { correo, password } = req.body;
    const correoNormalizado = correo.toLowerCase().trim();

    const usuario = await prisma.usuario.findUnique({ where: { correo: correoNormalizado }, include: { rol: true } });
    if (!usuario) return res.status(400).json({ error: 'Credenciales inválidas' });

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) return res.status(400).json({ error: 'Credenciales inválidas' });

    if (!usuario.activo) return res.status(403).json({ error: 'Tu cuenta está inactiva' });
    
    // SEGURIDAD: Verificar que hayan confirmado su correo
    if (!usuario.correoVerificado) return res.status(403).json({ error: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.' });

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol.nombre }, process.env.JWT_SECRET || 'secreto_de_respaldo', { expiresIn: '8h' });

    return res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: usuario.id, nombreCompleto: usuario.nombreCompleto, correo: usuario.correo, rol: usuario.rol.nombre }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { correo } = req.body;
    const correoNormalizado = correo.toLowerCase().trim();
    const usuario = await prisma.usuario.findUnique({ where: { correo: correoNormalizado } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const resetToken = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET || 'secreto', { expiresIn: '15m' });
    await enviarCorreoRecuperacion(usuario.correo, resetToken);
    res.json({ mensaje: 'Si el correo existe, se enviará un enlace de recuperación' });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar el correo' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET || 'secreto') as any as { id: number };
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await prisma.usuario.update({ where: { id: decoded.id }, data: { passwordHash } });
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(400).json({ error: 'Token inválido o expirado' });
  }
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginConGoogle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID as string });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ error: 'Token de Google inválido' });

    const { email, name } = payload;
    if (!email) return res.status(400).json({ error: 'No se pudo obtener el correo' });
    
    const correoNormalizado = email.toLowerCase().trim();

    let usuario = await prisma.usuario.findUnique({ where: { correo: correoNormalizado }, include: { rol: true } });

    if (!usuario) {
      let rolEstudiante = await prisma.rol.findFirst({ where: { nombre: 'Estudiante' } });
      if (!rolEstudiante) rolEstudiante = await prisma.rol.create({ data: { nombre: 'Estudiante' } });

      let carreraDummy = await prisma.carrera.findFirst({ where: { nombre: 'Sin Especificar' } });
      if (!carreraDummy) carreraDummy = await prisma.carrera.create({ data: { nombre: 'Sin Especificar' } });

      usuario = await prisma.usuario.create({
        data: {
          nombreCompleto: name || 'Usuario de Google',
          correo: correoNormalizado,
          passwordHash: '', 
          carreraId: carreraDummy.id,
          rolId: rolEstudiante.id,
          correoVerificado: true // Si entra con google, ya está verificado
        },
        include: { rol: true },
      });
    }

    if (!usuario.activo) return res.status(403).json({ error: 'Cuenta suspendida' });

    const jwtToken = jwt.sign({ id: usuario.id, rol: usuario.rol.nombre }, process.env.JWT_SECRET || 'secreto_de_respaldo', { expiresIn: '8h' });

    return res.json({
      mensaje: 'Login con Google exitoso',
      token: jwtToken,
      usuario: { id: usuario.id, nombreCompleto: usuario.nombreCompleto, correo: usuario.correo, rol: usuario.rol.nombre },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al autenticar con Google' });
  }
};

export const desactivarCuenta = async (req: Request, res: Response): Promise<any> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });

    await prisma.usuario.update({ where: { id: usuarioId }, data: { activo: false } });
    return res.json({ mensaje: 'Cuenta desactivada exitosamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al desactivar la cuenta' });
  }
};