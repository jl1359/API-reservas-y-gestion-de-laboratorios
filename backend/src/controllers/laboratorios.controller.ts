import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

// HU-13: Filtrar laboratorios por capacidad, categoria, software y disponibilidad
export const listarLaboratorios = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { disponibleDesde, disponibleHasta, carrera, capacidadRequerida, reservaPorAsiento, tieneProyector } = req.query;

    const carreraTexto = typeof carrera === 'string' ? carrera.trim() : '';

    const filtros: Prisma.LaboratorioWhereInput = {
      estadoOperativo: 'Activo',
    };

    if (capacidadRequerida !== undefined && capacidadRequerida !== '') {
      const capacidad = Number(capacidadRequerida);
      if (!Number.isInteger(capacidad) || capacidad <= 0) {
        return res.status(400).json({ error: 'La capacidad requerida debe ser un numero entero mayor a cero' });
      }
      filtros.capacidad = { gte: capacidad };
    }

    if (carreraTexto) {
      filtros.carrera = {
        nombre: { contains: carreraTexto, mode: 'insensitive' }
      };
    }

    // FILTRO: Por Tipo de Reserva (Estudiante individual vs Clase completa)
    if (reservaPorAsiento !== undefined && reservaPorAsiento !== '') {
      filtros.reservaPorComputadora = reservaPorAsiento === 'true';
    }

    // FILTRO: Por Hardware (Proyector)
    if (tieneProyector === 'true') {
      filtros.equipos = {
        some: {
          equipamiento: {
            nombre: { contains: 'proyector', mode: 'insensitive' }
          }
        }
      };
    }

    // FILTRO: Disponibilidad de Horario
    if (disponibleDesde && disponibleHasta) {
      const fechaInicioReq = new Date(disponibleDesde as string);
      const fechaFinReq = new Date(disponibleHasta as string);

      if (isNaN(fechaInicioReq.getTime()) || isNaN(fechaFinReq.getTime())) {
        return res.status(400).json({ error: 'Las fechas de disponibilidad no son validas. Usa formato ISO8601' });
      }
      
      if (fechaInicioReq >= fechaFinReq) {
        return res.status(400).json({ error: 'La hora de inicio debe ser anterior a la hora de fin' });
      }

      // Si el laboratorio tiene reservas Aprobadas o Pendientes que "choquen" con este horario, lo descartamos
      filtros.reservas = {
        none: {
          estado: { in: ['Pendiente', 'Aprobada'] },
          fechaInicio: { lt: fechaFinReq },
          fechaFin: { gt: fechaInicioReq }
        }
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
