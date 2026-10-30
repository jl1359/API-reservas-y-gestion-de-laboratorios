import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  esPushSoportado,
  verificarSuscripcionActiva,
  suscribirNotificacionesPush,
  desuscribirNotificacionesPush,
  enviarPushDePrueba
} from '../services/pushNotification.service';

interface PushNotificationToggleProps {
  variant?: 'compact' | 'card';
  onStateChange?: (activo: boolean) => void;
}

export const PushNotificationToggle: React.FC<PushNotificationToggleProps> = ({
  variant = 'compact',
  onStateChange
}) => {
  const [soportado, setSoportado] = useState(false);
  const [activo, setActivo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error' | null>(null);

  useEffect(() => {
    const isSupported = esPushSoportado();
    setSoportado(isSupported);

    if (isSupported) {
      verificarSuscripcionActiva().then((isSubscribed) => {
        setActivo(isSubscribed);
        onStateChange?.(isSubscribed);
      });
    }
  }, []);

  const notificarTemporal = (texto: string, tipo: 'exito' | 'error') => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setTimeout(() => {
      setMensaje(null);
      setTipoMensaje(null);
    }, 4500);
  };

  const handleActivar = async () => {
    setCargando(true);
    setMensaje(null);
    try {
      const res = await suscribirNotificacionesPush();
      if (res.ok) {
        setActivo(true);
        onStateChange?.(true);
        notificarTemporal(res.mensaje, 'exito');
      } else {
        notificarTemporal(res.mensaje, 'error');
      }
    } catch (err: any) {
      notificarTemporal('Error al activar notificaciones push', 'error');
    } finally {
      setCargando(false);
    }
  };

  const handleDesactivar = async () => {
    setCargando(true);
    setMensaje(null);
    try {
      const res = await desuscribirNotificacionesPush();
      if (res.ok) {
        setActivo(false);
        onStateChange?.(false);
        notificarTemporal('Notificaciones desactivadas en este dispositivo', 'exito');
      } else {
        notificarTemporal(res.mensaje, 'error');
      }
    } catch (err: any) {
      notificarTemporal('Error al desactivar notificaciones', 'error');
    } finally {
      setCargando(false);
    }
  };

  const handleProbar = async () => {
    setCargando(true);
    try {
      const res = await enviarPushDePrueba();
      if (res.ok) {
        notificarTemporal('Notificación enviada a la barra de tu dispositivo', 'exito');
      } else {
        notificarTemporal(res.mensaje, 'error');
      }
    } catch (err: any) {
      notificarTemporal('Error al enviar la prueba', 'error');
    } finally {
      setCargando(false);
    }
  };

  if (!soportado) {
    if (variant === 'compact') {
      return (
        <div className="px-3 py-2 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center gap-1.5">
          <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Notificaciones de sistema no soportadas en este navegador</span>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80">
        <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2 flex items-center">
          <Smartphone className="w-5 h-5 mr-2 text-slate-400" /> Notificaciones en tu Dispositivo
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tu navegador o modo de navegación actual no soporta notificaciones push en segundo plano. Te recomendamos utilizar Google Chrome, Microsoft Edge o Brave sobre HTTPS.
        </p>
      </div>
    );
  }

  // Variante Compacta (Para el menú desplegable del Navbar)
  if (variant === 'compact') {
    return (
      <div className="p-3 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 rounded-b-2xl">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-tech-blue dark:text-blue-400" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              Barra del Celular / Dispositivo
            </span>
          </div>

          <div className="flex items-center gap-1">
            {activo ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Activas
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Inactivas
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
          {activo
            ? 'Recibirás avisos de reservas, QR y asistencias en la barra del celular.'
            : 'Recibe alertas en la barra de tu celular aun con el navegador cerrado.'}
        </p>

        <div className="flex items-center gap-2">
          {activo ? (
            <>
              <button
                type="button"
                onClick={handleProbar}
                disabled={cargando}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-tech-blue hover:bg-blue-600 text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {cargando ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>Probar en celular</span>
              </button>

              <button
                type="button"
                onClick={handleDesactivar}
                disabled={cargando}
                className="text-[11px] text-slate-400 hover:text-rose-500 py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
              >
                Desactivar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleActivar}
              disabled={cargando}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-tech-blue hover:bg-blue-600 text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {cargando ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <BellRing className="w-3 h-3" />
              )}
              <span>Activar en este celular / equipo</span>
            </button>
          )}
        </div>

        {mensaje && (
          <div
            className={`mt-2 p-1.5 rounded-md text-[10px] font-medium flex items-center gap-1.5 ${
              tipoMensaje === 'exito'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {tipoMensaje === 'exito' ? (
              <CheckCircle className="w-3 h-3 shrink-0" />
            ) : (
              <AlertCircle className="w-3 h-3 shrink-0" />
            )}
            <span>{mensaje}</span>
          </div>
        )}
      </div>
    );
  }

  // Variante Card (Para Mi Perfil > Pestaña Cuenta)
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white flex items-center">
          <Smartphone className="w-5 h-5 mr-2 text-tech-blue" /> Notificaciones en tu Dispositivo
        </h3>
        <div>
          {activo ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Activas en este navegador
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Inactivas
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
        Recibe alertas instantáneas en la barra de notificaciones del celular o escritorio cuando se apruebe una reserva, recibas tu código QR de acceso, se registre tu asistencia o existan avisos importantes, incluso con el navegador cerrado.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {activo ? (
          <>
            <button
              type="button"
              onClick={handleProbar}
              disabled={cargando}
              className="inline-flex items-center gap-2 bg-tech-blue hover:bg-blue-600 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {cargando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Enviar Notificación de Prueba</span>
            </button>

            <button
              type="button"
              onClick={handleDesactivar}
              disabled={cargando}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer"
            >
              <BellOff className="w-4 h-4" />
              <span>Desactivar</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleActivar}
            disabled={cargando}
            className="inline-flex items-center gap-2 bg-tech-blue hover:bg-blue-600 active:scale-[0.98] text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {cargando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            <span>Activar Notificaciones en este Dispositivo</span>
          </button>
        )}
      </div>

      {mensaje && (
        <div
          className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            tipoMensaje === 'exito'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50'
          }`}
        >
          {tipoMensaje === 'exito' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{mensaje}</span>
        </div>
      )}
    </div>
  );
};

export default PushNotificationToggle;
