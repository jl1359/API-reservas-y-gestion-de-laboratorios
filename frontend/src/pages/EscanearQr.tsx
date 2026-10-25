import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import axios from 'axios';
import {
  Camera,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldCheck,
  User,
  MapPin,
  Monitor,
  Clock,
  ArrowLeft,
  Search,
  CheckCheck,
  Building2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ResultadoEscaneo {
  exito: boolean;
  mensaje: string;
  codigo?: string;
  data?: {
    reservaId: number;
    estado: string;
    horaAsistencia: string;
    usuario?: { id: number; nombreCompleto: string; ci?: string; correo: string };
    laboratorio?: { id: number; nombre: string; ubicacion?: string; reservaPorComputadora?: boolean };
    numeroComputadora?: number | null;
    fechaInicio?: string;
    fechaFin?: string;
    materia?: string | null;
    motivo?: string | null;
  };
  detalles?: any;
}

interface ReservaTurno {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  materia?: string | null;
  motivo?: string | null;
  numeroComputadora?: number | null;
  horaAsistencia?: string | null;
  usuario?: {
    id: number;
    nombreCompleto: string;
    ci?: string | null;
    correo: string;
    telefono?: string | null;
    rol?: { nombre: string };
  };
  laboratorio?: {
    id: number;
    nombre: string;
    ubicacion?: string;
    reservaPorComputadora?: boolean;
  };
}

interface HistorialPase {
  id: number;
  hora: string;
  usuario: string;
  laboratorio: string;
  computadora?: number | null;
  exito: boolean;
  motivo?: string;
}

export default function EscanearQr() {
  const [modo, setModo] = useState<'camara' | 'manual'>('camara');
  const [tokenInput, setTokenInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEscaneo | null>(null);
  const [historial, setHistorial] = useState<HistorialPase[]>([]);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [sonidoHabilitado, setSonidoHabilitado] = useState(true);

  // Estados para el modo manual y lista del turno actual
  const [reservasTurno, setReservasTurno] = useState<ReservaTurno[]>([]);
  const [cargandoTurno, setCargandoTurno] = useState(false);
  const [filtroLab, setFiltroLab] = useState<number | 'todos'>('todos');
  const [busquedaTurno, setBusquedaTurno] = useState('');
  const [laboratorios, setLaboratorios] = useState<{ id: number; nombre: string }[]>([]);
  const [marcandoId, setMarcandoId] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Reproducir sonido de confirmación o alerta
  const emitirSonido = (tipo: 'exito' | 'error') => {
    if (!sonidoHabilitado) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (tipo === 'exito') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        osc.frequency.setValueAtTime(164.81, audioCtx.currentTime + 0.15); // E3
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      // AudioContext no permitido sin interacción previa
    }
  };

  // Iniciar la cámara
  const iniciarCamara = async () => {
    try {
      detenerCamara();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCamaraActiva(true);
        animationFrameId.current = requestAnimationFrame(escanearFrame);
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      toast.error('No se pudo acceder a la cámara. Asegúrate de otorgar permisos o utiliza el modo manual.');
      setCamaraActiva(false);
      setModo('manual');
    }
  };

  // Detener la cámara
  const detenerCamara = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCamaraActiva(false);
  };

  // Loop de escaneo continuo con jsQR
  const escanearFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            // Código detectado
            detenerCamara();
            procesarValidacion(code.data);
            return;
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(escanearFrame);
  };

  useEffect(() => {
    if (modo === 'camara' && !resultado) {
      iniciarCamara();
    } else {
      detenerCamara();
    }
    return () => detenerCamara();
  }, [modo, resultado]);

  // Validar el token contra el servidor
  const procesarValidacion = async (tokenParaValidar: string) => {
    if (!tokenParaValidar || !tokenParaValidar.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:3000/api/reservas/escanear-qr',
        { tokenQr: tokenParaValidar.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        emitirSonido('exito');
        setResultado({
          exito: true,
          mensaje: res.data.mensaje || 'Acceso Permitido',
          data: res.data.data
        });

        // Registrar en historial local
        setHistorial((prev) => [
          {
            id: Date.now(),
            hora: new Date().toLocaleTimeString('es-ES'),
            usuario: res.data.data.usuario?.nombreCompleto || 'Usuario',
            laboratorio: res.data.data.laboratorio?.nombre || 'Laboratorio',
            computadora: res.data.data.numeroComputadora,
            exito: true
          },
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error: any) {
      emitirSonido('error');
      const errorData = error.response?.data;
      const mensajeError = errorData?.error || 'Acceso Denegado: Código QR inválido o no reconocido';

      setResultado({
        exito: false,
        codigo: errorData?.codigo || 'ERROR_VALIDACION',
        mensaje: mensajeError,
        detalles: errorData?.detalles
      });

      // Registrar rechazo en historial local
      setHistorial((prev) => [
        {
          id: Date.now(),
          hora: new Date().toLocaleTimeString('es-ES'),
          usuario: errorData?.detalles?.usuario || 'Desconocido',
          laboratorio: 'Intento Denegado',
          exito: false,
          motivo: mensajeError
        },
        ...prev.slice(0, 9)
      ]);
    } finally {
      setIsProcessing(false);
      setTokenInput('');
    }
  };

  // Cargar reservas de la jornada actual para check-in rapido
  const cargarReservasTurno = async () => {
    setCargandoTurno(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const params: any = {};
      if (filtroLab !== 'todos') params.laboratorioId = filtroLab;
      if (busquedaTurno.trim()) params.q = busquedaTurno.trim();

      const [resReservas, resLabs] = await Promise.all([
        axios.get('http://localhost:3000/api/reservas/turno-actual', { headers, params }),
        laboratorios.length === 0 ? axios.get('http://localhost:3000/api/laboratorios') : Promise.resolve({ data: { laboratorios } })
      ]);

      if (resReservas.data?.success) {
        setReservasTurno(resReservas.data.data);
      }
      if (resLabs.data?.laboratorios) {
        setLaboratorios(resLabs.data.laboratorios);
      }
    } catch (error) {
      console.error('Error al cargar reservas de la jornada:', error);
    } finally {
      setCargandoTurno(false);
    }
  };

  useEffect(() => {
    if (modo === 'manual') {
      cargarReservasTurno();
    }
  }, [modo, filtroLab]);

  // Validar asistencia con un solo clic desde la tabla
  const marcarAsistenciaDirecta = async (reserva: ReservaTurno) => {
    if (marcandoId) return;
    setMarcandoId(reserva.id);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:3000/api/reservas/${reserva.id}/asistencia-manual`,
        { motivo: 'Registro manual de asistencia en puerta' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        emitirSonido('exito');
        toast.success(`Asistencia confirmada para ${reserva.usuario?.nombreCompleto || 'Usuario'}`);

        setResultado({
          exito: true,
          mensaje: 'Asistencia Registrada Exitosamente (Validación Manual)',
          data: res.data.data
        });

        // Actualizar en la lista local reactivamente
        setReservasTurno((prev) =>
          prev.map((r) =>
            r.id === reserva.id
              ? { ...r, estado: 'Asistió', horaAsistencia: new Date().toISOString() }
              : r
          )
        );

        // Anadir al historial
        setHistorial((prev) => [
          {
            id: Date.now(),
            hora: new Date().toLocaleTimeString('es-ES'),
            usuario: reserva.usuario?.nombreCompleto || 'Usuario',
            laboratorio: reserva.laboratorio?.nombre || 'Laboratorio',
            computadora: reserva.numeroComputadora,
            exito: true
          },
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error: any) {
      emitirSonido('error');
      const msg = error.response?.data?.error || 'Error al registrar asistencia manual';
      toast.error(msg);
    } finally {
      setMarcandoId(null);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      return toast.error('Ingresa un Carnet (CI), # de Reserva o token');
    }
    procesarValidacion(tokenInput.trim()).then(() => {
      cargarReservasTurno();
    });
  };

  const reanudarEscaneo = () => {
    setResultado(null);
    setTokenInput('');
    if (modo === 'camara') {
      iniciarCamara();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-inter transition-colors duration-200">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-tech-blue dark:text-slate-400 mb-2">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver al Inicio
            </Link>
            <h1 className="text-2xl sm:text-3xl font-poppins font-bold text-slate-900 dark:text-white flex items-center">
              <ShieldCheck className="w-8 h-8 mr-3 text-tech-blue dark:text-blue-400" />
              Control de Acceso
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Verificación y registro de asistencia a laboratorios
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSonidoHabilitado(!sonidoHabilitado)}
              className={`p-2.5 rounded-xl border text-sm font-semibold flex items-center space-x-1.5 transition-colors ${
                sonidoHabilitado
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-tech-blue dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title={sonidoHabilitado ? 'Silenciar alertas' : 'Activar alertas de sonido'}
            >
              {sonidoHabilitado ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Panel Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Columna Izquierda: Escáner / Entrada (2 columnas) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Selector de Modo */}
            <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1.5 rounded-2xl">
              <button
                onClick={() => { setModo('camara'); setResultado(null); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                  modo === 'camara'
                    ? 'bg-white dark:bg-slate-700 text-tech-blue dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Cámara QR</span>
              </button>

              <button
                onClick={() => { setModo('manual'); setResultado(null); detenerCamara(); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                  modo === 'manual'
                    ? 'bg-white dark:bg-slate-700 text-tech-blue dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Ingreso Manual</span>
              </button>
            </div>

            {/* TARJETA DE RESULTADO: ÉXITO O ERROR */}
            {resultado ? (
              <div
                className={`rounded-3xl p-8 border shadow-lg animate-in zoom-in-95 duration-200 ${
                  resultado.exito
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      resultado.exito
                        ? 'bg-green-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {resultado.exito ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>

                  <div className="flex-1">
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1 ${
                        resultado.exito
                          ? 'bg-green-200/70 text-green-900 dark:bg-green-900/60 dark:text-green-200'
                          : 'bg-rose-200/70 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200'
                      }`}
                    >
                      {resultado.exito ? 'Acceso Autorizado' : 'Acceso Denegado'}
                    </span>

                    <h2
                      className={`text-xl font-poppins font-bold ${
                        resultado.exito ? 'text-green-900 dark:text-green-200' : 'text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      {resultado.mensaje}
                    </h2>

                    {/* Datos de la persona y laboratorio si fue exitoso */}
                    {resultado.exito && resultado.data && (
                      <div className="mt-4 pt-4 border-t border-green-200/70 dark:border-green-800/60 space-y-2 text-sm text-green-900 dark:text-green-100">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                          <span className="font-bold">{resultado.data.usuario?.nombreCompleto}</span>
                          <span className="text-xs text-green-700 dark:text-green-300 ml-2">
                            ({resultado.data.usuario?.correo})
                          </span>
                        </div>

                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                          <span>{resultado.data.laboratorio?.nombre}</span>
                          {resultado.data.laboratorio?.ubicacion && (
                            <span className="text-xs text-green-700 dark:text-green-300 ml-2">
                              [{resultado.data.laboratorio.ubicacion}]
                            </span>
                          )}
                        </div>

                        {resultado.data.numeroComputadora && (
                          <div className="flex items-center">
                            <Monitor className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                            <span className="font-bold">Computadora asignada: PC #{resultado.data.numeroComputadora}</span>
                          </div>
                        )}

                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                          <span>Sello de Asistencia: {new Date(resultado.data.horaAsistencia).toLocaleTimeString('es-ES')}</span>
                        </div>
                      </div>
                    )}

                    {/* Detalles adicionales si fue error */}
                    {!resultado.exito && resultado.detalles && (
                      <div className="mt-3 text-xs text-rose-800 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-900/30 p-3 rounded-xl">
                        {resultado.detalles.horaAsistenciaRegistrada && (
                          <p>Asistencia registrada previamente el {new Date(resultado.detalles.horaAsistenciaRegistrada).toLocaleString('es-ES')}</p>
                        )}
                        {resultado.detalles.horaInicio && (
                          <p>Horario pactado: {new Date(resultado.detalles.horaInicio).toLocaleString('es-ES')}</p>
                        )}
                      </div>
                    )}

                    {/* Botón Reanudar */}
                    <button
                      onClick={reanudarEscaneo}
                      className={`mt-6 w-full sm:w-auto font-bold py-2.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md text-sm ${
                        resultado.exito
                          ? 'bg-green-700 hover:bg-green-800 text-white'
                          : 'bg-rose-700 hover:bg-rose-800 text-white'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Escanear Siguiente Reserva</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : modo === 'camara' ? (

              /* VISTA DE LA CÁMARA (OPTICAL SCANNER) */
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                <div className="relative w-full max-w-md mx-auto aspect-square bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Mira telescópica / Visor de Escaneo */}
                  <div className="absolute inset-8 border-2 border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-4 border-l-4 border-tech-blue rounded-tl-lg" />
                      <div className="w-6 h-6 border-t-4 border-r-4 border-tech-blue rounded-tr-lg" />
                    </div>
                    {/* Línea Láser Animada */}
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

            ) : (

              /* VISTA MANUAL Y PLAN DE CONTINGENCIA */
              <div className="space-y-6">

                {/* 1. Formulario de Búsqueda y Validación Directa */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center">
                    <QrCode className="w-5 h-5 mr-2 text-tech-blue" />
                    Validación Manual o Lector USB
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Ingresa el CI, N° de reserva o escanea con pistola de código de barras.
                  </p>

                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        autoFocus
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="CI, # de reserva o código..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing || !tokenInput.trim()}
                      className="bg-tech-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-sm flex items-center justify-center space-x-2 shrink-0"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Validar</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* 2. Lista de Reservas de la Jornada (Turno Actual con 1 Clic) */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-tech-blue" />
                        Reservas de Hoy / Turno Actual
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Check-in directo del turno actual.
                      </p>
                    </div>

                    <button
                      onClick={cargarReservasTurno}
                      disabled={cargandoTurno}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-tech-blue dark:hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
                      title="Refrescar lista de reservas"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${cargandoTurno ? 'animate-spin' : ''}`} />
                      <span>Actualizar</span>
                    </button>
                  </div>

                  {/* Filtros de la lista */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                      <select
                        value={filtroLab}
                        onChange={(e) => setFiltroLab(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                      >
                        <option value="todos">Todos los Laboratorios</option>
                        {laboratorios.map((lab) => (
                          <option key={lab.id} value={lab.id}>{lab.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={busquedaTurno}
                        onChange={(e) => setBusquedaTurno(e.target.value)}
                        placeholder="Filtrar por estudiante, CI o materia..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-tech-blue outline-none"
                      />
                    </div>
                  </div>

                  {/* Listado de tarjetas de reserva */}
                  {cargandoTurno ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                      <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-tech-blue" />
                      <p className="text-xs">Cargando reservas de la jornada...</p>
                    </div>
                  ) : (() => {
                    const filtradas = reservasTurno.filter((r) => {
                      if (filtroLab !== 'todos' && r.laboratorio?.id !== filtroLab) return false;
                      if (!busquedaTurno.trim()) return true;
                      const q = busquedaTurno.toLowerCase();
                      const nombre = r.usuario?.nombreCompleto?.toLowerCase() || '';
                      const ci = r.usuario?.ci?.toLowerCase() || '';
                      const materia = r.materia?.toLowerCase() || '';
                      const idStr = String(r.id);
                      return nombre.includes(q) || ci.includes(q) || materia.includes(q) || idStr.includes(q);
                    });

                    if (filtradas.length === 0) {
                      return (
                        <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                          <p className="text-xs font-medium">No se encontraron reservas programadas para hoy con los filtros aplicados.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                        {filtradas.map((r) => {
                          const horaInicioStr = new Date(r.fechaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          const horaFinStr = new Date(r.fechaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div
                              key={r.id}
                              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                                    {r.usuario?.nombreCompleto}
                                  </span>
                                  {r.usuario?.ci && (
                                    <span className="font-mono text-[11px] bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                      CI: {r.usuario.ci}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">#{r.id}</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                                  <span className="font-semibold text-tech-blue dark:text-blue-400">
                                    {r.laboratorio?.nombre}
                                    {r.numeroComputadora ? ` (PC #${r.numeroComputadora})` : ' (Aula Completa)'}
                                  </span>
                                  <span>{horaInicioStr} - {horaFinStr}</span>
                                  {r.materia && <span className="italic truncate max-w-[150px]">{r.materia}</span>}
                                </div>
                              </div>

                              <div className="flex items-center self-end sm:self-auto shrink-0">
                                {r.estado === 'Aprobada' ? (
                                  <button
                                    onClick={() => marcarAsistenciaDirecta(r)}
                                    disabled={marcandoId === r.id}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                                  >
                                    {marcandoId === r.id ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Marcando...</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        <span>Marcar Asistencia</span>
                                      </>
                                    )}
                                  </button>
                                ) : r.estado === 'Asistió' ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                                    Asistió {r.horaAsistencia ? new Date(r.horaAsistencia).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                    <XCircle className="w-3 h-3 mr-1 text-rose-600 dark:text-rose-400" />
                                    Inasistencia
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>

            )}

          </div>

          {/* Columna Derecha: Historial de la Sesión (1 columna) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Pases Validados Hoy</span>
                <span className="text-xs font-semibold bg-blue-100 text-tech-blue dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {historial.length}
                </span>
              </h3>

              {historial.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">Sin registros en esta sesión.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historial.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        item.exito
                          ? 'bg-green-50/60 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 text-green-900 dark:text-green-200'
                          : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold truncate max-w-[140px]">{item.usuario}</span>
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{item.hora}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {item.laboratorio} {item.computadora ? `(PC #${item.computadora})` : ''}
                      </p>
                      {!item.exito && item.motivo && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-1 truncate">
                          {item.motivo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guía Rápida para el Operador */}
            <div className="bg-blue-50/60 dark:bg-blue-950/20 rounded-3xl p-6 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <h4 className="font-bold text-tech-blue dark:text-blue-400 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Criterios de Ingreso
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                <li>Luz verde: ingreso autorizado.</li>
                <li>Tolerancia máxima de anticipación: 15 minutos.</li>
                <li>Cada código QR es intransferible y de un solo uso.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
