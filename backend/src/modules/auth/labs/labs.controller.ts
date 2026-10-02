//MANEJO DE PETICINOES Y RESPUESTAS HTTP
import { Request, Response } from 'express';
import { crearLab } from './labs.service';

export async function crearControladorLab(req: Request, res: Response) {
  try {
    const lab = await crearLab(req.body);
    return res.status(201).json({
      success: true,
      message: "Laboratorio creado exitosamente",
      data: lab,
    });
  } catch (error: any) {
  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: "Ya existe un laboratorio con ese nombre",
    });
  }
  return res.status(500).json({
    success: false,
    message: "Error al crear el laboratorio",
    error: error.message,
  });
  }
}