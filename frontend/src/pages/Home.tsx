import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, MapPin, Monitor } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
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

  const fetchLaboratorios = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroCapacidad) params.append('capacidadRequerida', filtroCapacidad);
      if (filtroCarrera) params.append('carrera', filtroCarrera);
      
      const response = await axios.get('http://localhost:3000/api/laboratorios?' + params.toString());
      setLaboratorios(response.data.laboratorios);
    } catch (error) {
      console.error('Error al cargar laboratorios:', error);
      toast.error('No se pudieron cargar los laboratorios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLaboratorios();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter transition-colors duration-200">
      <Navbar />

      {/* Header del Sistema Interno */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 pt-8 pb-16 px-6 transition-colors duration-200">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-poppins font-bold text-slate-900 dark:text-white mb-2">
            Buscador de Laboratorios
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Encuentra y reserva espacios disponibles en la Facultad de Ciencias y Tecnología.
          </p>
        </div>
      </div>

      {/* Floating Search Bar */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 p-2 transition-colors duration-200">
          <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700">
            
            {/* Carrera o Nombre */}
            <div className="flex-1 w-full px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
              <label className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <MapPin className="w-3.5 h-3.5 mr-1" /> Carrera o Nombre
              </label>
              <input 
                type="text" 
                placeholder="Ej. Sistemas..." 
                value={filtroCarrera} 
                onChange={e => setFiltroCarrera(e.target.value)} 
                className="w-full bg-transparent font-semibold text-slate-900 dark:text-white outline-none placeholder-slate-300 dark:placeholder-slate-600" 
              />
            </div>

            {/* Capacidad */}
            <div className="flex-1 w-full px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700">
              <label className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5 mr-1" /> Capacidad Mínima
              </label>
              <input 
                type="number" 
                min="1" 
                placeholder="Cualquier tamaño..." 
                value={filtroCapacidad} 
                onChange={e => setFiltroCapacidad(e.target.value)} 
                className="w-full bg-transparent font-semibold text-slate-900 dark:text-white outline-none placeholder-slate-300 dark:placeholder-slate-600" 
              />
            </div>
            
            {/* Search Button */}
            <div className="px-3 py-2 w-full md:w-auto">
              <button 
                onClick={fetchLaboratorios} 
                className="w-full bg-tech-blue hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Buscar</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Catálogo de Laboratorios */}
      <div className="max-w-6xl mx-auto px-6 mt-12 pb-20">
        <h2 className="text-xl font-poppins font-bold text-slate-800 dark:text-white mb-6">
          Laboratorios Disponibles ({laboratorios.length})
        </h2>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tech-blue"></div>
          </div>
        ) : laboratorios.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-medium">No se encontraron laboratorios con esos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {laboratorios.map((lab) => (
              <div key={lab.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                <div className="h-48 bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                  {lab.imagenUrl ? (
                    <img src={lab.imagenUrl} alt={lab.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-umss-blue to-tech-blue opacity-90 flex items-center justify-center">
                      <Monitor className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1 text-tech-blue" />
                      Capacidad: {lab.capacidad}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-poppins font-bold text-slate-900 dark:text-white mb-2 group-hover:text-tech-blue transition-colors">
                    {lab.nombre}
                  </h3>
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
                    <span className="truncate">{lab.ubicacion || 'Ubicación no especificada'}</span>
                  </div>
                  <div className="mt-auto">
                    <div className="inline-block bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 mb-6">
                      Modalidad: {lab.reservaPorComputadora ? 'Por Computadora' : 'Laboratorio Completo'}
                    </div>
                    <button className="w-full bg-slate-50 hover:bg-tech-blue dark:bg-slate-700 dark:hover:bg-tech-blue text-slate-700 hover:text-white dark:text-white font-semibold py-2.5 rounded-xl border border-slate-200 hover:border-tech-blue dark:border-slate-600 dark:hover:border-tech-blue transition-colors">
                      <Link to={"/laboratorio/" + lab.id}>Ver Disponibilidad</Link>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}