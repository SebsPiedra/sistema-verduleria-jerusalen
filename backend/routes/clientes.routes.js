const express = require('express');
const jwt = require('jsonwebtoken');
const conexion = require('../db');
const obtenerVariables = require('../config/variables');

const router = express.Router();
const variables = obtenerVariables();

// Registrar cliente
router.post('/registrar', (req, res) => {
  const { nombre, telefono, correo, clave, direccion } = req.body;

  if (!nombre || !correo || !clave) {
    return res.status(400).json({
      mensaje: 'Debe ingresar nombre, correo y contraseña'
    });
  }

  const sqlValidar = `
    SELECT id_cliente
    FROM clientes
    WHERE LOWER(COALESCE(correo, email)) = LOWER(?)
    LIMIT 1
  `;

  conexion.query(sqlValidar, [correo], (errorValidar, resultados) => {
    if (errorValidar) {
      return res.status(500).json({
        mensaje: 'Error al validar cliente',
        error: errorValidar
      });
    }

    if (resultados.length > 0) {
      return res.status(400).json({
        mensaje: 'Ya existe un cliente registrado con ese correo'
      });
    }

    const sqlInsertar = `
      INSERT INTO clientes
      (nombre, telefono, correo, email, clave, direccion, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'Activo')
    `;

    conexion.query(
      sqlInsertar,
      [
        nombre,
        telefono || null,
        correo,
        correo,
        clave,
        direccion || null
      ],
      (error, resultado) => {
        if (error) {
          return res.status(500).json({
            mensaje: 'Error al registrar cliente',
            error
          });
        }

        res.json({
          mensaje: 'Cliente registrado correctamente',
          id_cliente: resultado.insertId
        });
      }
    );
  });
});

// Login cliente
router.post('/login', (req, res) => {
  const { correo, clave } = req.body;

  if (!correo || !clave) {
    return res.status(400).json({
      mensaje: 'Debe ingresar correo y contraseña'
    });
  }

  const sql = `
    SELECT *
    FROM clientes
    WHERE LOWER(COALESCE(correo, email)) = LOWER(?)
    LIMIT 1
  `;

  conexion.query(sql, [correo], (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error en el servidor',
        error
      });
    }

    if (resultados.length === 0) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const cliente = resultados[0];

    if (cliente.estado && cliente.estado !== 'Activo') {
      return res.status(401).json({
        mensaje: 'El cliente se encuentra inactivo'
      });
    }

    const claveGuardada = cliente.clave || cliente.password;

    if (!claveGuardada || clave !== claveGuardada) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      {
        id_cliente: cliente.id_cliente,
        correo: cliente.correo || cliente.email,
        tipo: 'cliente'
      },
      variables.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Inicio de sesión de cliente correcto',
      token,
      cliente: {
        id_cliente: cliente.id_cliente,
        nombre: cliente.nombre,
        correo: cliente.correo || cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        tipo: 'cliente'
      }
    });
  });
});

// Listar clientes
router.get('/', (req, res) => {
  const sql = `
    SELECT
      id_cliente,
      nombre,
      telefono,
      COALESCE(correo, email) AS correo,
      direccion,
      COALESCE(fecha_registro, fecha_creacion) AS fecha_registro,
      COALESCE(estado, 'Activo') AS estado
    FROM clientes
    ORDER BY COALESCE(fecha_registro, fecha_creacion) DESC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener clientes',
        error
      });
    }

    res.json(resultados);
  });
});

module.exports = router;