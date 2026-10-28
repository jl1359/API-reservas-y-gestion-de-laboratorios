import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import apiClient from '../api/client';
import {
  Camera,
  QrCode,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import TarjetaResultadoEscaneo, { type ResultadoEscaneo } from '../components/escanear/TarjetaResultadoEscaneo';
import VisorCamaraQr from '../components/escanear/VisorCamaraQr';
import TablaReservasTurnoActual, { type ReservaTurno } from '../components/escanear/TablaReservasTurnoActual';
import HistorialPasesSesion, { type HistorialPase } from '../components/escanear/HistorialPasesSesion';

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
      const res = await apiClient.post('/api/reservas/escanear-qr', {
        tokenQr: tokenParaValidar.trim()
      });

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
      const params: any = {};
      if (filtroLab !== 'todos') params.laboratorioId = filtroLab;
      if (busquedaTurno.trim()) params.q = busquedaTurno.trim();

      const [resReservas, resLabs] = await Promise.all([
        apiClient.get('/api/reservas/turno-actual', { params }),
        laboratorios.length === 0 ? apiClient.get('/api/laboratorios') : Promise.resolve({ data: { laboratorios } })
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
      const res = await apiClient.post(`/api/reservas/${reserva.id}/asistencia-manual`, {
        motivo: 'Registro manual de asistencia en puerta'
      });

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

        // Añadir al historial
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
              className={`p-2.5 rounded-xl border text-sm font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
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
          {/* Columna Izquierda: Escaner / Entrada (2 columnas) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selector de Modo */}
            <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1.5 rounded-2xl">
              <button
                onClick={() => { setModo('camara'); setResultado(null); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
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
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
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
              <TarjetaResultadoEscaneo
                resultado={resultado}
                onReanudar={reanudarEscaneo}
              />
            ) : modo === 'camara' ? (
              <VisorCamaraQr
                videoRef={videoRef}
                canvasRef={canvasRef}
                camaraActiva={camaraActiva}
              />
            ) : (
              /* VISTA MANUAL Y PLAN DE CONTINGENCIA */
              <div className="space-y-6">
                {/* Formulario de Busqueda y Validacion Directa */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center">
                    <QrCode className="w-5 h-5 mr-2 text-tech-blue" />
                    Validación Manual o Lector USB
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Ingresa el CI, N° de reserva o ingresa el codigo de la reserva
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
                      className="bg-tech-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-sm flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Validar</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* Lista de Reservas de la Jornada (Turno Actual con 1 Clic) */}
                <TablaReservasTurnoActual
                  reservasTurno={reservasTurno}
                  cargandoTurno={cargandoTurno}
                  filtroLab={filtroLab}
                  setFiltroLab={setFiltroLab}
                  busquedaTurno={busquedaTurno}
                  setBusquedaTurno={setBusquedaTurno}
                  laboratorios={laboratorios}
                  marcandoId={marcandoId}
                  onRecargar={cargarReservasTurno}
                  onMarcarAsistenciaDirecta={marcarAsistenciaDirecta}
                />
              </div>
            )}
          </div>

          {/* Columna Derecha: Historial de la Sesion (1 columna) */}
          <HistorialPasesSesion historial={historial} />
        </div>
      </div>
    </div>
  );
}