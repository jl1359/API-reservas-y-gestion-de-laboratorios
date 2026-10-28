import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { registroSchema, loginSchema } from '../validators/usuario.validator';
import {
  AuthServiceError,
  registrarUsuarioService,
  verificarCorreoService,
  reenviarActivacionService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
  loginConGoogleService,
  desactivarCuentaService,
  cambiarPasswordService
} from '../services/auth.service';

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const validacion = registroSchema.safeParse(req.body);
    if (!validacion.success) {
      const errorMsg = (validacion.error as any).issues?.[0]?.message || (validacion.error as any).errors?.[0]?.message || 'Datos de registro inválidos';
      return res.status(400).json({ error: errorMsg });
    }

    const nuevoUsuario = await registrarUsuarioService(validacion.data);

    return res.status(201).json({ 
      mensaje: 'Usuario registrado exitosamente. Revisa tu correo electrónico para activar tu cuenta.', 
      usuarioId: nuevoUsuario.id 
    });
  } catch (error: any) {
    if (error instanceof AuthServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error en register:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar' });
  }
};

export const verificarCorreo = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.params;
    const resultado = await verificarCorreoService(token as string);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ error: 'Token de activación inválido o expirado' });
  }
};

export const reenviarActivacion = async (req: Request, res: Response): Promise<any> => {
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.status(400).json({ error: 'Debes ingresar un correo electrónico' });
    }
    const resultado = await reenviarActivacionService(correo);
    return res.json(resultado);
  } catch (error: any) {
    if (error instanceof AuthServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al reenviar el enlace de activación' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const validacion = loginSchema.safeParse(req.body);
    if (!validacion.success) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const { correo, password } = validacion.data;
    const resultado = await loginService(correo, password);
    return res.json({
      mensaje: 'Login exitoso',
      ...resultado
    });
  } catch (error: any) {
    if (error instanceof AuthServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.status(400).json({ error: 'Correo obligatorio' });
    }
    const resultado = await forgotPasswordService(correo);
    return res.json(resultado);
  } catch (error: any) {
    if (error instanceof AuthServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al enviar el correo' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña obligatorios' });
    }
    const resultado = await resetPasswordService(token, newPassword);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }
};

export const loginConGoogle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token de Google requerido' });
    }

    const resultado = await loginConGoogleService(token);
    return res.json({
      mensaje: 'Login con Google exitoso',
      ...resultado
    });
  } catch (error: any) {
    if (error instanceof AuthServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al autenticar con Google' });
  }
};

export const desactivarCuenta = async (req: Request, res: Response): Promise<any> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'No autenticado' });

    const resultado = await desactivarCuentaService(usuarioId);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(500).json({ error: 'Error al desactivar la cuenta' });
  }
};

export const cambiarPassword = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { passwordActual, nuevaPassword } = req.body;
    const resultado = await cambiarPasswordService(usuarioId, passwordActual, nuevaPassword);
    return res.json({
      success: true,
      ...resultado
    });
  } catch (error: any) {
    if (error instanceof AuthServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error al cambiar contrasena:', error);
    return res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
};