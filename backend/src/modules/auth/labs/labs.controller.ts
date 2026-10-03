import { Request, Response } from 'express';
import {
  crearLab, obtenerLabs, obtenerLabPorId, actualizarLab, eliminarLab,
} from './labs.service';

function manejarError(error: any, res: Response, mensaje: string) {
  if (error.code === 'P2002') {
    return res.status(409).json({ success: false, message: "Ya existe un laboratorio con ese nombre" });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ success: false, message: "Laboratorio no encontrado" });
  }
  if (error.code === 'P2003') {
    return res.status(409).json({ success: false, message: "No se puede eliminar: el laboratorio tiene reservas asociadas" });
  }
  return res.status(500).json({ success: false, message: mensaje, error: error.message });
}

export async function crearControladorLab(req: Request, res: Response) {
  try {
    const lab = await crearLab(req.body);
    return res.status(201).json({ success: true, message: "Laboratorio creado exitosamente", data: lab });
  } catch (error: any) {
    return manejarError(error, res, "Error al crear el laboratorio");
  }
}

export async function obtenerControladorLabs(req: Request, res: Response) {
  try {
    const labs = await obtenerLabs();
    return res.json({ success: true, data: labs });
  } catch (error: any) {
    return manejarError(error, res, "Error al listar los laboratorios");
  }
}

export async function obtenerControladorLabPorId(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID inválido" });
    }
    const lab = await obtenerLabPorId(id);
    if (!lab) {
      return res.status(404).json({ success: false, message: "Laboratorio no encontrado" });
    }
    return res.json({ success: true, data: lab });
  } catch (error: any) {
    return manejarError(error, res, "Error al obtener el laboratorio");
  }
}

export async function actualizarControladorLab(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID inválido" });
    }
    const lab = await actualizarLab(id, req.body);
    return res.json({ success: true, message: "Laboratorio actualizado", data: lab });
  } catch (error: any) {
    return manejarError(error, res, "Error al actualizar el laboratorio");
  }
}

export async function eliminarControladorLab(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID inválido" });
    }
    await eliminarLab(id);
    return res.json({ success: true, message: "Laboratorio eliminado" });
  } catch (error: any) {
    return manejarError(error, res, "Error al eliminar el laboratorio");
  }
}