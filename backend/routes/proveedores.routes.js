const express = require('express');
const conexion = require('../db');

const router = express.Router();

// Listar proveedores
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      id_proveedor,
      nombre,
      telefono,
      direccion
    FROM proveedores
    ORDER BY nombre ASC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener proveedores',
        error
      });
    }

    res.json(resultados);
  });
});

// Obtener proveedor por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      id_proveedor,
      nombre,
      telefono,
      direccion
    FROM proveedores
    WHERE id_proveedor = ?
  `;

  conexion.query(sql, [id], (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener proveedor',
        error
      });
    }

    if (resultados.length === 0) {
      return res.status(404).json({
        mensaje: 'Proveedor no encontrado'
      });
    }

    res.json(resultados[0]);
  });
});

// Registrar proveedor
router.post('/', (req, res) => {
  const { nombre, telefono, direccion } = req.body;

  if (!nombre) {
    return res.status(400).json({
      mensaje: 'Debe ingresar el nombre del proveedor'
    });
  }

  const sql = `
    INSERT INTO proveedores
    (nombre, telefono, direccion)
    VALUES (?, ?, ?)
  `;

  conexion.query(
    sql,
    [
      nombre,
      telefono || null,
      direccion || null
    ],
    (error, resultado) => {
      if (error) {
        return res.status(500).json({
          mensaje: 'Error al registrar proveedor',
          error
        });
      }

      res.json({
        mensaje: 'Proveedor registrado correctamente',
        id_proveedor: resultado.insertId
      });
    }
  );
});

// Editar proveedor
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, direccion } = req.body;

  if (!nombre) {
    return res.status(400).json({
      mensaje: 'Debe ingresar el nombre del proveedor'
    });
  }

  const sql = `
    UPDATE proveedores
    SET 
      nombre = ?,
      telefono = ?,
      direccion = ?
    WHERE id_proveedor = ?
  `;

  conexion.query(
    sql,
    [
      nombre,
      telefono || null,
      direccion || null,
      id
    ],
    (error, resultado) => {
      if (error) {
        return res.status(500).json({
          mensaje: 'Error al editar proveedor',
          error
        });
      }

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          mensaje: 'Proveedor no encontrado'
        });
      }

      res.json({
        mensaje: 'Proveedor actualizado correctamente'
      });
    }
  );
});

module.exports = router;