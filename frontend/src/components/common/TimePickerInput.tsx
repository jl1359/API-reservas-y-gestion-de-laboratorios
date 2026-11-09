import { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

interface TimePickerInputProps {
  id?: string;
  value: string; // formato "HH:mm" (ej. "08:15")
  onChange: (nuevoValor: string) => void;
  minHora?: number; // ej. 6
  maxHora?: number; // ej. 21
  disabled?: boolean;
  className?: string;
}

const MINUTOS_OPCIONES = [
  '00', '05', '10', '15', '20', '25',
  '30', '35', '40', '45', '50', '55'
];

export default function TimePickerInput({
  id,
  value,
  onChange,
  minHora = 6,
  maxHora = 21,
  disabled = false,
  className = '',
}: TimePickerInputProps) {
  // Descomponer valor actual en hora y minutos
  const [horaActual, minutoActual] = useMemo(() => {
    if (!value || !value.includes(':')) return ['08', '00'];
    const partes = value.split(':');
    const h = partes[0].padStart(2, '0');
    const m = partes[1].padStart(2, '0');
    return [h, m];
  }, [value]);

  // Generar lista de horas permitidas
  const listaHoras = useMemo(() => {
    const horas: string[] = [];
    for (let h = minHora; h <= maxHora; h++) {
      horas.push(String(h).padStart(2, '0'));
    }
    return horas;
  }, [minHora, maxHora]);

  const handleCambioHora = (nuevaHora: string) => {
    const nuevaHoraCompleta = `${nuevaHora}:${minutoActual}`;
    onChange(nuevaHoraCompleta);
  };

  const handleCambioMinuto = (nuevoMinuto: string) => {
    const nuevaHoraCompleta = `${horaActual}:${nuevoMinuto}`;
    onChange(nuevaHoraCompleta);
  };

  return (
    <div
      className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-tech-blue focus-within:border-tech-blue transition-all ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Selector de Hora */}
      <div className="relative flex-1">
        <select
          id={id ? `${id}-hora` : undefined}
          aria-label="Hora"
          value={horaActual}
          disabled={disabled}
          onChange={(e) => handleCambioHora(e.target.value)}
          className="w-full bg-transparent text-center text-sm font-semibold text-slate-800 dark:text-white py-1 pr-4 pl-1 outline-none cursor-pointer appearance-none"
        >
          {listaHoras.map((h) => (
            <option key={h} value={h} className="dark:bg-slate-800 dark:text-white text-slate-900">
              {h} h
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-slate-400">
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      {/* Separador de dos puntos */}
      <span className="text-slate-400 dark:text-slate-500 font-bold text-sm select-none">:</span>

      {/* Selector de Minutos */}
      <div className="relative flex-1">
        <select
          id={id ? `${id}-minuto` : undefined}
          aria-label="Minutos"
          value={minutoActual}
          disabled={disabled}
          onChange={(e) => handleCambioMinuto(e.target.value)}
          className="w-full bg-transparent text-center text-sm font-semibold text-slate-800 dark:text-white py-1 pr-4 pl-1 outline-none cursor-pointer appearance-none"
        >
          {MINUTOS_OPCIONES.map((m) => (
            <option key={m} value={m} className="dark:bg-slate-800 dark:text-white text-slate-900">
              {m} min
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-slate-400">
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
