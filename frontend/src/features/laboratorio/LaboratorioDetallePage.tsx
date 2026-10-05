import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Users, MapPin, Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export const LaboratorioDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [fechaActual, setFechaActual] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ dia: string; hora: string } | null>(null);
  const [reservaModalOpen, setReservaModalOpen] = useState(false);

  // Consulta de detalles del laboratorio
  const { data: lab, isLoading: loadingLab } = useQuery({
    queryKey: ['laboratorio', id],
    queryFn: async () => {
      const res = await api.get(`/laboratorios/${id}`);
      return res.data?.data || res.data;
    },
  });

  // Consulta de disponibilidad/calendario semanal
  const { isLoading: loadingCal } = useQuery({
    queryKey: ['calendario', id, fechaActual.toISOString().split('T')[0]],
    queryFn: async () => {
      const res = await api.get(`/laboratorios/${id}/calendario`, {
        params: { fecha: fechaActual.toISOString().split('T')[0] },
      });
      return res.data;
    },
    enabled: !!id,
  });

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const horas = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const handlePrevSemana = () => {
    const d = new Date(fechaActual);
    d.setDate(d.getDate() - 7);
    setFechaActual(d);
  };

  const handleNextSemana = () => {
    const d = new Date(fechaActual);
    d.setDate(d.getDate() + 7);
    setFechaActual(d);
  };

  const handleSelectSlot = (dia: string, hora: string) => {
    setSelectedSlot({ dia, hora });
    setReservaModalOpen(true);
  };

  if (loadingLab) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded-md w-1/3 mx-auto"></div>
        <div className="h-4 bg-slate-100 rounded-md w-1/4 mx-auto"></div>
        <div className="h-96 bg-white rounded-3xl border border-slate-200 mt-8"></div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Laboratorio no encontrado</h2>
        <Link to="/catalogo" className="mt-4 inline-block text-blue-600 font-semibold hover:underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Botón Volver y Datos del Lab */}
      <div>
        <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 transition">
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </Link>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900">{lab.nombre}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${lab.estadoOperativo === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
              >
                {lab.estadoOperativo}
              </span>
            </div>
            {lab.carrera && <p className="text-sm font-medium text-blue-600 mt-1">{lab.carrera.nombre}</p>}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Aforo: <strong>{lab.capacidad} estudiantes</strong>
              </span>
              {lab.ubicacion && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {lab.ubicacion}
                </span>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 max-w-xs">
            <p className="font-semibold mb-1">¿Cómo reservar?</p>
            <p>Haz clic en cualquier bloque horario disponible (en verde) para iniciar una solicitud de reserva.</p>
          </div>
        </div>
      </div>

      {/* Calendario Semanal Interactivo */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Calendario Semanal de Ocupación</h2>
                {loadingCal && <span className="text-xs text-blue-600 animate-pulse font-medium">(actualizando...)</span>}
              </div>
              <p className="text-xs text-slate-500">Semana del {fechaActual.toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevSemana}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFechaActual(new Date())}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              Hoy
            </button>
            <button
              onClick={handleNextSemana}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Semana siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Ocupado / Reservado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300"></span> Pasado / No operativo
          </span>
        </div>

        {/* Grilla Semanal */}
        <div className="overflow-x-auto">
          <div className="min-w-[650px]">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase pb-2 border-b border-slate-100">
              <div className="text-left pl-2">Hora</div>
              {diasSemana.map((dia) => (
                <div key={dia}>{dia}</div>
              ))}
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {horas.map((hora) => (
                <div key={hora} className="grid grid-cols-7 gap-2 py-1.5 items-center">
                  <div className="text-xs font-semibold text-slate-400 pl-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {hora}
                  </div>
                  {diasSemana.map((dia) => {
                    // Simulación de disponibilidad básica o lectura de reservas
                    const esLibre = true; // Dinámico según respuesta del endpoint
                    return (
                      <button
                        key={dia + hora}
                        onClick={() => handleSelectSlot(dia, hora)}
                        className={`h-10 rounded-xl text-xs font-semibold transition flex items-center justify-center border ${esLibre
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:scale-[1.02]'
                            : 'bg-red-50 text-red-700 border-red-200 cursor-not-allowed'
                          }`}
                      >
                        {esLibre ? 'Libre' : 'Ocupado'}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Solicitud de Reserva */}
      {reservaModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Solicitar Reserva</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lab.nombre} · {selectedSlot.dia} a las {selectedSlot.hora}
                </p>
              </div>
              <button
                onClick={() => setReservaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {!isAuthenticated ? (
              <div className="text-center py-6 space-y-4">
                <AlertCircle className="w-12 h-12 text-blue-600 mx-auto" />
                <p className="text-sm text-slate-600">
                  Debes iniciar sesión con una cuenta de <strong>Docente</strong> o <strong>Auxiliar</strong> para solicitar un laboratorio.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/login" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl text-sm">
                    Iniciar Sesión
                  </Link>
                  <button
                    onClick={() => setReservaModalOpen(false)}
                    className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('La solicitud se enviará en el Sprint 2 con el motor de concurrencia activo.');
                  setReservaModalOpen(false);
                }}
                className="space-y-4"
              >
                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
                  Solicitante: <strong className="text-slate-800">{user?.nombreCompleto || user?.correo}</strong> ({user?.rol})
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Materia / Asignatura</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Redes de Computadoras"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad estimada de alumnos</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={lab.capacidad}
                    placeholder={`Máximo ${lab.capacidad}`}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm shadow-xs transition"
                  >
                    Confirmar Solicitud
                  </button>
                  <button
                    type="button"
                    onClick={() => setReservaModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
