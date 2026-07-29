const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const conexion = require('../db');
const obtenerVariables = require('../config/variables');

const router = express.Router();
const variables = obtenerVariables();

function ejecutar(sql, params = []) {
  return new Promise((resolve, reject) => {
    conexion.query(sql, params, (error, resultado) => {
      if (error) {
        reject(error);
      } else {
        resolve(resultado);
      }
    });
  });
}

function obtenerFilas(resultado) {
  if (Array.isArray(resultado)) return resultado;
  if (resultado?.rows) return resultado.rows;
  return [];
}

function obtenerPrimero(resultado) {
  const filas = obtenerFilas(resultado);
  return filas[0] || null;
}

async function obtenerSiguienteId(tabla, columna) {
  const resultado = await ejecutar(
    `SELECT COALESCE(MAX(${columna}), 0) + 1 AS siguiente FROM ${tabla}`
  );

  const fila = obtenerPrimero(resultado);

  return Number(fila?.siguiente || 1);
}

router.post('/registrar', async (req, res) => {
  try {
    const { nombre, telefono, correo, clave, direccion } = req.body;

    const nombreLimpio = String(nombre || '').trim();
    const telefonoLimpio = String(telefono || '').trim();
    const correoLimpio = String(correo || '').trim().toLowerCase();
    const claveLimpia = String(clave || '').trim();
    const direccionLimpia = String(direccion || '').trim();

    if (!nombreLimpio || !correoLimpio || !claveLimpia) {
      return res.status(400).json({
        mensaje: 'Debe ingresar nombre, correo y contraseña.',
      });
    }

    if (nombreLimpio.length < 3) {
      return res.status(400).json({
        mensaje: 'El nombre debe tener al menos 3 caracteres.',
      });
    }

    if (!correoLimpio.includes('@')) {
      return res.status(400).json({
        mensaje: 'Debe ingresar un correo válido.',
      });
    }

    if (claveLimpia.length < 6) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener mínimo 6 caracteres.',
      });
    }

    const resultadoValidar = await ejecutar(
      `
        SELECT id_cliente
        FROM clientes
        WHERE LOWER(COALESCE(correo, email, '')) = LOWER(?)
        LIMIT 1
      `,
      [correoLimpio]
    );

    const clienteExiste = obtenerPrimero(resultadoValidar);

    if (clienteExiste) {
      return res.status(400).json({
        mensaje: 'Ya existe un cliente registrado con ese correo.',
      });
    }

    const idCliente = await obtenerSiguienteId('clientes', 'id_cliente');

    const claveHash = await bcrypt.hash(claveLimpia, 12);

    await ejecutar(
      `
        INSERT INTO clientes
        (
          id_cliente,
          nombre,
          telefono,
          correo,
          email,
          clave,
          password,
          direccion,
          estado,
          fecha_registro
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Activo', CURRENT_TIMESTAMP)
      `,
      [
        idCliente,
        nombreLimpio,
        telefonoLimpio,
        correoLimpio,
        correoLimpio,
        claveHash,
        claveHash,
        direccionLimpia,
      ]
    );

    return res.json({
      mensaje: 'Cliente registrado correctamente.',
      id_cliente: idCliente,
      cliente: {
        id_cliente: idCliente,
        nombre: nombreLimpio,
        telefono: telefonoLimpio,
        correo: correoLimpio,
        direccion: direccionLimpia,
        estado: 'Activo',
      },
    });
  } catch (error) {
    console.log('Error al registrar cliente:', error);

    return res.status(500).json({
      mensaje: 'Error al registrar cliente.',
      error: error.message || error,
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { correo, clave } = req.body;

    const correoLimpio = String(correo || '').trim().toLowerCase();
    const claveLimpia = String(clave || '').trim();

    if (!correoLimpio || !claveLimpia) {
      return res.status(400).json({
        mensaje: 'Debe ingresar correo y contraseña.',
      });
    }

    const resultadoClientes = await ejecutar(
      `
        SELECT
          id_cliente,
          nombre,
          telefono,
          COALESCE(correo, email, '') AS correo,
          email,
          clave,
          password,
          direccion,
          COALESCE(estado, 'Activo') AS estado
        FROM clientes
        WHERE LOWER(COALESCE(correo, email, '')) = LOWER(?)
        LIMIT 1
      `,
      [correoLimpio]
    );

    const cliente = obtenerPrimero(resultadoClientes);

    if (!cliente) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos.',
      });
    }

    if (String(cliente.estado || 'Activo') !== 'Activo') {
      return res.status(401).json({
        mensaje: 'El cliente se encuentra inactivo.',
      });
    }

    const claveGuardada = cliente.clave || cliente.password;

    const claveCorrecta = String(claveGuardada || '').startsWith('$2')
      ? await bcrypt.compare(claveLimpia, claveGuardada)
      : claveGuardada === claveLimpia;

    if (!claveCorrecta) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos.',
      });
    }

    const token = jwt.sign(
      {
        id_cliente: cliente.id_cliente,
        correo: cliente.correo || cliente.email,
        tipo: 'cliente',
      },
      variables.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      mensaje: 'Inicio de sesión de cliente correcto.',
      token,
      cliente: {
        id_cliente: cliente.id_cliente,
        nombre: cliente.nombre,
        correo: cliente.correo || cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        tipo: 'cliente',
      },
    });
  } catch (error) {
    console.log('Error login cliente:', error);

    return res.status(500).json({
      mensaje: 'Error en el servidor.',
      error: error.message || error,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const resultadoClientes = await ejecutar(`
      SELECT
        id_cliente,
        nombre,
        telefono,
        COALESCE(correo, email, '') AS correo,
        direccion,
        COALESCE(fecha_registro, fecha_creacion, CURRENT_TIMESTAMP) AS fecha_registro,
        COALESCE(estado, 'Activo') AS estado
      FROM clientes
      ORDER BY id_cliente DESC
    `);

    const clientes = obtenerFilas(resultadoClientes);

    return res.json(clientes);
  } catch (error) {
    console.log('Error al obtener clientes:', error);

    return res.status(500).json({
      mensaje: 'Error al obtener clientes.',
      error: error.message || error,
    });
  }
});

router.patch('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadoNuevo = estado === 'Inactivo' ? 'Inactivo' : 'Activo';

    await ejecutar(
      `
        UPDATE clientes
        SET estado = ?
        WHERE id_cliente = ?
      `,
      [estadoNuevo, id]
    );

    return res.json({
      mensaje: `Cliente actualizado a ${estadoNuevo}.`,
      estado: estadoNuevo,
    });
  } catch (error) {
    console.log('Error al actualizar cliente:', error);

    return res.status(500).json({
      mensaje: 'Error al actualizar cliente.',
      error: error.message || error,
    });
  }
});

module.exports = router;
