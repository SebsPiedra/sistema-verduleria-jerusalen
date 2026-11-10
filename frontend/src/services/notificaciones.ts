import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import api from './api';

const firebaseWebConfig = {
  apiKey: 'AIzaSyCJNmRHF8TUFk-KG3JOKCzjPoWXAKxM7w8',
  authDomain: 'verduleria-jerusalen.firebaseapp.com',
  projectId: 'verduleria-jerusalen',
  storageBucket: 'verduleria-jerusalen.firebasestorage.app',
  messagingSenderId: '782205606289',
  appId: '1:782205606289:web:231f9d8f8dcf8560886230',
};
const vapidPublicKey = 'BNcKneSlGFeof9w56x5Swggq0ogfPDoUA4P2AIMBjFJV2pPs0cHnm0myFZnc-D93oDoyJc6Jv5bB7Ph_2oZUIzA';
let escuchaWebPreparada = false;

const mostrarNotificacionWeb = async (
  registro: ServiceWorkerRegistration,
  titulo: string,
  cuerpo: string,
  tipo = 'general',
) => registro.showNotification(titulo, {
  body: cuerpo,
  icon: '/favicon.ico',
  badge: '/favicon.ico',
  tag: `${tipo}-${Date.now()}`,
  requireInteraction: true,
  data: { tipo, url: tipo === 'pedido' ? '/pedidos-admin' : '/alertas' },
});

const conTiempoLimite = <T>(promesa: Promise<T>, milisegundos: number, etapa: string) =>
  Promise.race<T>([
    promesa,
    new Promise<T>((_, rechazar) => setTimeout(
      () => rechazar(new Error(`Firebase tardó demasiado durante ${etapa}. Recargue la página e inténtelo nuevamente.`)),
      milisegundos,
    )),
  ]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registrarDispositivoNotificaciones(solicitarPermiso = false) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return { registrado: false, motivo: 'navegador_no_compatible' };
    }
    let permiso = window.Notification.permission;
    if (permiso === 'default' && solicitarPermiso) {
      permiso = await conTiempoLimite(window.Notification.requestPermission(), 15000, 'la autorización de notificaciones');
    }
    if (permiso !== 'granted') return { registrado: false, motivo: permiso === 'denied' ? 'permiso' : 'requiere_interaccion' };

    const [{ initializeApp, getApps }, { getMessaging, getToken, isSupported, onMessage }] = await Promise.all([
      import('firebase/app'), import('firebase/messaging'),
    ]);
    if (!(await isSupported())) return { registrado: false, motivo: 'navegador_no_compatible' };
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseWebConfig);
    const serviceWorkerRegistration = await conTiempoLimite(
      navigator.serviceWorker.register('/firebase-messaging-sw.js'),
      15000,
      'el registro del servicio en segundo plano',
    );
    await conTiempoLimite(navigator.serviceWorker.ready, 15000, 'la activación del servicio en segundo plano');
    const messaging = getMessaging(app);
    const token = await conTiempoLimite(
      getToken(messaging, { vapidKey: vapidPublicKey, serviceWorkerRegistration }),
      20000,
      'la creación del token de notificaciones',
    );
    if (!token) return { registrado: false, motivo: 'sin_token' };
    await conTiempoLimite(
      api.post('/notificaciones/registrar', { token, plataforma: 'web' }),
      15000,
      'el registro del dispositivo en el servidor',
    );

    if (!escuchaWebPreparada) {
      escuchaWebPreparada = true;
      onMessage(messaging, (mensaje) => {
        const titulo = mensaje.notification?.title || mensaje.data?.titulo || 'Verdulería Jerusalén';
        const cuerpo = mensaje.notification?.body || mensaje.data?.cuerpo || 'Tiene una notificación nueva.';
        const tipo = mensaje.data?.tipo || 'general';
        if (window.Notification.permission === 'granted') {
          void mostrarNotificacionWeb(serviceWorkerRegistration, titulo, cuerpo, tipo);
          window.dispatchEvent(new CustomEvent('verduleria:notificacion-recibida', {
            detail: { titulo, cuerpo, tipo },
          }));
        }
      });
    }
    return { registrado: true };
  }
  if (!Device.isDevice) return { registrado: false, motivo: 'simulador' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('operacion', {
      name: 'Operación de la verdulería',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#087F73',
    });
  }

  let permisos = await Notifications.getPermissionsAsync();
  if (permisos.status !== 'granted') permisos = await Notifications.requestPermissionsAsync();
  if (permisos.status !== 'granted') return { registrado: false, motivo: 'permiso' };

  const token = await Notifications.getDevicePushTokenAsync();
  await api.post('/notificaciones/registrar', {
    token: String(token.data),
    plataforma: Platform.OS,
  });
  return { registrado: true };
}

export async function pruebaLocalNotificacion(tipo: 'pedido' | 'stock' | 'general' = 'general') {
  const contenido = tipo === 'pedido'
    ? { title: 'Pedido nuevo', body: 'Se recibió un pedido nuevo para preparar.' }
    : tipo === 'stock'
      ? { title: 'Stock bajo', body: 'Hay productos que necesitan reposición.' }
      : { title: 'Notificaciones activas', body: 'La prueba local del sistema se realizó correctamente.' };

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) throw new Error('Este navegador no admite notificaciones.');
    let permiso = window.Notification.permission;
    if (permiso !== 'granted') permiso = await window.Notification.requestPermission();
    if (permiso !== 'granted') throw new Error('El navegador no concedió permiso para notificaciones.');
    const registro = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    await mostrarNotificacionWeb(registro, contenido.title, contenido.body, tipo);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: { ...contenido, sound: true, data: { prueba: true, tipo } },
    trigger: null,
  });
}
