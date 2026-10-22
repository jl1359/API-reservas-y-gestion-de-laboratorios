import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// [ESTUDIANTE] Solicitar un nuevo rol
export const solicitarRol = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const usuarioId = req.user?.id;
    const { rolSolicitado, motivo } = req.body;

    if (rolSolicitado === 'Admin' || rolSolicitado === 'Administrador') {
      return res.status(403).json({ error: 'Brecha de seguridad detectada: No se puede solicitar permisos de Administrador' });
    } // Ej: "Docente" o "Auxiliar"

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
        motivo,
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
      orderBy: { id: 'desc' }
    });

    return res.json(solicitudes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al listar solicitudes' });
  }
};

// [ADMIN] Aprobar o Rechazar solicitud con justificación obligatoria
export const gestionarSolicitud = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // ID de la solicitud
    const { accion, motivoRechazo } = req.body; // "Aprobar" o "Rechazar"

    const solicitud = await prisma.solicitudRol.findUnique({ where: { id: Number(id) } });
    
    if (!solicitud || solicitud.estado !== 'Pendiente') {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }

    if (accion === 'Rechazar') {
      const motivo = motivoRechazo && typeof motivoRechazo === 'string' && motivoRechazo.trim() !== ''
        ? motivoRechazo.trim()
        : 'La solicitud no cumple con los antecedentes y requisitos académicos necesarios';

      await prisma.solicitudRol.update({
        where: { id: Number(id) },
        data: { estado: 'Rechazada' },
      });

      // Notificación formal al usuario
      await prisma.notificacion.create({
        data: {
          usuarioId: solicitud.usuarioId,
          mensaje: `Tu solicitud de cambio al rol de '${solicitud.rolSolicitado}' ha sido rechazada por la administración. Motivo: ${motivo}`
        }
      }).catch(() => null);

      // Bitácora inmutable de auditoría
      await prisma.auditoria.create({
        data: {
          usuarioId: req.user?.id || null,
          accion: `Rechazo de Solicitud de Rol: Rol '${solicitud.rolSolicitado}' para usuario #${solicitud.usuarioId}. Motivo: ${motivo}`
        }
      }).catch(() => null);

      return res.json({ mensaje: 'Solicitud rechazada formalmente y notificada al usuario' });
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

      // Notificación al usuario
      await prisma.notificacion.create({
        data: {
          usuarioId: solicitud.usuarioId,
          mensaje: `Tu solicitud ha sido aprobada. Ahora cuentas con el rol de '${solicitud.rolSolicitado}' en la plataforma.`
        }
      }).catch(() => null);

      // Bitácora de auditoría
      await prisma.auditoria.create({
        data: {
          usuarioId: req.user?.id || null,
          accion: `Aprobación de Rol: Usuario #${solicitud.usuarioId} ascendido exitosamente al rol '${solicitud.rolSolicitado}'.`
        }
      }).catch(() => null);

      return res.json({ mensaje: 'Rol actualizado y solicitud aprobada' });
    }

    return res.status(400).json({ error: 'Acción no válida' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al gestionar la solicitud' });
  }
};

export const listarRoles = async (req: Request, res: Response): Promise<any> => {
  try {
    const { todos, paraAdmin } = req.query;
    const where: any = {};

    if (todos === 'true' || paraAdmin === 'true') {
      // Para administración de usuarios en el Panel Admin, se excluyen variantes de Administrador
      where.nombre = { notIn: ['Admin', 'Administrador'] };
    } else {
      // Para solicitudes de rol desde el perfil de estudiante
      where.nombre = { notIn: ['Admin', 'Administrador', 'Estudiante'] };
    }

    const roles = await prisma.rol.findMany({
      where,
      orderBy: { id: 'asc' }
    });
    return res.json(roles);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener los roles' });
  }
};
