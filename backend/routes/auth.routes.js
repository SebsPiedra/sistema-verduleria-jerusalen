const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const conexion = require('../db');
const obtenerVariables = require('../config/variables');
const { enviarCorreoRecuperacion } = require('../utils/email');

const router = express.Router();
const variables = obtenerVariables();
const MINUTOS_VIGENCIA = 60;

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

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo || usuario.email,
        rol: usuario.rol || 'admin',
        tipo: 'admin',
      },
      variables.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      mensaje: 'Inicio de sesión correcto',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo || usuario.email,
        rol: usuario.rol || 'admin',
        tipo: 'admin',
      },
    });
  } catch (error) {
    console.error('Error en login administrativo:', error);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
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
