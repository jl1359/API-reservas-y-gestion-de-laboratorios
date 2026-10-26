import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Listar catálogo de equipamientos base disponibles.
 */
export const listarEquipamientosBase = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const equipamientos = await prisma.equipamiento.findMany({
      orderBy: { nombre: 'asc' }
    });
    return res.json(equipamientos);
  } catch (error) {
    console.error('Error al listar equipamientos:', error);
    return res.status(500).json({ error: 'Error al listar los equipamientos' });
  }
};

/**
 * Vincular o actualizar la cantidad de un equipamiento asignado a un laboratorio.
 */
export const vincularEquipamiento = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { equipamientoId, cantidad } = req.body;

    if (!equipamientoId || !cantidad || cantidad < 1) {
      return res.status(400).json({ error: 'Debes enviar el ID del equipamiento y una cantidad válida' });
    }

    const laboratorio = await prisma.laboratorio.findUnique({ where: { id: Number(id) } });
    if (!laboratorio) return res.status(404).json({ error: 'Laboratorio no encontrado' });

    const equipamientoBase = await prisma.equipamiento.findUnique({ where: { id: Number(equipamientoId) } });
    if (!equipamientoBase) return res.status(404).json({ error: 'El equipamiento base no existe' });

    const vinculoExistente = await prisma.laboratorioEquipamiento.findFirst({
      where: {
        laboratorioId: Number(id),
        equipamientoId: Number(equipamientoId)
      }
    });

    if (vinculoExistente) {
      const actualizado = await prisma.laboratorioEquipamiento.update({
        where: { id: vinculoExistente.id },
        data: { cantidad: Number(cantidad) }
      });
      return res.json({ mensaje: 'Equipamiento actualizado en el laboratorio', data: actualizado });
    } else {
      const nuevoVinculo = await prisma.laboratorioEquipamiento.create({
        data: {
          laboratorioId: Number(id),
          equipamientoId: Number(equipamientoId),
          cantidad: Number(cantidad)
        }
      });
      return res.status(201).json({ mensaje: 'Equipamiento vinculado al laboratorio', data: nuevoVinculo });
    }
  } catch (error) {
    console.error('Error al vincular equipamiento:', error);
    return res.status(500).json({ error: 'Error al vincular el equipamiento' });
  }
};

/**
 * Registrar un nuevo tipo de equipamiento en el catálogo maestro.
 */
export const crearEquipamiento = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { nombre, tipo } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del equipamiento es obligatorio' });
    }
    const categoria = tipo && typeof tipo === 'string' && tipo.trim() !== '' ? tipo.trim() : 'General';

    const existente = await prisma.equipamiento.findFirst({
      where: { nombre: { equals: nombre.trim(), mode: 'insensitive' } }
    });

    if (existente) {
      return res.status(409).json({ error: 'Ya existe un equipamiento registrado con ese nombre en el catálogo' });
    }

    const nuevo = await prisma.equipamiento.create({
      data: {
        nombre: nombre.trim(),
        tipo: categoria
      }
    });

    return res.status(201).json({ mensaje: 'Equipamiento registrado exitosamente en el catálogo', data: nuevo });
  } catch (error) {
    console.error('Error al registrar equipamiento:', error);
    return res.status(500).json({ error: 'Error al registrar el equipamiento' });
  }
};

/**
 * Actualizar la cantidad de unidades de un equipamiento asignado a un laboratorio.
 */
export const actualizarCantidadEquipamiento = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { labId, equipId } = req.params;
    const { cantidad } = req.body;

    const cantNum = Number(cantidad);
    if (!Number.isInteger(cantNum) || cantNum <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a cero' });
    }

    const vinculo = await prisma.laboratorioEquipamiento.findFirst({
      where: {
        laboratorioId: Number(labId),
        equipamientoId: Number(equipId)
      }
    });

    if (!vinculo) {
      return res.status(404).json({ error: 'El equipamiento no está asignado a este laboratorio' });
    }

    const actualizado = await prisma.laboratorioEquipamiento.update({
      where: { id: vinculo.id },
      data: { cantidad: cantNum },
      include: { equipamiento: true }
    });

    return res.json({
      success: true,
      mensaje: 'Cantidad de equipamiento actualizada exitosamente',
      data: actualizado
    });
  } catch (error: any) {
    console.error('Error al actualizar cantidad de equipamiento:', error);
    return res.status(500).json({ error: 'Error al actualizar cantidad de equipamiento' });
  }
};

/**
 * Desvincular un equipamiento de un laboratorio específico.
 */
export const desvincularEquipamiento = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { labId, equipId } = req.params;

    const vinculo = await prisma.laboratorioEquipamiento.findFirst({
      where: {
        laboratorioId: Number(labId),
        equipamientoId: Number(equipId)
      }
    });

    if (!vinculo) {
      return res.status(404).json({ error: 'El equipamiento no está asignado a este laboratorio' });
    }

    await prisma.laboratorioEquipamiento.delete({
      where: { id: vinculo.id }
    });

    return res.json({
      success: true,
      mensaje: 'Equipamiento retirado del laboratorio exitosamente'
    });
  } catch (error: any) {
    console.error('Error al desvincular equipamiento:', error);
    return res.status(500).json({ error: 'Error al desvincular equipamiento' });
  }
};