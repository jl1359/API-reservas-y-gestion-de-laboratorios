import { useState, useEffect } from 'react';
import { BarChart3, PieChart, Eye, Sparkles } from 'lucide-react';
import type { MetricasLaboratorio } from '../../../types';

export interface SegmentoMetrica {
  id: number;
  nombre: string;
  valor: number;
  porcentaje: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
  lab: MetricasLaboratorio;
}

export interface LabBarraItem {
  laboratorioId: number;
  nombre: string;
  valor: number;
  lab: MetricasLaboratorio;
}

interface GraficoPastelBarrasMetricaProps {
  titulo: string;
  subtitulo: string;
  totalCentro: number | string;
  etiquetaCentro: string;
  unidad: string;
  formato: 'pastel' | 'barras';
  onToggleFormato: (formato: 'pastel' | 'barras') => void;
  segmentos: SegmentoMetrica[];
  laboratorios: LabBarraItem[];
  maxValor: number;
  paletaColores: string[];
  onSelectLab: (lab: MetricasLaboratorio) => void;
}

export default function GraficoPastelBarrasMetrica({
  titulo,
  subtitulo,
  totalCentro,
  etiquetaCentro,
  unidad,
  formato,
  onToggleFormato,
  segmentos,
  laboratorios,
  maxValor,
  paletaColores,
  onSelectLab
}: GraficoPastelBarrasMetricaProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [counterProgress, setCounterProgress] = useState(0);
  const [hoveredLabId, setHoveredLabId] = useState<number | null>(null);

  // Animación acelerada por GPU: Cero bloqueo del hilo de React
  useEffect(() => {
    setIsAnimated(false);
    setCounterProgress(0);

    const rAF = requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    const startTime = performance.now();
    const duration = 850;
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCounterProgress(eased);
      if (p >= 1) clearInterval(interval);
    }, 32);

    return () => {
      cancelAnimationFrame(rAF);
      clearInterval(interval);
    };
  }, [titulo, formato, segmentos.length, totalCentro]);

  // Segmento enfocado al pasar el cursor (Inspector Dinámico estilo Linear/Apple)
  const hoveredSeg = segmentos.find((s) => s.id === hoveredLabId);

  // Cálculo del valor numérico animado para el centro del donut
  const numericTotal = typeof totalCentro === 'number' ? totalCentro : parseFloat(String(totalCentro));
  const hasDecimals = String(totalCentro).includes('.');
  const animatedCentroVal = !isNaN(numericTotal)
    ? (numericTotal * counterProgress).toFixed(hasDecimals ? 1 : 0)
    : totalCentro;

  // Circunferencia del círculo (radio = 40)
  const CIRCUNFERENCIA = 2 * Math.PI * 40; // ≈ 251.327

  // Color de aura ambiental reactiva (cambia según el elemento enfocado)
  const activeAuraColor = hoveredSeg ? hoveredSeg.color : (segmentos[0]?.color || '#2563eb');

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-b from-white/90 via-slate-50/70 to-slate-100/60 dark:from-slate-900/90 dark:via-[#0c1427]/80 dark:to-[#070c18]/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xl backdrop-blur-xl transition-all duration-300">
      {/* Resplandor ambiental suave de fondo */}
      <div 
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none transition-all duration-500 opacity-20 dark:opacity-25 blur-3xl"
        style={{ backgroundColor: activeAuraColor }}
      />

      {/* Cabecera del Gráfico con estado en vivo */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h5 className="font-heading font-bold text-slate-900 dark:text-white text-base">
              {titulo}
            </h5>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-tech-blue dark:text-blue-400 border border-blue-500/20">
              <Sparkles className="w-3 h-3 mr-1 text-tech-blue animate-pulse" />
              Interactiva
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitulo}
          </p>
        </div>

        {/* Toggle estilizado Barras / Circular */}
        <div className="flex items-center bg-slate-200/60 dark:bg-slate-950/70 p-1 rounded-xl border border-slate-300/50 dark:border-slate-800 text-xs self-start sm:self-auto backdrop-blur-sm shadow-inner">
          <button
            type="button"
            onClick={() => onToggleFormato('barras')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              formato === 'barras'
                ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 font-bold shadow-xs scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Barras</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleFormato('pastel')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              formato === 'pastel'
                ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-blue-400 font-bold shadow-xs scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Circular</span>
          </button>
        </div>
      </div>

      {formato === 'pastel' ? (
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-around gap-8 py-3">
          {/* Gráfico Donut con Aura Reactor y Centro Inspector Dinámico */}
          <div className="relative w-56 h-56 flex items-center justify-center flex-shrink-0 group">
            {/* Aura difusa reactiva que brilla detrás del donut */}
            <div 
              className="absolute inset-4 rounded-full filter blur-2xl opacity-25 dark:opacity-35 pointer-events-none transition-all duration-500 scale-95 group-hover:scale-105"
              style={{ backgroundColor: activeAuraColor }}
            />

            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full -rotate-90 transform drop-shadow-md transition-transform duration-300"
            >
              {/* Círculo base de pista */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-200/80 dark:stroke-slate-800/80"
                strokeWidth="13"
                fill="transparent"
              />
              {/* Segmentos de arco acelerados por GPU */}
              {segmentos.map((seg) => {
                const isHovered = hoveredLabId === seg.id;
                const isOtherHovered = hoveredLabId !== null && !isHovered;

                return (
                  <circle
                    key={seg.id}
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={seg.color}
                    strokeWidth={isHovered ? 16 : 13}
                    strokeDasharray={isAnimated ? seg.strokeDasharray : `0 ${CIRCUNFERENCIA}`}
                    strokeDashoffset={isAnimated ? seg.strokeDashoffset : 0}
                    fill="transparent"
                    onMouseEnter={() => setHoveredLabId(seg.id)}
                    onMouseLeave={() => setHoveredLabId(null)}
                    onClick={() => onSelectLab(seg.lab)}
                    className="cursor-pointer"
                    style={{
                      opacity: isOtherHovered ? 0.35 : 1,
                      filter: isHovered ? `drop-shadow(0 0 6px ${seg.color})` : 'none',
                      transition: 'stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1), stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.15s ease, opacity 0.15s ease, filter 0.15s ease',
                      willChange: 'stroke-dasharray, stroke-dashoffset'
                    }}
                  />
                );
              })}
            </svg>

            {/* Centro Inteligente: Cambia dinámicamente si pasas el mouse por un laboratorio */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none select-none transition-all duration-200">
              {hoveredSeg ? (
                <div className="flex flex-col items-center">
                  <span 
                    className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 text-white shadow-xs"
                    style={{ backgroundColor: hoveredSeg.color }}
                  >
                    {Math.round(hoveredSeg.porcentaje)}%
                  </span>
                  <span className="text-xl font-poppins font-black text-slate-900 dark:text-white leading-tight">
                    {hoveredSeg.valor} {unidad}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 max-w-[140px] truncate mt-0.5">
                    {hoveredSeg.nombre}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-poppins font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                    {animatedCentroVal}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wide">
                    {etiquetaCentro}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lista de leyenda interactiva: al pasar el mouse resalta el arco del donut */}
          <div className="w-full max-w-lg space-y-2.5">
            {segmentos.map((seg, idx) => {
              const animatedVal = typeof seg.valor === 'number' && !Number.isInteger(seg.valor)
                ? (seg.valor * counterProgress).toFixed(1)
                : Math.round(seg.valor * counterProgress);
              const animatedPct = Math.round(seg.porcentaje * counterProgress);
              const isHovered = hoveredLabId === seg.id;
              const isOtherHovered = hoveredLabId !== null && !isHovered;

              return (
                <div 
                  key={seg.id} 
                  onMouseEnter={() => setHoveredLabId(seg.id)}
                  onMouseLeave={() => setHoveredLabId(null)}
                  onClick={() => onSelectLab(seg.lab)}
                  className={`group flex items-center justify-between text-xs p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isHovered 
                      ? 'bg-white dark:bg-slate-800 shadow-md scale-[1.015] border-tech-blue/40 ring-1 ring-blue-500/20'
                      : isOtherHovered
                      ? 'opacity-40 bg-white/40 dark:bg-slate-900/40 border-transparent'
                      : 'bg-white/80 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800/80 border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  title="Haz clic para ver el reporte detallado de este laboratorio"
                >
                  <div className="flex items-center space-x-3 truncate pr-2">
                    <span 
                      className={`w-3.5 h-3.5 rounded-lg flex-shrink-0 transition-transform duration-150 ${
                        isHovered ? 'scale-125 shadow-sm' : ''
                      }`}
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center">
                      <span className="text-slate-400 font-bold mr-1.5 text-[11px]">#{idx + 1}</span>
                      {seg.nombre}
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 dark:text-white font-poppins">
                      {animatedVal} {unidad}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                      isHovered 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {animatedPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Formato de Barras Horizontales con Animación GPU */
        <div className="space-y-3.5 py-2">
          {laboratorios.map((lab, idx) => {
            const color = paletaColores[idx % paletaColores.length];
            const targetWidth = maxValor > 0 ? (lab.valor / maxValor) * 100 : 0;
            const animatedVal = typeof lab.valor === 'number' && !Number.isInteger(lab.valor)
              ? (lab.valor * counterProgress).toFixed(1)
              : Math.round(lab.valor * counterProgress);

            return (
              <div 
                key={lab.laboratorioId} 
                onClick={() => onSelectLab(lab.lab)}
                className="group space-y-1.5 p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800/90 cursor-pointer transition-all duration-150 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 hover:shadow-md hover:scale-[1.005]"
                title="Haz clic para ver el reporte detallado"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                    <span className="w-5 text-slate-400 font-bold text-[11px]">#{idx + 1}</span>
                    {lab.nombre}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 font-poppins">
                    <span>{animatedVal} {unidad}</span>
                    <Eye className="w-3.5 h-3.5 text-tech-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 shadow-inner">
                  <div 
                    className="h-full rounded-full shadow-xs"
                    style={{ 
                      width: isAnimated ? `${targetWidth}%` : '0%', 
                      background: `linear-gradient(90deg, ${color}dd, ${color})`,
                      transition: 'width 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
                      willChange: 'width'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
