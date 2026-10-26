import React from 'react';
import { Camera } from 'lucide-react';

interface VisorCamaraQrProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  camaraActiva: boolean;
}

export default function VisorCamaraQr({
  videoRef,
  canvasRef,
  camaraActiva
}: VisorCamaraQrProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
      <div className="relative w-full max-w-md mx-auto aspect-square bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Mira telescopica / Visor de Escaneo */}
        <div className="absolute inset-8 border-2 border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
          <div className="flex justify-between">
            <div className="w-6 h-6 border-t-4 border-l-4 border-tech-blue rounded-tl-lg" />
            <div className="w-6 h-6 border-t-4 border-r-4 border-tech-blue rounded-tr-lg" />
          </div>
          {/* Linea Laser Animada */}
          <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
          <div className="flex justify-between">
            <div className="w-6 h-6 border-b-4 border-l-4 border-tech-blue rounded-bl-lg" />
            <div className="w-6 h-6 border-b-4 border-r-4 border-tech-blue rounded-br-lg" />
          </div>
        </div>

        {!camaraActiva && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white p-6">
            <Camera className="w-12 h-12 text-slate-400 mb-3 animate-pulse" />
            <p className="text-sm font-semibold">Iniciando cámara...</p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
        Enfoca el código QR en el marco para validar el ingreso.
      </p>
    </div>
  );
}