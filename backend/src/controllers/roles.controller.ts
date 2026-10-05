import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// [ESTUDIANTE] Solicitar un nuevo rol
export const solicitarRol = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    const { rolSolicitado } = req.body; // Ej: "Docente" o "Auxiliar"

    if (!usuarioId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el rol existe en la BD
    const rolValido = await prisma.rol.findFirst({ where: { nombre: rolSolicitado } });
    if (!rolValido) {
      return res.status(400).json({ error: 'El rol solicitado no existe' });
    }

    // Verificar si ya tiene una solicitud pendiente
    const solicitudPrevia = await prisma.solicitudRol.findFirst({
      where: { usuarioId, estado: 'Pendiente' },
    });

    if (solicitudPrevia) {
      return res.status(400).json({ error: 'Ya tienes una solicitud pendiente de revisión' });
    }

    // Crear solicitud
    const nuevaSolicitud = await prisma.solicitudRol.create({
      data: {
        usuarioId,
        rolSolicitado,
        estado: 'Pendiente',
      },
    });

    return res.status(201).json({
      mensaje: 'Solicitud enviada correctamente',
      solicitud: nuevaSolicitud,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al enviar la solicitud de rol' });
  }
};

// [ADMIN] Ver todas las solicitudes pendientes
export const listarSolicitudes = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const solicitudes = await prisma.solicitudRol.findMany({
      where: { estado: 'Pendiente' },
      include: {
        usuario: {
          select: { nombreCompleto: true, correo: true, rol: true },
        },
      },
    });

    return res.json(solicitudes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al listar solicitudes' });
  }
};

// [ADMIN] Aprobar o Rechazar solicitud
export const gestionarSolicitud = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // ID de la solicitud
    const { accion } = req.body; // "Aprobar" o "Rechazar"

    const solicitud = await prisma.solicitudRol.findUnique({ where: { id: Number(id) } });
    
    if (!solicitud || solicitud.estado !== 'Pendiente') {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }

    if (accion === 'Rechazar') {
      await prisma.solicitudRol.update({
        where: { id: Number(id) },
        data: { estado: 'Rechazada' },
      });
      return res.json({ mensaje: 'Solicitud rechazada correctamente' });
    }

    if (accion === 'Aprobar') {
      // 1. Encontrar el ID del nuevo rol
      const nuevoRol = await prisma.rol.findFirst({ where: { nombre: solicitud.rolSolicitado } });
      if (!nuevoRol) {
        return res.status(400).json({ error: 'Error interno: el rol ya no existe' });
      }

      // 2. Actualizar el rol del usuario en la BD
      await prisma.usuario.update({
        where: { id: solicitud.usuarioId },
        data: { rolId: nuevoRol.id },
      });

      // 3. Marcar solicitud como Aprobada
      await prisma.solicitudRol.update({
        where: { id: Number(id) },
        data: { estado: 'Aprobada' },
      });

      return res.json({ mensaje: 'Rol actualizado y solicitud aprobada' });
    }

    return res.status(400).json({ error: 'Acción no válida' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al gestionar la solicitud' });
  }
};
