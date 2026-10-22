import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Configurar los horarios operativos de un laboratorio.
 */
export const configurarHorarios = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { horarios } = req.body; 

    if (!Array.isArray(horarios)) {
      return res.status(400).json({ error: 'Debes enviar un arreglo de horarios' });
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

/**
 * Obtener calendario, feriados, mantenimientos y reservas en tiempo real de un laboratorio.
 */
export const verCalendarioLaboratorio = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const laboratorio = await prisma.laboratorio.findUnique({
      where: { id: Number(id) },
      include: {
        horarios: true,
        carrera: true
      }
    });
    if (!laboratorio) return res.status(404).json({ error: 'Laboratorio no encontrado' });

    const [reservas, feriados, mantenimientos] = await Promise.all([
      prisma.reserva.findMany({
        where: {
          laboratorioId: Number(id),
          estado: { in: ['Aprobada', 'Pendiente', 'Confirmada'] }
        },
        select: {
          id: true,
          fechaInicio: true,
          fechaFin: true,
          estado: true,
          motivo: true,
          materia: true,
          numeroComputadora: true,
          usuario: {
            select: { nombreCompleto: true }
          }
        },
        orderBy: { fechaInicio: 'asc' }
      }),
      prisma.feriado.findMany({
        where: { bloqueoActivo: true },
        select: { id: true, fecha: true, motivo: true }
      }),
      prisma.mantenimiento.findMany({
        where: { laboratorioId: Number(id) },
        select: { id: true, fechaInicio: true, fechaFin: true, motivo: true }
      })
    ]);

    return res.json({
      laboratorio: laboratorio.nombre,
      horarios: laboratorio.horarios,
      feriados,
      mantenimientos,
      reservas
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al obtener el calendario' });
  }
};
