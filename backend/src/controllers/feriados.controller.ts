import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { feriadoSchema } from '../validators/feriado.validator';


// GET /api/feriados - Listar todos los feriados y días bloqueados (Público / Autenticado)
export const listarFeriados = async (req: Request, res: Response): Promise<any> => {
  try {
    const feriados = await prisma.feriado.findMany({
      orderBy: {
        fecha: 'asc'
      }
    });

    return res.status(200).json({
      success: true,
      total: feriados.length,
      data: feriados
    });
  } catch (error) {
    console.error('Error al listar feriados:', error);
    return res.status(500).json({ error: 'Error interno al consultar feriados y bloqueos' });
  }
};

// POST /api/feriados - Crear un nuevo feriado o día bloqueado (Solo Admin)
export const crearFeriado = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const parseResult = feriadoSchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message || 'Datos de feriado inválidos';
      return res.status(400).json({ error: msg, issues: parseResult.error.issues });
    }

    const { fecha: fechaRaw, motivo, bloqueoActivo } = parseResult.data;

    // Normalizar a medianoche UTC
    const fechaObj = new Date(fechaRaw);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Utilice formato YYYY-MM-DD' });
    }

    const fechaNormalizada = new Date(Date.UTC(fechaObj.getUTCFullYear(), fechaObj.getUTCMonth(), fechaObj.getUTCDate()));

    // Verificar si ya existe un feriado registrado para esa fecha exacta
    const existente = await prisma.feriado.findFirst({
      where: {
        fecha: fechaNormalizada
      }
    });

    if (existente) {
      return res.status(409).json({
        error: `Ya existe un feriado o bloqueo registrado para esta fecha: ${existente.motivo}`
      });
    }

    const nuevoFeriado = await prisma.feriado.create({
      data: {
        fecha: fechaNormalizada,
        motivo: motivo.trim(),
        bloqueoActivo
      }
    });

    return res.status(201).json({
      success: true,
      mensaje: 'Feriado o día bloqueado registrado exitosamente. Las reservas quedan inhabilitadas para esta fecha.',
      data: nuevoFeriado
    });
  } catch (error) {
    console.error('Error al crear feriado:', error);
    return res.status(500).json({ error: 'Error interno al registrar el feriado' });
  }
};

// DELETE /api/feriados/:id - Eliminar / Desbloquear un feriado (Solo Admin)
export const eliminarFeriado = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de feriado inválido' });
    }

    const feriado = await prisma.feriado.findUnique({ where: { id } });
    if (!feriado) {
      return res.status(404).json({ error: 'Feriado no encontrado' });
    }

    await prisma.feriado.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      mensaje: `Feriado "${feriado.motivo}" eliminado correctamente. El día ha sido reabierto para reservas en todos los calendarios.`
    });
  } catch (error) {
    console.error('Error al eliminar feriado:', error);
    return res.status(500).json({ error: 'Error interno al anular la restricción del feriado' });
  }
};

// PATCH /api/feriados/:id/toggle - Alternar estado activo del bloqueo (Solo Admin)
export const toggleFeriado = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de feriado inválido' });
    }

    const feriado = await prisma.feriado.findUnique({ where: { id } });
    if (!feriado) {
      return res.status(404).json({ error: 'Feriado no encontrado' });
    }

    const actualizado = await prisma.feriado.update({
      where: { id },
      data: { bloqueoActivo: !feriado.bloqueoActivo }
    });

    return res.status(200).json({
      success: true,
      mensaje: `Bloqueo ${actualizado.bloqueoActivo ? 'ACTIVADO' : 'DESACTIVADO'} para el día ${actualizado.fecha.toISOString().split('T')[0]}.`,
      data: actualizado
    });
  } catch (error) {
    console.error('Error al actualizar feriado:', error);
    return res.status(500).json({ error: 'Error interno al modificar el estado del feriado' });
  }
};