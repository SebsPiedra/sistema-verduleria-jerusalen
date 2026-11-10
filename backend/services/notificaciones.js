const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { pool } = require('../utils/mensual');

let tablasListas;

const prepararTablas = async () => {
  if (!tablasListas) {
    tablasListas = pool.query(`
      CREATE TABLE IF NOT EXISTS dispositivos_notificacion (
        id BIGSERIAL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        plataforma VARCHAR(20) NOT NULL,
        tipo_usuario VARCHAR(20) NOT NULL,
        id_usuario BIGINT NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return tablasListas;
};

const credencialFirebase = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }
  return null;
};

const mensajeria = () => {
  const credencial = credencialFirebase();
  if (!credencial) return null;
  if (!getApps().length) initializeApp({ credential: cert(credencial) });
  return getMessaging();
};

const registrarDispositivo = async ({ token, plataforma, tipoUsuario, idUsuario }) => {
  await prepararTablas();
  if (plataforma === 'web') {
    await pool.query(
      `UPDATE dispositivos_notificacion SET activo=FALSE, actualizado_en=CURRENT_TIMESTAMP
       WHERE plataforma='web' AND tipo_usuario=$1 AND id_usuario=$2
       AND activo=TRUE AND length(token) < 80`,
      [tipoUsuario, idUsuario]
    );
  }
  await pool.query(
    `INSERT INTO dispositivos_notificacion (token, plataforma, tipo_usuario, id_usuario)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (token) DO UPDATE SET plataforma=EXCLUDED.plataforma,
       tipo_usuario=EXCLUDED.tipo_usuario,id_usuario=EXCLUDED.id_usuario,
       activo=TRUE,actualizado_en=CURRENT_TIMESTAMP`,
    [token, plataforma, tipoUsuario, idUsuario]
  );
};

const tokensPara = async (tipoUsuario, idUsuario = null) => {
  await prepararTablas();
  const parametros = [tipoUsuario];
  let filtro = 'tipo_usuario=$1 AND activo=TRUE';
  if (idUsuario !== null && idUsuario !== undefined) {
    parametros.push(Number(idUsuario));
    filtro += ' AND id_usuario=$2';
  }
  const { rows } = await pool.query(`SELECT token FROM dispositivos_notificacion WHERE ${filtro}`, parametros);
  return rows.map((fila) => fila.token);
};

const enviar = async ({ tokens, titulo, cuerpo, datos = {} }) => {
  const servicio = mensajeria();
  if (!servicio) return { enviado: false, motivo: 'firebase_no_configurado' };
  const unicos = [...new Set((tokens || []).filter(Boolean))];
  if (!unicos.length) return { enviado: false, motivo: 'sin_dispositivos' };
  const pantalla = String(datos.pantalla || '/');
  const frontend = String(process.env.FRONTEND_URL || 'https://frontend-verduleria.vercel.app').replace(/\/$/, '');
  const respuesta = await servicio.sendEachForMulticast({
    tokens: unicos,
    notification: { title: titulo, body: cuerpo },
    data: Object.fromEntries(Object.entries(datos).map(([clave, valor]) => [clave, String(valor)])),
    android: { priority: 'high', notification: { channelId: 'operacion', sound: 'default' } },
    webpush: {
      notification: { icon: '/favicon.png', badge: '/favicon.png' },
      fcmOptions: { link: `${frontend}${pantalla.startsWith('/') ? pantalla : `/${pantalla}`}` },
    },
  });
  const codigosInvalidos = [
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/invalid-argument',
  ];
  const invalidos = respuesta.responses
    .map((resultado, indice) => (!resultado.success && codigosInvalidos.includes(resultado.error?.code) ? unicos[indice] : null))
    .filter(Boolean);
  if (invalidos.length) await pool.query('UPDATE dispositivos_notificacion SET activo=FALSE WHERE token=ANY($1::text[])', [invalidos]);
  const primerError = respuesta.responses.find((resultado) => !resultado.success)?.error;
  return {
    enviado: respuesta.successCount > 0,
    motivo: respuesta.successCount > 0 ? undefined : 'envio_fallido',
    exitos: respuesta.successCount,
    fallidos: respuesta.failureCount,
    codigo: primerError?.code || null,
  };
};

const notificarAdministradores = async (titulo, cuerpo, datos) => enviar({
  tokens: await tokensPara('admin'), titulo, cuerpo, datos,
});

const notificarCliente = async (idCliente, titulo, cuerpo, datos) => enviar({
  tokens: await tokensPara('cliente', idCliente), titulo, cuerpo, datos,
});

const notificarStockBajo = async () => {
  const { rows } = await pool.query(`SELECT nombre,coalesce(cantidad,0) AS cantidad
    FROM productos WHERE lower(coalesce(estado,'Activo'))='activo'
    AND coalesce(cantidad,0) <= coalesce(stock_minimo,0)
    ORDER BY coalesce(cantidad,0),nombre LIMIT 5`);
  if (!rows.length) return { enviado: false, motivo: 'sin_alertas' };
  const nombres = rows.map((fila) => fila.nombre).join(', ');
  return notificarAdministradores(
    rows.some((fila) => Number(fila.cantidad) <= 0) ? 'Producto agotado' : 'Stock bajo',
    `${rows.length} producto(s) requieren atención: ${nombres}.`,
    { pantalla: '/alertas', tipo: 'stock' }
  );
};

const ejecutarSinBloquear = (promesa, contexto) => {
  Promise.resolve(promesa).catch((error) => console.error(`Notificación ${contexto}:`, error.message || error));
};

module.exports = {
  registrarDispositivo,
  tokensPara,
  enviar,
  notificarAdministradores,
  notificarCliente,
  notificarStockBajo,
  ejecutarSinBloquear,
  firebaseConfigurado: () => Boolean(credencialFirebase()),
};
