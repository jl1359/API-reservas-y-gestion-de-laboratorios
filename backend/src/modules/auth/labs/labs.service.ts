import { prisma } from '../../../config/database';
import { CrearLabInput, ActualizarLabInput } from './labs.schema';

export async function crearLab(data: CrearLabInput) {
  return prisma.laboratorio.create({
    data: {
      nombre: data.name,
      capacidad: data.capacity,
      ubicacion: data.location,
      estadoOperativo: data.status,
    },
  });
}

export async function obtenerLabs() {
  return prisma.laboratorio.findMany({ orderBy: { id: 'asc' } });
}

export async function obtenerLabPorId(id: number) {
  return prisma.laboratorio.findUnique({ where: { id } });
}

export async function actualizarLab(id: number, data: ActualizarLabInput) {
  return prisma.laboratorio.update({
    where: { id },
    data: {
      nombre: data.name,
      capacidad: data.capacity,
      ubicacion: data.location,
      estadoOperativo: data.status,
    },
  });
}

export async function eliminarLab(id: number) {
  return prisma.laboratorio.delete({ where: { id } });
}