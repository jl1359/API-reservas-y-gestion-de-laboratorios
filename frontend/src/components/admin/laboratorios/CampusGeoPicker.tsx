import type { Dispatch, SetStateAction } from 'react';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import CampusMapPicker, { EDIFICIOS_OFICIALES_FCYT } from '../CampusMapPicker';
import type { LaboratorioFormData } from './ModalLaboratorioForm';

interface CampusGeoPickerProps {
  formData: LaboratorioFormData;
  setFormData: Dispatch<SetStateAction<LaboratorioFormData>>;
}

export default function CampusGeoPicker({
  formData,
  setFormData
}: CampusGeoPickerProps) {
  const obtenerUbicacionGpsActual = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización GPS');
      return;
    }
    toast.loading('Detectando coordenadas GPS del campus...', { id: 'gps-detect' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitud: pos.coords.latitude.toFixed(6),
          longitud: pos.coords.longitude.toFixed(6)
        }));
        toast.success('Coordenadas capturadas exitosamente', { id: 'gps-detect' });
      },
      (err) => {
        toast.error('No se pudo obtener la ubicación GPS: ' + err.message, { id: 'gps-detect' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center">
          <MapPin className="w-4 h-4 mr-1.5 text-rose-500" />
          Geolocalización en Campus FCyT
        </label>
        <button
          type="button"
          onClick={obtenerUbicacionGpsActual}
          className="text-xs font-semibold text-tech-blue dark:text-blue-400 hover:underline flex items-center cursor-pointer"
        >
          Usar mi GPS actual
        </button>
      </div>

      <div>
        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
          Punto de referencia rápido (Edificios Oficiales FCyT)
        </label>
        <select
          onChange={(e) => {
            const edificio = EDIFICIOS_OFICIALES_FCYT.find(b => b.nombre === e.target.value);
            if (edificio) {
              setFormData(prev => ({
                ...prev,
                latitud: String(edificio.lat),
                longitud: String(edificio.lng),
                ubicacion: prev.ubicacion || edificio.nombre
              }));
            }
          }}
          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none cursor-pointer"
        >
          <option value="">Seleccionar edificio del campus...</option>
          {EDIFICIOS_OFICIALES_FCYT.map(b => (
            <option key={b.nombre} value={b.nombre}>{b.nombre}</option>
          ))}
        </select>
      </div>

      {/* Selector Interactivo con Clic en Mapa del Campus */}
      <div className="pt-1">
        <CampusMapPicker
          latitud={formData.latitud}
          longitud={formData.longitud}
          onCoordinatesChange={(lat, lng) => {
            setFormData(prev => ({ ...prev, latitud: lat, longitud: lng }));
          }}
          onSelectEdificio={(edificio) => {
            setFormData(prev => ({
              ...prev,
              latitud: String(edificio.lat),
              longitud: String(edificio.lng),
              ubicacion: prev.ubicacion || edificio.nombre
            }));
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Latitud (WGS 84)</label>
          <input
            type="number"
            step="any"
            placeholder="-17.393845"
            value={formData.latitud}
            onChange={(e) => setFormData({ ...formData, latitud: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Longitud (WGS 84)</label>
          <input
            type="number"
            step="any"
            placeholder="-66.146210"
            value={formData.longitud}
            onChange={(e) => setFormData({ ...formData, longitud: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
          />
        </div>
      </div>
    </div>
  );
}