import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCarreras = async (req: Request, res: Response): Promise<any> => {
  try {
    const carreras = await prisma.carrera.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json(carreras);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener carreras' });
  }
};