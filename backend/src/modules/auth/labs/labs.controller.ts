//MANEJO DE PETICINOES Y RESPUESTAS HTTP
import { Request, Response } from 'express';
import { createLab } from './labs.service';

export async function createLabHandler(req: Request, res: Response) {
  try {
    const lab = await createLab(req.body);
    return res.status(201).json({
      success: true,
      message: "Laboratorio creado exitosamente",
      data: lab,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error al crear el laboratorio",
      error: error.message,
    });
  }
}