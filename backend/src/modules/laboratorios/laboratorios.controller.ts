import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

// HU-13: Filtrar laboratorios por capacidad, categoría o software
export const listarLaboratorios = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { capacidadMinima, categoria, software } = req.query;

    let capacidad: number | undefined;

    if (capacidadMinima !== undefined && capacidadMinima !== '') {
      capacidad = Number(capacidadMinima);

      if (!Number.isInteger(capacidad) || capacidad <= 0) {
        return res.status(400).json({
          error: 'La capacidad mínima debe ser un número entero mayor que cero',
        });
      }
    }

    const categoriaTexto =
      typeof categoria === 'string' ? categoria.trim() : '';

    const softwareTexto =
      typeof software === 'string' ? software.trim() : '';

    const filtros: Prisma.LaboratorioWhereInput = {
      estadoOperativo: 'Activo',
    };

    if (capacidad !== undefined) {
      filtros.capacidad = {
        gte: capacidad,
      };
    }

    if (categoriaTexto || softwareTexto) {
      filtros.equipos = {
        some: {
          equipamiento: {
            ...(categoriaTexto && {
              tipo: {
                equals: categoriaTexto,
                mode: 'insensitive',
              },
            }),
            ...(softwareTexto && {
              nombre: {
                contains: softwareTexto,
                mode: 'insensitive',
              },
            }),
          },
        },
      };
    }

    const laboratorios = await prisma.laboratorio.findMany({
      where: filtros,
      include: {
        equipos: {
          include: {
            equipamiento: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return res.status(200).json({
      total: laboratorios.length,
      laboratorios,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al consultar los laboratorios',
    });
  }
};