import apiClient from '../api/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const esPushSoportado = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

export const obtenerPermisoNotificaciones = (): NotificationPermission | 'unsupported' => {
  if (!esPushSoportado()) return 'unsupported';
  return Notification.permission;
};

export const obtenerServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!esPushSoportado()) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js');
    }
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn('Error al obtener registro de ServiceWorker:', error);
    return null;
  }
};

export const verificarSuscripcionActiva = async (): Promise<boolean> => {
  if (!esPushSoportado()) return false;
  try {
    const registration = await obtenerServiceWorkerRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.warn('Error al verificar suscripción activa:', error);
    return false;
  }
};

export const suscribirNotificacionesPush = async (): Promise<{ ok: boolean; mensaje: string }> => {
  if (!esPushSoportado()) {
    return { ok: false, mensaje: 'Tu navegador no permite notificaciones en la barra de estado' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, mensaje: 'Debes conceder permisos de notificación en tu navegador para recibir avisos' };
    }

    const { data } = await apiClient.get('/api/push/public-key');
    const publicKey = data?.publicKey;
    if (!publicKey) {
      return { ok: false, mensaje: 'El servicio de notificaciones está iniciando. Reintenta en unos segundos' };
    }

    const registration = await obtenerServiceWorkerRegistration();
    if (!registration) {
      return { ok: false, mensaje: 'No se pudo iniciar el servicio en segundo plano' };
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource
      });
    }

    const subJson = subscription.toJSON();
    await apiClient.post('/api/push/suscribir', {
      endpoint: subJson.endpoint,
      keys: subJson.keys
    });

    return { ok: true, mensaje: 'Notificaciones activadas con éxito en tu celular' };
  } catch (error: any) {
    console.error('Error al suscribir a notificaciones push:', error);
    let mensajeHumano = 'No se pudo activar las notificaciones. Intenta nuevamente';
    if (error.response?.status === 404) {
      mensajeHumano = 'El servidor está completando la actualización. Intenta en un momento';
    } else if (error.response?.data?.error) {
      mensajeHumano = error.response.data.error;
    }
    return {
      ok: false,
      mensaje: mensajeHumano
    };
  }
};

export const desuscribirNotificacionesPush = async (): Promise<{ ok: boolean; mensaje: string }> => {
  if (!esPushSoportado()) return { ok: false, mensaje: 'No soportado' };

  try {
    const registration = await obtenerServiceWorkerRegistration();
    if (!registration) return { ok: false, mensaje: 'Servicio no disponible' };

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await apiClient.delete('/api/push/desuscribir', { data: { endpoint } }).catch(() => null);
    }
    return { ok: true, mensaje: 'Notificaciones desactivadas en este celular' };
  } catch (error: any) {
    console.error('Error al desuscribir notificaciones push:', error);
    return { ok: false, mensaje: 'Error al desactivar notificaciones' };
  }
};

export const enviarPushDePrueba = async (): Promise<{ ok: boolean; mensaje: string }> => {
  try {
    const { data } = await apiClient.post('/api/push/probar');
    return { ok: true, mensaje: data?.mensaje || 'Notificación de prueba enviada a tu barra de notificaciones' };
  } catch (error: any) {
    let mensajeHumano = 'No se pudo enviar la prueba. Intenta en unos instantes';
    if (error.response?.status === 404) {
      mensajeHumano = 'El servidor está completando la actualización. Intenta en un momento';
    } else if (error.response?.data?.error) {
      mensajeHumano = error.response.data.error;
    }
    return {
      ok: false,
      mensaje: mensajeHumano
    };
  }
};
