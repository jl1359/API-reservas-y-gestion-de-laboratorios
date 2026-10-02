// PARTE LOGICA DEL SERVICIO DE INTERACCION CON EL PRISMA
import { prisma } from '../../../config/database';
import { CrearLabInput } from './labs.schema';

export async function crearLab(data: CrearLabInput) {
  const lab = await prisma.laboratorio.create({
    data: {
      nombre: data.name,            // Se mapea a la columna 'nombre'
      capacidad: data.capacity,     // Se mapea a la columna 'capacidad'
      estadoOperativo: data.status, // Se mapea a la columna 'estado_operativo'
    },
  });

  return lab;
}