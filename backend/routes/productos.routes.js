const express = require('express');
const conexion = require('../db');

const router = express.Router();

// Listar productos
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      p.id_producto,
      p.nombre,
      p.cantidad,
      p.precio_compra,
      p.precio_venta,
      p.stock_minimo,
      p.unidad_medida,
      p.estado,
      p.id_proveedor,
      pr.nombre AS proveedor
    FROM productos p
    LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
    ORDER BY p.nombre ASC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener productos',
        error
      });
    }

    res.json(resultados);
  });
});

// Obtener producto por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      p.id_producto,
      p.nombre,
      p.cantidad,
      p.precio_compra,
      p.precio_venta,
      p.stock_minimo,
      p.unidad_medida,
      p.estado,
      p.id_proveedor,
      pr.nombre AS proveedor
    FROM productos p
    LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
    WHERE p.id_producto = ?
  `;

  conexion.query(sql, [id], (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener producto',
        error
      });
    }

    if (resultados.length === 0) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      });
    }

    res.json(resultados[0]);
  });
});

// Registrar producto
router.post('/', (req, res) => {
  const {
    nombre,
    cantidad,
    precio_compra,
    precio_venta,
    stock_minimo,
    unidad_medida,
    id_proveedor
  } = req.body;

  if (!nombre) {
    return res.status(400).json({
      mensaje: 'Debe ingresar el nombre del producto'
    });
  }

  if (!id_proveedor) {
    return res.status(400).json({
      mensaje: 'Debe seleccionar un proveedor'
    });
  }

  const sql = `
    INSERT INTO productos
    (
      nombre,
      cantidad,
      precio_compra,
      precio_venta,
      stock_minimo,
      unidad_medida,
      id_proveedor,
      estado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Activo')
  `;

  conexion.query(
    sql,
    [
      nombre,
      Number(cantidad || 0),
      Number(precio_compra || 0),
      Number(precio_venta || 0),
      Number(stock_minimo || 5),
      unidad_medida || 'kg',
      id_proveedor
    ],
    (error, resultado) => {
      if (error) {
        return res.status(500).json({
          mensaje: 'Error al registrar producto',
          error
        });
      }

      res.json({
        mensaje: 'Producto registrado correctamente',
        id_producto: resultado.insertId
      });
    }
  );
});

// Editar producto
router.put('/:id', (req, res) => {
  const { id } = req.params;

  const {
    nombre,
    cantidad,
    precio_compra,
    precio_venta,
    stock_minimo,
    unidad_medida,
    id_proveedor,
    estado
  } = req.body;

  if (!nombre) {
    return res.status(400).json({
      mensaje: 'Debe ingresar el nombre del producto'
    });
  }

  if (!id_proveedor) {
    return res.status(400).json({
      mensaje: 'Debe seleccionar un proveedor'
    });
  }

  const sql = `
    UPDATE productos
    SET 
      nombre = ?,
      cantidad = ?,
      precio_compra = ?,
      precio_venta = ?,
      stock_minimo = ?,
      unidad_medida = ?,
      id_proveedor = ?,
      estado = ?
    WHERE id_producto = ?
  `;

  conexion.query(
    sql,
    [
      nombre,
      Number(cantidad || 0),
      Number(precio_compra || 0),
      Number(precio_venta || 0),
      Number(stock_minimo || 5),
      unidad_medida || 'kg',
      id_proveedor,
      estado || 'Activo',
      id
    ],
    (error, resultado) => {
      if (error) {
        return res.status(500).json({
          mensaje: 'Error al editar producto',
          error
        });
      }

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          mensaje: 'Producto no encontrado'
        });
      }

      res.json({
        mensaje: 'Producto actualizado correctamente'
      });
    }
  );
});

// Aumentar inventario
router.patch('/:id/aumentar', (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;

  if (!cantidad || Number(cantidad) <= 0) {
    return res.status(400).json({
      mensaje: 'Debe ingresar una cantidad válida'
    });
  }

  const sql = `
    UPDATE productos
    SET cantidad = cantidad + ?
    WHERE id_producto = ?
  `;

  conexion.query(sql, [Number(cantidad), id], (error, resultado) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al aumentar inventario',
        error
      });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      });
    }

    res.json({
      mensaje: 'Inventario aumentado correctamente'
    });
  });
});

// Disminuir inventario
router.patch('/:id/disminuir', (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;

  if (!cantidad || Number(cantidad) <= 0) {
    return res.status(400).json({
      mensaje: 'Debe ingresar una cantidad válida'
    });
  }

  const sql = `
    UPDATE productos
    SET cantidad = cantidad - ?
    WHERE id_producto = ?
      AND cantidad >= ?
  `;

  conexion.query(sql, [Number(cantidad), id, Number(cantidad)], (error, resultado) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al disminuir inventario',
        error
      });
    }

    if (resultado.affectedRows === 0) {
      return res.status(400).json({
        mensaje: 'No hay suficiente inventario o el producto no existe'
      });
    }

    res.json({
      mensaje: 'Inventario disminuido correctamente'
    });
  });
});

module.exports = router;