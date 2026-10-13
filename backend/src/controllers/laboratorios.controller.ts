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

    const filtros: Prisma.LaboratorioWhereInput = {}; if (req.query.incluirTodos !== 'true') { filtros.estadoOperativo = 'Activo'; }

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

// =========================================================================
// INTEGRACIÓN HU-05 (HERLAN): CREACIÓN Y GESTIÓN CRUD DE LABORATORIOS
// =========================================================================

const manejarErrorPrisma = (error: any, res: Response, mensajeBase: string) => {
  if (error.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Ya existe un laboratorio con ese nombre' });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Laboratorio no encontrado' });
  }
  if (error.code === 'P2003') {
    return res.status(409).json({ success: false, message: 'No se puede eliminar: el laboratorio tiene reservas o dependencias asociadas' });
  }
  return res.status(500).json({ success: false, message: mensajeBase, error: error.message });
};

export const crearLaboratorio = async (req: Request, res: Response): Promise<any> => {
  try {
    const { nombre, capacidad, ubicacion, estadoOperativo, carreraId, imagenUrl, reservaPorComputadora } = req.body;

      if (Number(capacidad) <= 0) {
        return res.status(400).json({ error: 'La capacidad debe ser un numero positivo mayor a cero' });
      }
    const nuevoLab = await prisma.laboratorio.create({
      data: {
        nombre,
        capacidad: Number(capacidad),
        ubicacion,
        estadoOperativo: estadoOperativo || 'Activo',
        carreraId: carreraId ? Number(carreraId) : null,
        imagenUrl,
        reservaPorComputadora: reservaPorComputadora || false,
      },
    });
    return res.status(201).json({ success: true, message: 'Laboratorio creado exitosamente', data: nuevoLab });
  } catch (error: any) {
    return manejarErrorPrisma(error, res, 'Error al crear el laboratorio');
  }
};

export const obtenerLaboratorioPorId = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'ID invalido' });
    
    const lab = await prisma.laboratorio.findUnique({
      where: { id },
      include: { carrera: true, equipos: { include: { equipamiento: true } } }
    });
    if (!lab) return res.status(404).json({ success: false, message: 'Laboratorio no encontrado' });
    
    return res.json({ success: true, data: lab });
  } catch (error: any) {
    return manejarErrorPrisma(error, res, 'Error al obtener el laboratorio');
  }
};

export const actualizarLaboratorio = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'ID invalido' });
    
    const { nombre, capacidad, ubicacion, estadoOperativo, carreraId, imagenUrl, reservaPorComputadora } = req.body;
    const lab = await prisma.laboratorio.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(capacidad && { capacidad: Number(capacidad) }),
        ...(ubicacion !== undefined && { ubicacion }),
        ...(estadoOperativo && { estadoOperativo }),
        ...(carreraId !== undefined && { carreraId: carreraId ? Number(carreraId) : null }),
        ...(imagenUrl !== undefined && { imagenUrl }),
        ...(reservaPorComputadora !== undefined && { reservaPorComputadora }),
      },
    });
    return res.json({ success: true, message: 'Laboratorio actualizado', data: lab });
  } catch (error: any) {
    return manejarErrorPrisma(error, res, 'Error al actualizar el laboratorio');
  }
};

export const eliminarLaboratorio = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ success: false, message: 'ID invalido' });
    
    // BAJA LÓGICA: En lugar de hacer un delete físico, actualizamos el estado para no romper el historial de reservas.
    await prisma.laboratorio.update({ 
      where: { id },
      data: { estadoOperativo: 'Clausurado' } 
    });
    
    return res.json({ success: true, message: 'Laboratorio clausurado (baja lógica) exitosamente' });
  } catch (error: any) {
    return manejarErrorPrisma(error, res, 'Error al clausurar el laboratorio');
  }
};
