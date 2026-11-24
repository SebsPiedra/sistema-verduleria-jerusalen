const express = require('express');
const conexion = require('../db');

const router = express.Router();

const validarProveedor = ({ nombre, telefono, direccion }) => {
  const nombreFinal = String(nombre || '').trim();
  const telefonoFinal = String(telefono || '').trim();
  const direccionFinal = String(direccion || '').trim();

  if (nombreFinal.length < 2 || nombreFinal.length > 100) {
    return { error: 'El nombre del proveedor debe tener entre 2 y 100 caracteres.' };
  }
  if (telefonoFinal && !/^\+?[0-9\s-]{8,20}$/.test(telefonoFinal)) {
    return { error: 'Ingrese un teléfono válido.' };
  }
  if (direccionFinal.length > 300) {
    return { error: 'La dirección no puede superar 300 caracteres.' };
  }

  return { nombreFinal, telefonoFinal: telefonoFinal || null, direccionFinal: direccionFinal || null };
};

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
        mensaje: 'Error al obtener proveedores'
      });
    }

    res.json(resultados);
  });
});

// Obtener proveedor por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ mensaje: 'Proveedor no válido.' });
  }

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
        mensaje: 'Error al obtener proveedor'
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
  const validacion = validarProveedor(req.body);
  if (validacion.error) return res.status(400).json({ mensaje: validacion.error });
  const { nombreFinal, telefonoFinal, direccionFinal } = validacion;

  const sql = `
    INSERT INTO proveedores
    (nombre, telefono, direccion)
    VALUES (?, ?, ?)
  `;

  conexion.query(
    sql,
    [
      nombreFinal,
      telefonoFinal,
      direccionFinal
    ],
    (error, resultado) => {
      if (error) {
        return res.status(500).json({
          mensaje: 'Error al registrar proveedor'
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
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ mensaje: 'Proveedor no válido.' });
  }
  const validacion = validarProveedor(req.body);
  if (validacion.error) return res.status(400).json({ mensaje: validacion.error });
  const { nombreFinal, telefonoFinal, direccionFinal } = validacion;

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
      nombreFinal,
      telefonoFinal,
      direccionFinal,
      Number(id)
    ],
    (error, resultado) => {
      if (error) {
        return res.status(500).json({
          mensaje: 'Error al editar proveedor'
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
