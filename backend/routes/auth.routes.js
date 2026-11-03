const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const conexion = require('../db');
const obtenerVariables = require('../config/variables');
const { enviarCorreoRecuperacion, enviarCodigo2FA } = require('../utils/email');
const {
  necesitaVerificacion,
  marcarRequerida,
  registrarAcceso,
  enviarCodigo: enviarCodigoAcceso,
  validarCodigo: validarCodigoAcceso,
} = require('../utils/emailVerification');

const router = express.Router();
const variables = obtenerVariables();
const MINUTOS_VIGENCIA = 60;
const MINUTOS_CODIGO_2FA = 10;

const ejecutar = (sql, params = []) =>
  new Promise((resolve, reject) => {
    conexion.query(sql, params, (error, resultado) => {
      if (error) reject(error);
      else resolve(resultado);
    });
  });

const obtenerPrimero = (resultado) => {
  if (Array.isArray(resultado)) return resultado[0] || null;
  return resultado?.rows?.[0] || null;
};

const verificarClave = async (claveIngresada, claveGuardada) => {
  if (!claveGuardada) return false;
  if (String(claveGuardada).startsWith('$2')) {
    return bcrypt.compare(claveIngresada, claveGuardada);
  }
  return claveIngresada === claveGuardada;
};

const prepararTablaRecuperacion = async () => {
  await ejecutar(`
    CREATE TABLE IF NOT EXISTS recuperacion_password (
      id_recuperacion BIGSERIAL PRIMARY KEY,
      tipo_cuenta VARCHAR(20) NOT NULL,
      id_cuenta BIGINT NOT NULL,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      fecha_expiracion TIMESTAMP NOT NULL,
      fecha_uso TIMESTAMP NULL,
      fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ejecutar(`
    CREATE INDEX IF NOT EXISTS idx_recuperacion_password_cuenta
    ON recuperacion_password (tipo_cuenta, id_cuenta)
  `);
};

const prepararTablaSeguridad = async () => {
  await ejecutar(`
    CREATE TABLE IF NOT EXISTS usuario_seguridad (
      id_usuario BIGINT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
      two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      two_factor_secret TEXT NULL,
      two_factor_pending_secret TEXT NULL,
      recovery_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
      es_sandbox BOOLEAN NOT NULL DEFAULT FALSE,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await ejecutar(`ALTER TABLE usuario_seguridad ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(64) NULL`);
  await ejecutar(`ALTER TABLE usuario_seguridad ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP NULL`);
  await ejecutar(`ALTER TABLE usuario_seguridad ADD COLUMN IF NOT EXISTS otp_attempts INTEGER NOT NULL DEFAULT 0`);
};

const crearCodigoCorreo = () => String(crypto.randomInt(100000, 1000000));
const hashCodigoCorreo = (idUsuario, codigo) => crypto
  .createHash('sha256')
  .update(`${idUsuario}:${String(codigo)}:${variables.JWT_SECRET}`)
  .digest('hex');

const guardarYEnviarCodigo = async (usuario) => {
  const codigo = crearCodigoCorreo();
  const vence = new Date(Date.now() + MINUTOS_CODIGO_2FA * 60 * 1000);
  await prepararTablaSeguridad();
  await ejecutar(
    `INSERT INTO usuario_seguridad (id_usuario, otp_hash, otp_expires_at, otp_attempts, actualizado_en)
     VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
     ON CONFLICT (id_usuario) DO UPDATE SET otp_hash = EXCLUDED.otp_hash,
       otp_expires_at = EXCLUDED.otp_expires_at, otp_attempts = 0,
       actualizado_en = CURRENT_TIMESTAMP`,
    [usuario.id_usuario, hashCodigoCorreo(usuario.id_usuario, codigo), vence]
  );
  await enviarCodigo2FA({
    correo: usuario.correo || usuario.email,
    nombre: usuario.nombre,
    codigo,
    minutosVigencia: MINUTOS_CODIGO_2FA,
  });
};

const validarCodigoCorreo = async (idUsuario, codigo) => {
  const seguridad = await obtenerSeguridad(idUsuario);
  if (!/^\d{6}$/.test(String(codigo || '')) || !seguridad?.otp_hash ||
      !seguridad.otp_expires_at || new Date(seguridad.otp_expires_at).getTime() < Date.now() ||
      Number(seguridad.otp_attempts || 0) >= 5) return false;
  const esperado = Buffer.from(seguridad.otp_hash, 'hex');
  const recibido = Buffer.from(hashCodigoCorreo(idUsuario, codigo), 'hex');
  const valido = esperado.length === recibido.length && crypto.timingSafeEqual(esperado, recibido);
  if (!valido) {
    await ejecutar(`UPDATE usuario_seguridad SET otp_attempts = otp_attempts + 1 WHERE id_usuario = ?`, [idUsuario]);
    return false;
  }
  await ejecutar(
    `UPDATE usuario_seguridad SET otp_hash = NULL, otp_expires_at = NULL,
     otp_attempts = 0, actualizado_en = CURRENT_TIMESTAMP WHERE id_usuario = ?`,
    [idUsuario]
  );
  return true;
};

const obtenerSeguridad = async (idUsuario) => {
  await prepararTablaSeguridad();
  return obtenerPrimero(await ejecutar(
    `SELECT * FROM usuario_seguridad WHERE id_usuario = ? LIMIT 1`,
    [idUsuario]
  ));
};

const crearTokenSesion = (usuario, opciones = {}) => jwt.sign(
  {
    id_usuario: usuario.id_usuario,
    correo: usuario.correo || usuario.email,
    rol: usuario.rol || 'admin',
    tipo: 'admin',
    sandbox: Boolean(opciones.sandbox),
    mfa: Boolean(opciones.mfa),
  },
  variables.JWT_SECRET,
  { expiresIn: opciones.sandbox ? '2h' : '8h' }
);

const respuestaSesion = (usuario, token, sandbox = false) => ({
  mensaje: sandbox ? 'Modo demostración iniciado' : 'Inicio de sesión correcto',
  token,
  usuario: {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    correo: usuario.correo || usuario.email,
    rol: usuario.rol || 'admin',
    tipo: 'admin',
    sandbox,
  },
});

const obtenerUsuarioAutenticado = async (req) => {
  const token = String(req.headers.authorization || '').replace(/^Bearer /i, '');
  const payload = jwt.verify(token, variables.JWT_SECRET, { algorithms: ['HS256'] });
  if (payload.tipo !== 'admin' || !Number.isSafeInteger(Number(payload.id_usuario))) {
    throw new Error('Acceso no autorizado');
  }
  return payload;
};

router.post('/login', async (req, res) => {
  const { correo, clave } = req.body;

  if (!correo || !clave) {
    return res.status(400).json({
      mensaje: 'Debe ingresar correo y contraseña',
    });
  }

  try {
    const usuario = obtenerPrimero(
      await ejecutar(
        `
          SELECT *, id AS id_usuario
          FROM usuarios
          WHERE LOWER(COALESCE(correo, email)) = LOWER(?)
          LIMIT 1
        `,
        [correo]
      )
    );

    if (!usuario) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos',
      });
    }

    const claveGuardada = usuario.clave || usuario.password;
    if (!(await verificarClave(clave, claveGuardada))) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos',
      });
    }

    if (await necesitaVerificacion('admin', usuario.id_usuario)) {
      await enviarCodigoAcceso({
        tipo: 'admin', id: usuario.id_usuario,
        correo: usuario.correo || usuario.email, nombre: usuario.nombre,
      });
      const desafio = jwt.sign(
        { tipo: 'verificacion_correo', tipoCuenta: 'admin', idCuenta: usuario.id_usuario },
        variables.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.status(202).json({
        requiere2FA: true,
        desafio,
        mensaje: 'Enviamos un código de seis dígitos a su correo electrónico.',
      });
    }

    await registrarAcceso('admin', usuario.id_usuario);
    return res.json(respuestaSesion(usuario, crearTokenSesion(usuario)));
  } catch (error) {
    console.error('Error en login administrativo:', error);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

router.post('/2fa/verificar-login', async (req, res) => {
  try {
    const payload = jwt.verify(String(req.body?.desafio || ''), variables.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    if (payload.tipo !== 'verificacion_correo' || !['admin', 'cliente'].includes(payload.tipoCuenta)) {
      throw new Error('Desafío inválido');
    }
    const valido = await validarCodigoAcceso(payload.tipoCuenta, payload.idCuenta, req.body?.codigo);
    if (!valido) return res.status(401).json({ mensaje: 'Código de verificación incorrecto.' });
    if (payload.tipoCuenta === 'admin') {
      const usuario = obtenerPrimero(await ejecutar(
        `SELECT *, id AS id_usuario FROM usuarios WHERE id = ? LIMIT 1`,
        [payload.idCuenta]
      ));
      if (!usuario) return res.status(404).json({ mensaje: 'La cuenta no existe.' });
      return res.json(respuestaSesion(usuario, crearTokenSesion(usuario, { mfa: true })));
    }
    const cliente = obtenerPrimero(await ejecutar(
      `SELECT id_cliente,nombre,telefono,COALESCE(correo,email,'') AS correo,
       direccion FROM clientes WHERE id_cliente = ? LIMIT 1`,
      [payload.idCuenta]
    ));
    if (!cliente) return res.status(404).json({ mensaje: 'La cuenta no existe.' });
    const token = jwt.sign(
      { id_cliente: cliente.id_cliente, correo: cliente.correo, tipo: 'cliente', mfa: true },
      variables.JWT_SECRET,
      { expiresIn: '8h' }
    );
    return res.json({
      mensaje: 'Inicio de sesión de cliente correcto.', token,
      cliente: { ...cliente, tipo: 'cliente' },
    });
  } catch (error) {
    return res.status(401).json({ mensaje: 'La verificación venció. Inicie sesión nuevamente.' });
  }
});

router.get('/2fa/estado', async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);
    const seguridad = await obtenerSeguridad(usuario.id_usuario);
    return res.json({
      activo: !usuario.sandbox,
      diasConfianza: 15,
      sandbox: Boolean(seguridad?.es_sandbox),
    });
  } catch {
    return res.status(401).json({ mensaje: 'Sesión no válida.' });
  }
});

router.post('/2fa/preparar', async (req, res) => {
  try {
    const usuarioToken = await obtenerUsuarioAutenticado(req);
    if (usuarioToken.sandbox) {
      return res.status(403).json({ mensaje: 'El modo demostración es de solo lectura.' });
    }
    const usuario = obtenerPrimero(await ejecutar(
      `SELECT *, id AS id_usuario FROM usuarios WHERE id = ? LIMIT 1`,
      [usuarioToken.id_usuario]
    ));
    if (!usuario) return res.status(404).json({ mensaje: 'La cuenta no existe.' });
    await guardarYEnviarCodigo(usuario);
    return res.json({
      mensaje: `Enviamos un código de seis dígitos a ${usuario.correo || usuario.email}.`,
      venceEnMinutos: MINUTOS_CODIGO_2FA,
    });
  } catch (error) {
    console.error('Preparación 2FA:', error.message || error);
    return res.status(500).json({ mensaje: 'No se pudo enviar el código de verificación.' });
  }
});

router.post('/2fa/activar', async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);
    if (usuario.sandbox) {
      return res.status(403).json({ mensaje: 'El modo demostración es de solo lectura.' });
    }
    if (!(await validarCodigoCorreo(usuario.id_usuario, req.body?.codigo))) {
      return res.status(400).json({ mensaje: 'El código es incorrecto o ya venció.' });
    }
    await prepararTablaSeguridad();
    await ejecutar(
      `UPDATE usuario_seguridad SET
        two_factor_enabled = TRUE,
        two_factor_secret = NULL,
        two_factor_pending_secret = NULL,
        actualizado_en = CURRENT_TIMESTAMP
       WHERE id_usuario = ?`,
      [usuario.id_usuario]
    );
    return res.json({ mensaje: 'Autenticación de dos factores activada.' });
  } catch {
    return res.status(401).json({ mensaje: 'Sesión no válida.' });
  }
});

router.post('/2fa/desactivar', async (req, res) => {
  try {
    const usuarioToken = await obtenerUsuarioAutenticado(req);
    if (usuarioToken.sandbox) {
      return res.status(403).json({ mensaje: 'El modo demostración es de solo lectura.' });
    }
    return res.status(403).json({
      mensaje: 'La verificación por correo es obligatoria para las cuentas administrativas.',
    });
  } catch {
    return res.status(401).json({ mensaje: 'Sesión no válida.' });
  }
});

router.post('/sandbox-login', async (req, res) => {
  try {
    if (String(process.env.SANDBOX_ENABLED || '').toLowerCase() !== 'true') {
      return res.status(404).json({ mensaje: 'El modo demostración no está habilitado.' });
    }
    await prepararTablaSeguridad();
    let usuario = obtenerPrimero(await ejecutar(
      `SELECT u.*, u.id AS id_usuario FROM usuarios u
       JOIN usuario_seguridad s ON s.id_usuario = u.id
       WHERE s.es_sandbox = TRUE LIMIT 1`
    ));
    if (!usuario) {
      // The demonstration session uses a real administrator only as a data
      // scope, but receives a distinct short-lived, read-only sandbox token.
      // This avoids creating a second operational account or storing a demo
      // password that could later be abused.
      usuario = obtenerPrimero(await ejecutar(
        `SELECT *, id AS id_usuario FROM usuarios
         WHERE LOWER(COALESCE(rol, 'admin')) = 'admin'
         ORDER BY id ASC LIMIT 1`
      ));
      if (!usuario) {
        return res.status(503).json({ mensaje: 'No existe una cuenta base para la demostración.' });
      }
    }
    return res.json(respuestaSesion(usuario, crearTokenSesion(usuario, { sandbox: true }), true));
  } catch (error) {
    console.error('Login sandbox:', error.message || error);
    return res.status(500).json({ mensaje: 'No se pudo abrir el modo demostración.' });
  }
});

router.post('/recuperar-password', async (req, res) => {
  const correo = String(req.body?.correo || '').trim().toLowerCase();
  const respuestaGenerica =
    'Si el correo está registrado, recibirá un enlace para cambiar su contraseña.';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({
      mensaje: 'Ingrese un correo electrónico válido.',
    });
  }

  try {
    await prepararTablaRecuperacion();

    let tipoCuenta = 'admin';
    let cuenta = obtenerPrimero(
      await ejecutar(
        `
          SELECT id AS id_cuenta, nombre,
            COALESCE(correo, email, '') AS correo
          FROM usuarios
          WHERE LOWER(COALESCE(correo, email, '')) = LOWER(?)
          LIMIT 1
        `,
        [correo]
      )
    );

    if (!cuenta) {
      tipoCuenta = 'cliente';
      cuenta = obtenerPrimero(
        await ejecutar(
          `
            SELECT id_cliente AS id_cuenta, nombre,
              COALESCE(correo, email, '') AS correo
            FROM clientes
            WHERE LOWER(COALESCE(correo, email, '')) = LOWER(?)
            LIMIT 1
          `,
          [correo]
        )
      );
    }

    if (!cuenta) {
      return res.json({ mensaje: respuestaGenerica });
    }

    await ejecutar(
      `
        UPDATE recuperacion_password
        SET fecha_uso = CURRENT_TIMESTAMP
        WHERE tipo_cuenta = ? AND id_cuenta = ? AND fecha_uso IS NULL
      `,
      [tipoCuenta, cuenta.id_cuenta]
    );

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const fechaExpiracion = new Date(
      Date.now() + MINUTOS_VIGENCIA * 60 * 1000
    );

    await ejecutar(
      `
        INSERT INTO recuperacion_password
          (tipo_cuenta, id_cuenta, token_hash, fecha_expiracion)
        VALUES (?, ?, ?, ?)
      `,
      [tipoCuenta, cuenta.id_cuenta, tokenHash, fechaExpiracion]
    );

    const enlace =
      `${variables.FRONTEND_URL.replace(/\/$/, '')}/restablecer-password` +
      `?token=${encodeURIComponent(token)}`;

    try {
      await enviarCorreoRecuperacion({
        correo: cuenta.correo,
        nombre: cuenta.nombre,
        enlace,
        minutosVigencia: MINUTOS_VIGENCIA,
      });
    } catch (errorCorreo) {
      await ejecutar(
        `
          UPDATE recuperacion_password
          SET fecha_uso = CURRENT_TIMESTAMP
          WHERE token_hash = ?
        `,
        [tokenHash]
      );
      throw errorCorreo;
    }

    return res.json({ mensaje: respuestaGenerica });
  } catch (error) {
    console.error('Error al solicitar recuperación:', error.message || error);
    return res.status(503).json({
      mensaje:
        'No se pudo enviar el correo de recuperación. Intente nuevamente más tarde.',
    });
  }
});

router.post('/restablecer-password', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const clave = String(req.body?.clave || '');

  if (!token) {
    return res.status(400).json({
      mensaje: 'El enlace de recuperación no es válido.',
    });
  }

  if (
    clave.length < 8 ||
    !/[a-z]/.test(clave) ||
    !/[A-Z]/.test(clave) ||
    !/\d/.test(clave)
  ) {
    return res.status(400).json({
      mensaje:
        'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.',
    });
  }

  try {
    await prepararTablaRecuperacion();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const recuperacion = obtenerPrimero(
      await ejecutar(
        `
          SELECT id_recuperacion, tipo_cuenta, id_cuenta
          FROM recuperacion_password
          WHERE token_hash = ?
            AND fecha_uso IS NULL
            AND fecha_expiracion > CURRENT_TIMESTAMP
          LIMIT 1
        `,
        [tokenHash]
      )
    );

    if (!recuperacion) {
      return res.status(400).json({
        mensaje: 'El enlace venció o ya fue utilizado. Solicite uno nuevo.',
      });
    }

    const claveHash = await bcrypt.hash(clave, 12);
    const tabla = recuperacion.tipo_cuenta === 'admin' ? 'usuarios' : 'clientes';
    const columnaId =
      recuperacion.tipo_cuenta === 'admin' ? 'id' : 'id_cliente';

    await ejecutar(
      `UPDATE ${tabla} SET clave = ?, password = ? WHERE ${columnaId} = ?`,
      [claveHash, claveHash, recuperacion.id_cuenta]
    );

    await marcarRequerida(recuperacion.tipo_cuenta, recuperacion.id_cuenta);

    await ejecutar(
      `
        UPDATE recuperacion_password
        SET fecha_uso = CURRENT_TIMESTAMP
        WHERE id_recuperacion = ?
      `,
      [recuperacion.id_recuperacion]
    );

    return res.json({
      mensaje: 'Contraseña actualizada correctamente. Ya puede iniciar sesión.',
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error.message || error);
    return res.status(500).json({
      mensaje: 'No se pudo actualizar la contraseña.',
    });
  }
});

module.exports = router;
