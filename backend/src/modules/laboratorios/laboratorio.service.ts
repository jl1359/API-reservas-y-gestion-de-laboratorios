import prisma from '../../config/database';
import { ListarLaboratoriosQuery, CalendarioQuery } from './laboratorio.schema';

export class LaboratorioService {
  /**
   * Obtiene la lista de laboratorios disponibles para selección
   */
  async listar(filtros: ListarLaboratoriosQuery) {
    const where: any = {};

    if (filtros.estado) {
      where.estadoOperativo = {
        equals: filtros.estado,
        mode: 'insensitive',
      };
    }

    if (filtros.capacidadMin) {
      where.capacidad = {
        gte: filtros.capacidadMin,
      };
    }

    if (filtros.buscar) {
      where.nombre = {
        contains: filtros.buscar,
        mode: 'insensitive',
      };
    }

    const laboratorios = await prisma.laboratorio.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        horarios: {
          select: {
            id: true,
            dia: true,
            horaApertura: true,
            horaCierre: true,
          },
        },
        equipamientos: {
          include: {
            equipamiento: true,
          },
        },
        _count: {
          select: {
            reservas: true,
            mantenimientos: true,
          },
        },
      },
    });

    return laboratorios.map((lab) => ({
      id: lab.id,
      nombre: lab.nombre,
      capacidad: lab.capacidad,
      estadoOperativo: lab.estadoOperativo,
      horarios: lab.horarios,
      equipamientos: lab.equipamientos.map((eq) => ({
        id: eq.equipamiento.id,
        nombre: eq.equipamiento.nombre,
        tipo: eq.equipamiento.tipo,
        cantidad: eq.cantidad,
      })),
      totalReservas: lab._count.reservas,
      totalMantenimientos: lab._count.mantenimientos,
    }));
  }

  /**
   * Obtiene el detalle básico de un laboratorio por ID
   */
  async obtenerPorId(id: number) {
    const laboratorio = await prisma.laboratorio.findUnique({
      where: { id },
      include: {
        horarios: true,
        equipamientos: {
          include: {
            equipamiento: true,
          },
        },
      },
    });

    if (!laboratorio) {
      return null;
    }

    return {
      id: laboratorio.id,
      nombre: laboratorio.nombre,
      capacidad: laboratorio.capacidad,
      estadoOperativo: laboratorio.estadoOperativo,
      horarios: laboratorio.horarios,
      equipamientos: laboratorio.equipamientos.map((eq) => ({
        id: eq.equipamiento.id,
        nombre: eq.equipamiento.nombre,
        tipo: eq.equipamiento.tipo,
        cantidad: eq.cantidad,
      })),
    };
  }

  /**
   * Obtiene el calendario de un laboratorio seleccionado,
   * incluyendo horarios de atención, reservas y bloqueos por mantenimiento.
   */
  async obtenerCalendario(laboratorioId: number, query: CalendarioQuery) {
    const laboratorio = await prisma.laboratorio.findUnique({
      where: { id: laboratorioId },
      include: {
        horarios: true,
      },
    });

    if (!laboratorio) {
      return null;
    }

    // Rango de fechas por defecto: mes actual completo si no se especifica
    const ahora = new Date();
    const fechaInicioFiltro = query.desde
      ? new Date(query.desde)
      : new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);

    const fechaFinFiltro = query.hasta
      ? new Date(query.hasta)
      : new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    // Obtener reservas activas en el rango
    const reservas = await prisma.reserva.findMany({
      where: {
        laboratorioId,
        fechaInicio: { lte: fechaFinFiltro },
        fechaFin: { gte: fechaInicioFiltro },
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombreCompleto: true,
            correo: true,
            carrera: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { fechaInicio: 'asc' },
    });

    // Obtener mantenimientos en el rango
    const mantenimientos = await prisma.mantenimiento.findMany({
      where: {
        laboratorioId,
        fechaInicio: { lte: fechaFinFiltro },
        fechaFin: { gte: fechaInicioFiltro },
      },
      orderBy: { fechaInicio: 'asc' },
    });

    // Formatear eventos unificados para librerías de calendario (FullCalendar, etc.)
    const eventosCalendario = [
      ...reservas.map((res) => ({
        id: `reserva-${res.id}`,
        tipo: 'RESERVA' as const,
        titulo: `Reserva: ${res.usuario.nombreCompleto}`,
        inicio: res.fechaInicio,
        fin: res.fechaFin,
        estado: res.estado,
        usuario: {
          id: res.usuario.id,
          nombreCompleto: res.usuario.nombreCompleto,
          correo: res.usuario.correo,
          carrera: res.usuario.carrera?.nombre || null,
        },
        tokenQr: res.tokenQr,
        horaAsistencia: res.horaAsistencia,
      })),
      ...mantenimientos.map((mant) => ({
        id: `mantenimiento-${mant.id}`,
        tipo: 'MANTENIMIENTO' as const,
        titulo: `Mantenimiento: ${mant.motivo}`,
        inicio: mant.fechaInicio,
        fin: mant.fechaFin,
        estado: 'Bloqueado',
        motivo: mant.motivo,
      })),
    ].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());

    return {
      laboratorio: {
        id: laboratorio.id,
        nombre: laboratorio.nombre,
        capacidad: laboratorio.capacidad,
        estadoOperativo: laboratorio.estadoOperativo,
        horariosAtencion: laboratorio.horarios,
      },
      rangoFechas: {
        desde: fechaInicioFiltro.toISOString(),
        hasta: fechaFinFiltro.toISOString(),
      },
      resumen: {
        totalReservas: reservas.length,
        totalMantenimientos: mantenimientos.length,
        totalEventos: eventosCalendario.length,
      },
      eventos: eventosCalendario,
      detalles: {
        reservas,
        mantenimientos,
      },
    };
  }
}

export const laboratorioService = new LaboratorioService();
