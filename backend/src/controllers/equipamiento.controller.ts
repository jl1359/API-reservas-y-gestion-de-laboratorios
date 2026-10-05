import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// =======================================================
// MÓDULO DE EQUIPAMIENTO (HU-07)
// =======================================================

// 1. Obtener catálogo de equipamientos (Para llenar el combobox del Frontend)
export const listarEquipamientosBase = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const equipamientos = await prisma.equipamiento.findMany();
    return res.json(equipamientos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al listar los equipamientos' });
  }
};

// 2. Vincular un equipamiento a un laboratorio
export const vincularEquipamiento = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params; // ID del laboratorio
    const { equipamientoId, cantidad } = req.body;

    if (!equipamientoId || !cantidad || cantidad < 1) {
      return res.status(400).json({ error: 'Debes enviar el ID del equipamiento y una cantidad válida' });
    }

    // Verificar que el laboratorio exista
    const laboratorio = await prisma.laboratorio.findUnique({ where: { id: Number(id) } });
    if (!laboratorio) return res.status(404).json({ error: 'Laboratorio no encontrado' });

    // Verificar que el equipamiento base exista
    const equipamientoBase = await prisma.equipamiento.findUnique({ where: { id: Number(equipamientoId) } });
    if (!equipamientoBase) return res.status(404).json({ error: 'El equipamiento base no existe' });

    // Upsert: Si ya estaba vinculado, suma la cantidad (o la actualiza). Si no, lo crea.
    // Buscamos si ya existe el vínculo
    const vinculoExistente = await prisma.laboratorioEquipamiento.findFirst({
      where: {
        laboratorioId: Number(id),
        equipamientoId: Number(equipamientoId)
      }
    });

    if (vinculoExistente) {
      // Si existe, actualizamos la cantidad
      const actualizado = await prisma.laboratorioEquipamiento.update({
        where: { id: vinculoExistente.id },
        data: { cantidad: vinculoExistente.cantidad + Number(cantidad) } // Sumamos la cantidad enviada
      });
      return res.json({ mensaje: 'Equipamiento actualizado en el laboratorio', data: actualizado });
    } else {
      // Si no existe, creamos el vínculo
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
    console.error(error);
    return res.status(500).json({ error: 'Error al vincular el equipamiento' });
  }
};