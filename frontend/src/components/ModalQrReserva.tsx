import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, Printer, Clock, MapPin, Monitor, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface ModalQrProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: {
    id: number;
    tokenQr?: string | null;
    fechaInicio: string;
    fechaFin: string;
    motivo?: string | null;
    materia?: string | null;
    numeroComputadora?: number | null;
    estado: string;
    laboratorio: {
      nombre: string;
      ubicacion?: string | null;
      reservaPorComputadora?: boolean;
    };
  } | null;
}

export default function ModalQrReserva({ isOpen, onClose, reserva }: ModalQrProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reserva?.tokenQr) {
      QRCode.toDataURL(reserva.tokenQr, {
        width: 320,
        margin: 2,
        color: {
          dark: '#002855', // Azul UMSS corporativo
          light: '#ffffff'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => {
          console.error('Error al generar código QR:', err);
          toast.error('No se pudo generar la imagen del código QR');
        });
    } else {
      setQrDataUrl('');
    }
  }, [reserva]);

  if (!isOpen || !reserva) return null;

  const fechaInicio = new Date(reserva.fechaInicio);
  const fechaFin = new Date(reserva.fechaFin);

  const copiarToken = () => {
    if (reserva.tokenQr) {
      navigator.clipboard.writeText(reserva.tokenQr);
      setCopied(true);
      toast.success('Código de validación copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const descargarQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-Reserva-${reserva.id}-${reserva.laboratorio.nombre.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagen del código QR descargada');
  };

  const imprimirComprobante = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-green-200 dark:border-green-800">
            <ShieldCheck className="w-4 h-4" />
            <span>Pase Oficial de Ingreso</span>
          </div>
          <h2 className="text-2xl font-poppins font-bold text-slate-900 dark:text-white">
            Código QR de Reserva
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Presenta este código al Auxiliar en la puerta del laboratorio
          </p>
        </div>

        {/* Contenedor del Código QR */}
        <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
          {qrDataUrl ? (
            <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200">
              <img
                src={qrDataUrl}
                alt="Código QR de Reserva"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400">
              <span className="text-sm font-medium">Generando código seguro...</span>
            </div>
          )}

          {/* Token truncado con botón copiar */}
          {reserva.tokenQr && (
            <div className="mt-4 flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 max-w-full">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                {reserva.tokenQr}
              </span>
              <button
                onClick={copiarToken}
                className="text-tech-blue hover:text-blue-600 dark:text-blue-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Copiar token"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Ficha Técnica de la Reserva */}
        <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Laboratorio:</span>
            <span className="font-bold text-slate-900 dark:text-white text-right">
              {reserva.laboratorio.nombre}
            </span>
          </div>

          {reserva.laboratorio.ubicacion && (
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Ubicación:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {reserva.laboratorio.ubicacion}
              </span>
            </div>
          )}

          {reserva.numeroComputadora && (
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center">
                <Monitor className="w-3.5 h-3.5 mr-1 text-tech-blue" /> Equipo Asignado:
              </span>
              <span className="font-bold text-tech-blue dark:text-blue-400">
                PC #{reserva.numeroComputadora}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> Fecha y Horario:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
              {fechaInicio.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })},{' '}
              {fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {fechaFin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {reserva.materia && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Materia:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {reserva.materia}
              </span>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={descargarQr}
            className="flex items-center justify-center space-x-2 bg-tech-blue hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Descargar PNG</span>
          </button>

          <button
            onClick={imprimirComprobante}
            className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold py-2.5 px-4 rounded-xl transition-all text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>

      </div>
    </div>
  );
}
