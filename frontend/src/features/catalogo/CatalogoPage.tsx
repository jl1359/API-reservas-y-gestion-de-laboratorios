import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Search, Users, Monitor, MapPin, Calendar, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface Laboratorio {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion?: string;
  reservaPorComputadora: boolean;
  estadoOperativo: string;
  carrera?: { id: number; nombre: string };
  equipos?: Array<{ equipamiento: { nombre: string; tipo: string }; cantidad: number }>;
}

export const CatalogoPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [capacidadMin, setCapacidadMin] = useState(searchParams.get('capacidad') || '');
  const [busqueda, setBusqueda] = useState(searchParams.get('q') || '');
  const [soloPCs, setSoloPCs] = useState(searchParams.get('pc') === 'true');

  const { data: laboratorios, isLoading, error } = useQuery<Laboratorio[]>({
    queryKey: ['laboratorios', capacidadMin, soloPCs],
    queryFn: async () => {
      const params: any = {};
      if (capacidadMin) params.capacidadRequerida = capacidadMin;
      if (soloPCs) params.reservaPorAsiento = 'true';
      const response = await api.get('/laboratorios', { params });
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    },
  });

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    const params: any = {};
    if (capacidadMin) params.capacidad = capacidadMin;
    if (busqueda) params.q = busqueda;
    if (soloPCs) params.pc = 'true';
    setSearchParams(params);
  };

  const handleLimpiar = () => {
    setCapacidadMin('');
    setBusqueda('');
    setSoloPCs(false);
    setSearchParams({});
  };

  // Filtrado en memoria por texto de búsqueda para instantaneidad
  const filtrados = (laboratorios || []).filter((lab) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      lab.nombre.toLowerCase().includes(term) ||
      (lab.ubicacion && lab.ubicacion.toLowerCase().includes(term)) ||
      (lab.carrera && lab.carrera.nombre.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header y Buscador Principal */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider backdrop-blur-md mb-3 inline-block">
            Infraestructura Académica
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Catálogo de Laboratorios</h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base">
            Consulta la disponibilidad en tiempo real, equipamiento y agenda tus prácticas universitarias sin colisiones de horario.
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleFiltrar} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Buscar por nombre o ubicación</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej. Lab de Redes, Edif. Nuevo..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Capacidad mínima (alumnos)</label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="number"
                min="1"
                value={capacidadMin}
                onChange={(e) => setCapacidadMin(e.target.value)}
                placeholder="Ej. 30"
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center h-10">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={soloPCs}
                onChange={(e) => setSoloPCs(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Con computadoras individuales</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl text-sm transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtrar
            </button>
            <button
              type="button"
              onClick={handleLimpiar}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Laboratorios */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              <div className="h-20 bg-slate-50 rounded-xl"></div>
              <div className="h-10 bg-slate-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p className="font-semibold">Error al cargar los laboratorios</p>
          <p className="text-sm mt-1">Verifica la conexión con el servidor backend.</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">No se encontraron laboratorios</h2>
          <p className="text-sm text-slate-500 mt-1">
            Intenta ajustar los criterios de capacidad o limpiar los filtros activos.
          </p>
          <button
            onClick={handleLimpiar}
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-xl text-sm transition"
          >
            Ver todos los laboratorios
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((lab) => (
            <div
              key={lab.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition duration-200 group"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {lab.nombre}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${lab.estadoOperativo === 'Activo'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                      }`}
                  >
                    {lab.estadoOperativo}
                  </span>
                </div>

                {lab.carrera && (
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                    {lab.carrera.nombre}
                  </p>
                )}

                <div className="space-y-2 py-3 border-y border-slate-100 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Capacidad: <strong className="text-slate-800">{lab.capacidad} alumnos</strong></span>
                  </div>

                  {lab.ubicacion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{lab.ubicacion}</span>
                    </div>
                  )}

                  {lab.reservaPorComputadora && (
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Monitor className="w-4 h-4" />
                      <span className="text-xs font-medium">Permite reserva por computadora</span>
                    </div>
                  )}
                </div>

                {lab.equipos && lab.equipos.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Equipamiento:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {lab.equipos.slice(0, 3).map((eq, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {eq.equipamiento.nombre} ({eq.cantidad})
                        </span>
                      ))}
                      {lab.equipos.length > 3 && (
                        <span className="text-xs text-blue-600 font-semibold self-center">
                          +{lab.equipos.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to={`/laboratorios/${lab.id}`}
                  className="w-full bg-slate-900 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  Ver Calendario y Reservar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
