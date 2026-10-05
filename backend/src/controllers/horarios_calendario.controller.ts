import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// =======================================================
// MÓDULO DE HORARIOS (HU-06)
// =======================================================

export const configurarHorarios = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { horarios } = req.body; 

    if (!Array.isArray(horarios) || horarios.length === 0) {
      return res.status(400).json({ error: 'Debes enviar un arreglo con al menos un horario' });
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    // Validar coherencia y estructura de cada bloque horario (HU-07)
    for (const h of horarios) {
      if (!h.dia || !h.horaApertura || !h.horaCierre) {
        return res.status(400).json({ error: 'Cada horario debe incluir dia, horaApertura y horaCierre' });
      }

      if (!timeRegex.test(h.horaApertura) || !timeRegex.test(h.horaCierre)) {
        return res.status(400).json({ error: `Formato de hora inválido en ${h.dia}. Usa formato HH:MM (ej. 08:00)` });
      }

      if (h.horaCierre <= h.horaApertura) {
        return res.status(400).json({
          error: `Incoherencia horaria en ${h.dia}: la hora de cierre (${h.horaCierre}) debe ser posterior a la hora de apertura (${h.horaApertura})`
        });
      }
    }

    // Validar solapamiento interno de bloques en el mismo día (HU-07)
    const porDia: Record<string, Array<{ apertura: string; cierre: string }>> = {};
    for (const h of horarios) {
      if (!porDia[h.dia]) porDia[h.dia] = [];
      for (const existente of porDia[h.dia]) {
        if (h.horaApertura < existente.cierre && h.horaCierre > existente.apertura) {
          return res.status(400).json({
            error: `Conflicto de solapamiento en ${h.dia}: los bloques ${h.horaApertura}-${h.horaCierre} y ${existente.apertura}-${existente.cierre} se superponen`
          });
        }
      }
      porDia[h.dia].push({ apertura: h.horaApertura, cierre: h.horaCierre });
    }

    const laboratorio = await prisma.laboratorio.findUnique({ where: { id: Number(id) } });
    if (!laboratorio) return res.status(404).json({ error: 'Laboratorio no encontrado' });

    const nuevosHorarios = await prisma.$transaction(async (tx) => {
      await tx.horarioLaboratorio.deleteMany({
        where: { laboratorioId: Number(id) }
      });

      const dataAInsertar = horarios.map((h: any) => ({
        laboratorioId: Number(id),
        dia: h.dia,
        horaApertura: new Date("1970-01-01T" + h.horaApertura + ":00Z"),
        horaCierre: new Date("1970-01-01T" + h.horaCierre + ":00Z")
      }));

      await tx.horarioLaboratorio.createMany({
        data: dataAInsertar
      });

      return await tx.horarioLaboratorio.findMany({ where: { laboratorioId: Number(id) } });
    });

    return res.status(201).json({
      mensaje: 'Horarios configurados correctamente',
      horarios: nuevosHorarios
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al configurar los horarios' });
  }
};

// =======================================================
// MÓDULO DE BÚSQUEDA / CALENDARIO (HU-12)
// =======================================================

export const verCalendarioLaboratorio = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const laboratorio = await prisma.laboratorio.findUnique({ where: { id: Number(id) } });
    if (!laboratorio) return res.status(404).json({ error: 'Laboratorio no encontrado' });

    const reservas = await prisma.reserva.findMany({
      where: {
        laboratorioId: Number(id),
        estado: { in: ['Aprobada', 'Pendiente'] }
      },
      select: {
        id: true,
        fechaInicio: true,
        fechaFin: true,
        estado: true,
        motivo: true,
        usuario: {
          select: { nombreCompleto: true }
        }
      },
      orderBy: { fechaInicio: 'asc' }
    });

    return res.json({
      laboratorio: laboratorio.nombre,
      reservas
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener el calendario' });
  }
};