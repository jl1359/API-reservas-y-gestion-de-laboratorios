import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  MapPin, 
  Monitor, 
  SearchX, 
  ArrowRight, 
  Sparkles, 
  RotateCcw,
  Building
} from 'lucide-react';
import Navbar from '../components/Navbar';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

interface Laboratorio {
  id: number;
  nombre: string;
  capacidad: number;
  ubicacion: string | null;
  imagenUrl: string | null;
  reservaPorComputadora: boolean;
}

export default function Home() {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [filtroCapacidad, setFiltroCapacidad] = useState('');
  const [filtroCarrera, setFiltroCarrera] = useState('');

  const fetchLaboratorios = async (capacidad = filtroCapacidad, carrera = filtroCarrera) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (capacidad) params.append('capacidadRequerida', capacidad);
      if (carrera) params.append('carrera', carrera);
      
      const response = await apiClient.get('/api/laboratorios?' + params.toString());
      setLaboratorios(response.data.laboratorios || []);
    } catch (error) {
      console.error('Error al cargar laboratorios:', error);
      toast.error('No se pudieron cargar los laboratorios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchLaboratorios();
  };

  const limpiarFiltros = () => {
    setFiltroCapacidad('');
    setFiltroCarrera('');
    fetchLaboratorios('', '');
  };

  useEffect(() => {
    fetchLaboratorios();
  }, []);

  const hayFiltrosActivos = Boolean(filtroCapacidad || filtroCarrera);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] font-inter transition-colors duration-200">
      <Navbar />

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-transparent dark:from-blue-950/20 dark:via-[#090d16] dark:to-transparent border-b border-slate-200/60 dark:border-slate-800/60 pt-10 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-tech-blue dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Facultad de Ciencias y Tecnología • UMSS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-poppins font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Reserva de Laboratorios
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Consulta la disponibilidad de espacios y reserva tu laboratorio o computadora en tiempo real.
          </p>
        </div>
      </div>

      {/* Floating Search Bar */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-10">
        <form onSubmit={handleSearch} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 dark:shadow-black/30 border border-slate-200/80 dark:border-slate-800/80 p-2.5 transition-all">
          <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            
            {/* Carrera o Nombre */}
            <div className="flex-1 w-full px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-2xl transition-colors">
              <label className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Building className="w-3.5 h-3.5 mr-1.5 text-tech-blue" /> Carrera o Laboratorio
              </label>
              <input 
                type="text" 
                placeholder="Ej. Informática, Redes, MEMI..." 
                value={filtroCarrera} 
                onChange={e => setFiltroCarrera(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
                className="w-full bg-transparent font-medium text-slate-900 dark:text-white text-sm outline-none placeholder-slate-400 dark:placeholder-slate-600" 
              />
            </div>

            {/* Capacidad */}
            <div className="flex-1 w-full px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-2xl transition-colors border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800">
              <label className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5 mr-1.5 text-tech-blue" /> Cantidad de Estudiantes
              </label>
              <input 
                type="number" 
                min="1" 
                placeholder="Ej. 30 alumnos..." 
                value={filtroCapacidad} 
                onChange={e => setFiltroCapacidad(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
                className="w-full bg-transparent font-medium text-slate-900 dark:text-white text-sm outline-none placeholder-slate-400 dark:placeholder-slate-600" 
              />
            </div>
            
            {/* Search and Reset Buttons */}
            <div className="px-2 py-1.5 w-full md:w-auto flex items-center gap-2">
              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  title="Restablecer filtros"
                  className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button 
                type="submit" 
                className="w-full md:w-auto bg-tech-blue hover:bg-blue-600 text-white font-semibold py-3 px-7 rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <Search className="w-4 h-4" />
                <span>Buscar</span>
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* Catálogo de Laboratorios */}
      <div className="max-w-6xl mx-auto px-6 mt-12 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-poppins font-bold text-slate-900 dark:text-white">
              Espacios Disponibles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {laboratorios.length} laboratorios registrados en la facultad
            </p>
          </div>

          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="text-xs font-semibold text-tech-blue dark:text-blue-400 hover:underline self-start sm:self-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros de búsqueda</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-24 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-tech-blue"></div>
            <p className="text-xs font-medium text-slate-400">Consultando catálogo oficial...</p>
          </div>
        ) : laboratorios.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs">
            <SearchX className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Sin resultados para los filtros seleccionados
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              Intenta cambiar los términos de búsqueda o ajustar la capacidad mínima.
            </p>
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer búsqueda</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {laboratorios.map((lab) => (
              <Link 
                key={lab.id} 
                to={"/laboratorio/" + lab.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-500/30 dark:hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
              >
                {/* Contenedor de Imagen y Badges */}
                <div className="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  {lab.imagenUrl ? (
                    <img 
                      src={lab.imagenUrl} 
                      alt={lab.nombre} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-umss-blue to-tech-blue opacity-90 flex items-center justify-center">
                      <Monitor className="w-14 h-14 text-white/50" />
                    </div>
                  )}

                  {/* Gradiente sutil inferior para fusión */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                  {/* Badges superiores */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="inline-flex items-center text-[11px] font-bold text-slate-800 dark:text-white bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs border border-white/20 dark:border-slate-700/40">
                      <Users className="w-3 h-3 mr-1 text-tech-blue" />
                      {lab.capacidad} personas
                    </span>

                    <span className="inline-flex items-center text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs border border-white/20 dark:border-slate-700/40">
                      {lab.reservaPorComputadora ? 'Por Puesto' : 'Aula Completa'}
                    </span>
                  </div>
                </div>

                {/* Contenido de la Tarjeta */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-base font-poppins font-bold text-slate-900 dark:text-white mb-2 group-hover:text-tech-blue transition-colors line-clamp-1">
                    {lab.nombre}
                  </h3>

                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-tech-blue shrink-0" />
                    <span className="truncate">{lab.ubicacion || 'Campus Central FCyT'}</span>
                  </div>

                  {/* Footer de Tarjeta y Botón de Acción */}
                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="w-full bg-slate-100 group-hover:bg-tech-blue dark:bg-slate-800 dark:group-hover:bg-tech-blue text-slate-700 group-hover:text-white dark:text-slate-200 dark:group-hover:text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-center text-xs flex items-center justify-center gap-1.5 shadow-2xs group-hover:shadow-md group-hover:shadow-blue-500/20">
                      <span>Ver Disponibilidad</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}