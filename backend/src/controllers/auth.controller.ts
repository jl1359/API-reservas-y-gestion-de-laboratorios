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
    return res.status(500).json({ error: 'No se pudo completar el registro. Inténtalo de nuevo.' });
  }
};

export const verificarCorreo = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.params;
    const resultado = await verificarCorreoService(token as string);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ error: 'El enlace de activación no es válido o ha expirado. Solicita uno nuevo.' });
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
    return res.status(500).json({ error: 'No se pudo reenviar el enlace de activación. Inténtalo más tarde.' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const validacion = loginSchema.safeParse(req.body);
    if (!validacion.success) {
      return res.status(400).json({ error: 'Correo o contraseña incorrectos' });
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
    return res.status(500).json({ error: 'No se pudo iniciar sesión. Inténtalo nuevamente.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.status(400).json({ error: 'Debes ingresar tu correo electrónico' });
    }
    const resultado = await forgotPasswordService(correo);
    return res.json(resultado);
  } catch (error: any) {
    if (error instanceof AuthServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    return res.status(500).json({ error: 'No se pudo enviar el correo de recuperación' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'El enlace de recuperación y la nueva contraseña son obligatorios' });
    }
    const resultado = await resetPasswordService(token, newPassword);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ error: 'El enlace de recuperación no es válido o ha expirado' });
  }
};

export const loginConGoogle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'No se recibió la confirmación de Google. Inténtalo de nuevo.' });
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
    return res.status(500).json({ error: 'No se pudo autenticar con Google. Inténtalo de nuevo.' });
  }
};

export const desactivarCuenta = async (req: Request, res: Response): Promise<any> => {
  try {
    const usuarioId = (req as any).user?.id;
    if (!usuarioId) return res.status(401).json({ error: 'Debes iniciar sesión para continuar' });

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
      return res.status(401).json({ error: 'Debes iniciar sesión para continuar' });
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