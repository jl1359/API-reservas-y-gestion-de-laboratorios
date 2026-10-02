import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { nombreCompleto, correo, password, carreraId } = req.body;

    // 1. Validar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // 2. Obtener o crear el rol "Estudiante" por defecto
    let rolEstudiante = await prisma.rol.findFirst({ where: { nombre: 'Estudiante' } });
    if (!rolEstudiante) {
      rolEstudiante = await prisma.rol.create({ data: { nombre: 'Estudiante' } });
    }

    // 3. Obtener o crear una carrera temporal (si envían un ID, usarlo, sino crear dummy)
    // Nota: Esto es solo para que no te tire error probando, en producción las carreras ya existen.
    let carreraFinalId = carreraId;
    if (!carreraFinalId) {
      const carreraDummy = await prisma.carrera.create({ data: { nombre: 'Ingeniería de Sistemas' } });
      carreraFinalId = carreraDummy.id;
    }

    // 4. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 5. Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombreCompleto,
        correo,
        passwordHash,
        carreraId: carreraFinalId,
        rolId: rolEstudiante.id,
      },
    });

    return res.status(201).json({ 
      mensaje: 'Usuario registrado exitosamente', 
      usuarioId: nuevoUsuario.id 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { correo, password } = req.body;

    // 1. Buscar usuario y traer su Rol
    const usuario = await prisma.usuario.findUnique({ 
      where: { correo }, 
      include: { rol: true } 
    });
    
    if (!usuario) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // 2. Verificar contraseña con Bcrypt
    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // 3. Revisar si la cuenta está activa
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Tu cuenta está inactiva o suspendida' });
    }

    // 4. Generar el JWT
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol.nombre },
      process.env.JWT_SECRET || 'secreto_de_respaldo',
      { expiresIn: '8h' } // La sesión dura 8 horas
    );

    // 5. Devolver datos al Frontend
    return res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        rol: usuario.rol.nombre
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
};


import { enviarCorreoRecuperacion } from '../helpers/mailer';

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { correo } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const resetToken = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET || 'secreto', { expiresIn: '15m' });
    await enviarCorreoRecuperacion(usuario.correo, resetToken);
    res.json({ mensaje: 'Si el correo existe, se enviar� un enlace de recuperaci�n' });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar el correo' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto') as { id: number };
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await prisma.usuario.update({ where: { id: decoded.id }, data: { passwordHash } });
    res.json({ mensaje: 'Contrase�a actualizada correctamente' });
  } catch (error) {
    res.status(400).json({ error: 'Token inv�lido o expirado' });
  }
};


import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginConGoogle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;

    // 1. Verificar el token de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID as string,
    });
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ error: 'Token de Google inv�lido' });

    const { email, name } = payload;
    if (!email) return res.status(400).json({ error: 'No se pudo obtener el correo' });

    // 2. Buscar si el usuario ya existe en nuestra BD
    let usuario = await prisma.usuario.findUnique({ where: { correo: email }, include: { rol: true } });

    // 3. Auto-registro: Si no existe, lo creamos autom�ticamente
    if (!usuario) {
      let rolEstudiante = await prisma.rol.findFirst({ where: { nombre: 'Estudiante' } });
      if (!rolEstudiante) rolEstudiante = await prisma.rol.create({ data: { nombre: 'Estudiante' } });

      let carreraDummy = await prisma.carrera.findFirst();
      if (!carreraDummy) carreraDummy = await prisma.carrera.create({ data: { nombre: 'Sin Especificar' } });

      usuario = await prisma.usuario.create({
        data: {
          nombreCompleto: name || 'Usuario de Google',
          correo: email,
          passwordHash: '', // Usuarios de Google no necesitan password hash local
          carreraId: carreraDummy.id,
          rolId: rolEstudiante.id,
        },
        include: { rol: true },
      });
    }

    if (!usuario.activo) return res.status(403).json({ error: 'Cuenta suspendida' });

    // 4. Generar el JWT local de nuestro sistema
    const jwtToken = jwt.sign(
      { id: usuario.id, rol: usuario.rol.nombre },
      process.env.JWT_SECRET || 'secreto_de_respaldo',
      { expiresIn: '8h' }
    );

    return res.json({
      mensaje: 'Login con Google exitoso',
      token: jwtToken,
      usuario: {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        rol: usuario.rol.nombre,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al autenticar con Google' });
  }
};


export const desactivarCuenta = async (req: Request, res: Response): Promise<any> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { activo: false }
    });

    return res.json({ mensaje: 'Cuenta eliminada (desactivada) exitosamente' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al desactivar la cuenta' });
  }
};
