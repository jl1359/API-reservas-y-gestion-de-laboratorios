import { prisma } from '../config/prisma';

export interface FiltrosUsuarios {
  rolId?: number;
  carreraId?: number;
  activo?: boolean;
  busqueda?: string;
}

export const listarUsuariosService = async (filtros: FiltrosUsuarios = {}) => {
  const where: any = {};

  if (filtros.rolId) {
    where.rolId = filtros.rolId;
  }

  if (filtros.carreraId) {
    where.carreraId = filtros.carreraId;
  }

  if (typeof filtros.activo === 'boolean') {
    where.activo = filtros.activo;
  }

  if (filtros.busqueda && filtros.busqueda.trim()) {
    const q = filtros.busqueda.trim();
    where.OR = [
      { nombreCompleto: { contains: q, mode: 'insensitive' } },
      { correo: { contains: q, mode: 'insensitive' } },
      { telefono: { contains: q, mode: 'insensitive' } }
    ];
  }

  return prisma.usuario.findMany({
    where,
    select: {
      id: true,
      nombreCompleto: true,
      correo: true,
      telefono: true,
      activo: true,
      correoVerificado: true,
      carreraId: true,
      rolId: true,
      rol: {
        select: { id: true, nombre: true }
      },
      carrera: {
        select: { id: true, nombre: true }
      }
    },
    orderBy: { id: 'asc' }
  });
};

export const cambiarRolUsuarioService = async (
  adminId: number,
  usuarioId: number,
  nuevoRolId: number,
  motivo?: string
) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { rol: true }
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const nuevoRol = await prisma.rol.findUnique({
    where: { id: nuevoRolId }
  });

  if (!nuevoRol) {
    throw new Error('El rol especificado no existe');
  }

  const rolAnterior = usuario.rol.nombre;

  if (usuario.rolId === nuevoRolId) {
    throw new Error(`El usuario ya posee el rol '${nuevoRol.nombre}'`);
  }

  const usuarioActualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { rolId: nuevoRolId },
    include: {
      rol: { select: { id: true, nombre: true } },
      carrera: { select: { id: true, nombre: true } }
    }
  });

  // Registrar auditoría de seguridad
  const detalleMotivo = motivo && motivo.trim() ? ` Motivo: ${motivo.trim()}` : '';
  await prisma.auditoria.create({
    data: {
      usuarioId: adminId,
      accion: `Gestión de Roles (HU-02): Modificación directa de rol de '${usuario.nombreCompleto}' (${usuario.correo}) de [${rolAnterior}] a [${nuevoRol.nombre}].${detalleMotivo}`
    }
  }).catch(() => null);

  // Notificar al usuario afectado
  await prisma.notificacion.create({
    data: {
      usuarioId: usuario.id,
      mensaje: `Tu rol en el sistema ha sido actualizado a '${nuevoRol.nombre}' por la administración universitaria.${detalleMotivo}`
    }
  }).catch(() => null);

  return usuarioActualizado;
};

export const cambiarEstadoUsuarioService = async (
  adminId: number,
  usuarioId: number,
  activo: boolean
) => {
  if (adminId === usuarioId) {
    throw new Error('No puedes suspender tu propia cuenta de administrador');
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId }
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const actualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: { activo },
    include: {
      rol: { select: { id: true, nombre: true } },
      carrera: { select: { id: true, nombre: true } }
    }
  });

  const estadoStr = activo ? 'Habilitada' : 'Suspendida';
  await prisma.auditoria.create({
    data: {
      usuarioId: adminId,
      accion: `Gestión de Cuentas (HU-02): Cuenta de '${usuario.nombreCompleto}' (${usuario.correo}) marcada como [${estadoStr}].`
    }
  }).catch(() => null);

  return actualizado;
};

export const actualizarPerfilService = async (
  usuarioId: number,
  datos: { nombreCompleto?: string; telefono?: string | null }
) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId }
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const dataToUpdate: any = {};
  if (datos.nombreCompleto && datos.nombreCompleto.trim()) {
    dataToUpdate.nombreCompleto = datos.nombreCompleto.trim();
  }
  if (datos.telefono !== undefined) {
    dataToUpdate.telefono = datos.telefono ? datos.telefono.trim() : null;
  }

  return prisma.usuario.update({
    where: { id: usuarioId },
    data: dataToUpdate,
    select: {
      id: true,
      nombreCompleto: true,
      correo: true,
      telefono: true,
      activo: true,
      correoVerificado: true,
      rol: { select: { id: true, nombre: true } },
      carrera: { select: { id: true, nombre: true } }
    }
  });
};

export const obtenerHistorialSesionesYAuditoriaService = async (limite: number = 100) => {
  return prisma.auditoria.findMany({
    take: limite,
    orderBy: { fechaHora: 'desc' },
    include: {
      usuario: {
        select: {
          id: true,
          nombreCompleto: true,
          correo: true,
          rol: { select: { nombre: true } }
        }
      }
    }
  });
};
