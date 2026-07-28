const express = require('express');
const jwt = require('jsonwebtoken');
const conexion = require('../db');
const obtenerVariables = require('../config/variables');

const router = express.Router();
const variables = obtenerVariables();

router.post('/login', (req, res) => {
  const { correo, clave } = req.body;

  if (!correo || !clave) {
    return res.status(400).json({
      mensaje: 'Debe ingresar correo y contraseña'
    });
  }

  const sql = `
    SELECT *
    FROM usuarios
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

    const usuario = resultados[0];

    const claveGuardada = usuario.clave || usuario.password;

    if (!claveGuardada || clave !== claveGuardada) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo || usuario.email,
        rol: usuario.rol || 'admin',
        tipo: 'admin'
      },
      variables.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Inicio de sesión correcto',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo || usuario.email,
        rol: usuario.rol || 'admin',
        tipo: 'admin'
      }
    });
  });
});

module.exports = router;