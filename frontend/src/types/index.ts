export interface Rol {
  id: number;
  nombre: string;
}

export interface Carrera {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  nombreCompleto: string;
  correo: string;
  telefono?: string | null;
  activo: boolean;
  correoVerificado: boolean;
  carreraId?: number;
  rolId: number;
  rol: Rol;
  carrera?: Carrera;
}

export interface Laboratorio {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion?: string | null;
  descripcion?: string | null;
  estadoOperativo: 'Activo' | 'Mantenimiento' | 'Inactivo';
  reservaPorComputadora: boolean;
  carreraId?: number | null;
  carrera?: Carrera;
}

export interface Reserva {
  id: number;
  usuarioId?: number | null;
  laboratorioId: number;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string | null;
  materia?: string | null;
  cantidadAlumnos?: number | null;
  numeroComputadora?: number | null;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada' | 'Asistió' | 'Ausente';
  horaAsistencia?: string | null;
  tokenQr?: string | null;
  laboratorio: {
    id: number;
    nombre: string;
    ubicacion?: string | null;
    capacidad?: number;
    reservaPorComputadora?: boolean;
    estadoOperativo?: string;
  };
  usuario?: {
    id: number;
    nombreCompleto: string;
    correo: string;
    rol?: { nombre: string };
  };
}

export interface Mantenimiento {
  id: number;
  laboratorioId: number;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  laboratorio?: {
    id: number;
    nombre: string;
    ubicacion?: string | null;
    estadoOperativo?: string;
  };
}

export interface AuditoriaEvento {
  id: number;
  usuarioId?: number | null;
  accion: string;
  fechaHora: string;
  ip?: string | null;
  detalles?: string | null;
  userAgent?: string | null;
  usuario?: {
    id: number;
    nombreCompleto: string;
    correo: string;
    rol?: { nombre: string };
  };
}

export interface Sancion {
  id: number;
  usuarioId: number;
  reservaId?: number | null;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'Activa' | 'Expirada' | 'Perdonada';
  usuario: {
    id: number;
    nombreCompleto: string;
    correo: string;
  };
  reserva?: {
    id: number;
    fechaInicio: string;
    fechaFin: string;
    laboratorio?: {
      id?: number;
      nombre: string;
      ubicacion?: string | null;
    };
  } | null;
}

export interface MetricasLaboratorio {
  laboratorioId: number;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  totalReservas: number;
  reservasAsistidas: number;
  reservasAusentes: number;
  reservasCanceladas: number;
  reservasAprobadas: number;
  horasUsoEfectivo: number;
  tasaAsistencia: number;
  alumnosBeneficiados: number;
}

export interface ResumenMetricasAcademicas {
  totalReservasCampus: number;
  totalHorasCampus: number;
  tasaAsistenciaPromedio: number;
  totalAlumnosBeneficiados: number;
  laboratorioMasDemandado: string;
  laboratorios: MetricasLaboratorio[];
}

