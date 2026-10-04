import { Request, Response } from 'express';
import { laboratorioService } from './laboratorio.service';

export class LaboratorioController {
  /**
   * GET /api/laboratorios
   * Lista todos los laboratorios disponibles para seleccionar
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const laboratorios = await laboratorioService.listar(req.query as any);
      res.status(200).json({
        success: true,
        total: laboratorios.length,
        data: laboratorios,
      });
    } catch (error: any) {
      console.error('Error al listar laboratorios:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno al consultar la lista de laboratorios',
        detalles: error?.message,
      });
    }
  }

  /**
   * GET /api/laboratorios/:id
   * Obtiene la información detallada de un laboratorio por su ID
   */
  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'El ID de laboratorio debe ser un número entero válido',
        });
        return;
      }

      const laboratorio = await laboratorioService.obtenerPorId(id);
      if (!laboratorio) {
        res.status(404).json({
          success: false,
          error: `Laboratorio con ID ${id} no encontrado`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: laboratorio,
      });
    } catch (error: any) {
      console.error('Error al obtener laboratorio:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno al obtener el laboratorio',
        detalles: error?.message,
      });
    }
  }

  /**
   * GET /api/laboratorios/:id/calendario
   * Selecciona un laboratorio y obtiene su calendario (horarios, reservas y mantenimientos)
   */
  async obtenerCalendario(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'El ID de laboratorio debe ser un número entero válido',
        });
        return;
      }

      const resultado = await laboratorioService.obtenerCalendario(id, req.query as any);
      if (!resultado) {
        res.status(404).json({
          success: false,
          error: `Laboratorio con ID ${id} no encontrado`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al obtener calendario del laboratorio:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno al obtener el calendario del laboratorio',
        detalles: error?.message,
      });
    }
  }
}

export const laboratorioController = new LaboratorioController();
