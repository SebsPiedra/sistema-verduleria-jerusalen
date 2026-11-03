const crypto = require('crypto');
const conexion = require('../db');
const obtenerVariables = require('../config/variables');
const { enviarCodigo2FA } = require('./email');

const variables = obtenerVariables();
const MINUTOS_CODIGO = 10;
const DIAS_CONFIANZA = 15;

const ejecutar = (sql, params = []) => new Promise((resolve, reject) => {
  conexion.query(sql, params, (error, resultado) => error ? reject(error) : resolve(resultado));
});

const primeraFila = (resultado) => Array.isArray(resultado)
  ? resultado[0] || null
  : resultado?.rows?.[0] || null;

const prepararTabla = async () => {
  await ejecutar(`
    CREATE TABLE IF NOT EXISTS verificacion_acceso (
      tipo_cuenta VARCHAR(20) NOT NULL,
      id_cuenta BIGINT NOT NULL,
      requiere_verificacion BOOLEAN NOT NULL DEFAULT TRUE,
      correo_verificado_en TIMESTAMP NULL,
      ultimo_acceso TIMESTAMP NULL,
      otp_hash VARCHAR(64) NULL,
      otp_expires_at TIMESTAMP NULL,
      otp_attempts INTEGER NOT NULL DEFAULT 0,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tipo_cuenta, id_cuenta)
    )
  `);
};

const hashCodigo = (tipo, id, codigo) => crypto.createHash('sha256')
  .update(`${tipo}:${id}:${String(codigo)}:${variables.JWT_SECRET}`)
  .digest('hex');

const obtenerEstado = async (tipo, id) => {
  await prepararTabla();
  return primeraFila(await ejecutar(
    `SELECT * FROM verificacion_acceso WHERE tipo_cuenta = ? AND id_cuenta = ? LIMIT 1`,
    [tipo, id]
  ));
};

const necesitaVerificacion = async (tipo, id) => {
  const estado = await obtenerEstado(tipo, id);
  if (!estado || estado.requiere_verificacion || !estado.ultimo_acceso) return true;
  return new Date(estado.ultimo_acceso).getTime() < Date.now() - DIAS_CONFIANZA * 86400000;
};

const marcarRequerida = async (tipo, id) => {
  await prepararTabla();
  await ejecutar(
    `INSERT INTO verificacion_acceso (tipo_cuenta, id_cuenta, requiere_verificacion, actualizado_en)
     VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)
     ON CONFLICT (tipo_cuenta, id_cuenta) DO UPDATE SET requiere_verificacion = TRUE,
       otp_hash = NULL, otp_expires_at = NULL, otp_attempts = 0,
       actualizado_en = CURRENT_TIMESTAMP`,
    [tipo, id]
  );
};

const registrarAcceso = async (tipo, id, verificado = false) => {
  await prepararTabla();
  await ejecutar(
    `INSERT INTO verificacion_acceso
      (tipo_cuenta, id_cuenta, requiere_verificacion, correo_verificado_en, ultimo_acceso, actualizado_en)
     VALUES (?, ?, FALSE, ${verificado ? 'CURRENT_TIMESTAMP' : 'NULL'}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (tipo_cuenta, id_cuenta) DO UPDATE SET requiere_verificacion = FALSE,
       correo_verificado_en = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE verificacion_acceso.correo_verificado_en END,
       ultimo_acceso = CURRENT_TIMESTAMP, otp_hash = NULL, otp_expires_at = NULL,
       otp_attempts = 0, actualizado_en = CURRENT_TIMESTAMP`,
    [tipo, id, Boolean(verificado)]
  );
};

const enviarCodigo = async ({ tipo, id, correo, nombre }) => {
  await prepararTabla();
  const codigo = String(crypto.randomInt(100000, 1000000));
  const vence = new Date(Date.now() + MINUTOS_CODIGO * 60000);
  await ejecutar(
    `INSERT INTO verificacion_acceso
      (tipo_cuenta, id_cuenta, requiere_verificacion, otp_hash, otp_expires_at, otp_attempts, actualizado_en)
     VALUES (?, ?, TRUE, ?, ?, 0, CURRENT_TIMESTAMP)
     ON CONFLICT (tipo_cuenta, id_cuenta) DO UPDATE SET otp_hash = EXCLUDED.otp_hash,
       otp_expires_at = EXCLUDED.otp_expires_at, otp_attempts = 0,
       actualizado_en = CURRENT_TIMESTAMP`,
    [tipo, id, hashCodigo(tipo, id, codigo), vence]
  );
  await enviarCodigo2FA({ correo, nombre, codigo, minutosVigencia: MINUTOS_CODIGO });
};

const validarCodigo = async (tipo, id, codigo) => {
  const estado = await obtenerEstado(tipo, id);
  if (!/^\d{6}$/.test(String(codigo || '')) || !estado?.otp_hash ||
      !estado.otp_expires_at || new Date(estado.otp_expires_at).getTime() < Date.now() ||
      Number(estado.otp_attempts || 0) >= 5) return false;
  const esperado = Buffer.from(estado.otp_hash, 'hex');
  const recibido = Buffer.from(hashCodigo(tipo, id, codigo), 'hex');
  const valido = esperado.length === recibido.length && crypto.timingSafeEqual(esperado, recibido);
  if (!valido) {
    await ejecutar(
      `UPDATE verificacion_acceso SET otp_attempts = otp_attempts + 1
       WHERE tipo_cuenta = ? AND id_cuenta = ?`,
      [tipo, id]
    );
    return false;
  }
  await registrarAcceso(tipo, id, true);
  return true;
};

module.exports = {
  MINUTOS_CODIGO,
  DIAS_CONFIANZA,
  necesitaVerificacion,
  marcarRequerida,
  registrarAcceso,
  enviarCodigo,
  validarCodigo,
};
