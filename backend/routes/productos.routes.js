const express = require('express');
const conexion = require('../db');

const router = express.Router();

// Obtener todos los productos
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      p.id_producto,
      p.nombre,
      c.nombre AS categoria,
      pr.nombre AS proveedor,
      p.precio_compra,
      p.precio_venta,
      p.cantidad,
      p.stock_minimo,
      p.unidad_medida,
      p.fecha_vencimiento,
      p.estado
    FROM productos p
    LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
    LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
    ORDER BY p.nombre
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

// Productos con stock bajo o faltantes
router.get('/stock-bajo', (req, res) => {
  const sql = `
    SELECT 
      id_producto,
      nombre,
      precio_venta,
      cantidad,
      stock_minimo,
      unidad_medida,
      estado
    FROM productos
    WHERE cantidad <= stock_minimo
    ORDER BY cantidad ASC, nombre ASC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener productos con stock bajo',
        error
      });
    }

    res.json(resultados);
  });
});

// Alertas generales del sistema
router.get('/alertas', (req, res) => {
  const sqlStockBajo = `
    SELECT id_producto, nombre, cantidad, stock_minimo, unidad_medida
    FROM productos
    WHERE cantidad <= stock_minimo
    ORDER BY cantidad ASC
  `;

  const sqlSinPrecio = `
    SELECT id_producto, nombre, precio_compra, precio_venta
    FROM productos
    WHERE precio_compra = 0 OR precio_venta = 0
    ORDER BY nombre ASC
  `;

  const sqlProximosVencer = `
    SELECT id_producto, nombre, fecha_vencimiento, cantidad, unidad_medida
    FROM productos
    WHERE fecha_vencimiento IS NOT NULL
      AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    ORDER BY fecha_vencimiento ASC
  `;

  conexion.query(sqlStockBajo, (errorStock, stockBajo) => {
    if (errorStock) {
      return res.status(500).json({
        mensaje: 'Error al obtener alertas de stock',
        error: errorStock
      });
    }

    conexion.query(sqlSinPrecio, (errorPrecio, sinPrecio) => {
      if (errorPrecio) {
        return res.status(500).json({
          mensaje: 'Error al obtener alertas de precios',
          error: errorPrecio
        });
      }

      conexion.query(sqlProximosVencer, (errorVencer, proximosVencer) => {
        if (errorVencer) {
          return res.status(500).json({
            mensaje: 'Error al obtener alertas de vencimiento',
            error: errorVencer
          });
        }

        res.json({
          resumen: {
            stock_bajo: stockBajo.length,
            sin_precio: sinPrecio.length,
            proximos_vencer: proximosVencer.length
          },
          stock_bajo: stockBajo,
          sin_precio: sinPrecio,
          proximos_vencer: proximosVencer
        });
      });
    });
  });
});

// Obtener un producto por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      id_producto,
      nombre,
      id_categoria,
      id_proveedor,
      precio_compra,
      precio_venta,
      cantidad,
      stock_minimo,
      unidad_medida,
      fecha_vencimiento,
      estado
    FROM productos
    WHERE id_producto = ?
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
    id_categoria,
    id_proveedor,
    precio_compra,
    precio_venta,
    cantidad,
    stock_minimo,
    unidad_medida,
    fecha_vencimiento
  } = req.body;

  if (
    !nombre ||
    precio_compra === undefined ||
    precio_venta === undefined ||
    cantidad === undefined
  ) {
    return res.status(400).json({
      mensaje: 'Faltan datos obligatorios del producto'
    });
  }

  const sql = `
    INSERT INTO productos 
    (
      nombre, 
      id_categoria, 
      id_proveedor, 
      precio_compra, 
      precio_venta, 
      cantidad, 
      stock_minimo, 
      unidad_medida, 
      fecha_vencimiento
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  conexion.query(
    sql,
    [
      nombre,
      id_categoria || 6,
      id_proveedor || 1,
      precio_compra,
      precio_venta,
      cantidad,
      stock_minimo || 5,
      unidad_medida || 'kg',
      fecha_vencimiento || null
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
    precio_compra,
    precio_venta,
    cantidad,
    stock_minimo,
    unidad_medida,
    fecha_vencimiento,
    estado
  } = req.body;

  if (
    !nombre ||
    precio_compra === undefined ||
    precio_venta === undefined ||
    cantidad === undefined
  ) {
    return res.status(400).json({
      mensaje: 'Faltan datos obligatorios para editar el producto'
    });
  }

  const sql = `
    UPDATE productos
    SET 
      nombre = ?,
      precio_compra = ?,
      precio_venta = ?,
      cantidad = ?,
      stock_minimo = ?,
      unidad_medida = ?,
      fecha_vencimiento = ?,
      estado = ?
    WHERE id_producto = ?
  `;

  conexion.query(
    sql,
    [
      nombre,
      precio_compra,
      precio_venta,
      cantidad,
      stock_minimo || 5,
      unidad_medida || 'kg',
      fecha_vencimiento || null,
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

// Aumentar inventario rápido
router.patch('/:id/aumentar', (req, res) => {
  const { id } = req.params;
  const cantidad = Number(req.body.cantidad || 1);

  if (cantidad <= 0) {
    return res.status(400).json({
      mensaje: 'La cantidad debe ser mayor a cero'
    });
  }

  const sql = `
    UPDATE productos
    SET cantidad = cantidad + ?
    WHERE id_producto = ?
  `;

  conexion.query(sql, [cantidad, id], (error, resultado) => {
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

// Disminuir inventario rápido
router.patch('/:id/disminuir', (req, res) => {
  const { id } = req.params;
  const cantidad = Number(req.body.cantidad || 1);

  if (cantidad <= 0) {
    return res.status(400).json({
      mensaje: 'La cantidad debe ser mayor a cero'
    });
  }

  const sqlValidar = `
    SELECT cantidad
    FROM productos
    WHERE id_producto = ?
  `;

  conexion.query(sqlValidar, [id], (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al validar inventario',
        error
      });
    }

    if (resultados.length === 0) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      });
    }

    if (Number(resultados[0].cantidad) < cantidad) {
      return res.status(400).json({
        mensaje: 'No se puede disminuir más de la cantidad disponible'
      });
    }

    const sqlActualizar = `
      UPDATE productos
      SET cantidad = cantidad - ?
      WHERE id_producto = ?
    `;

    conexion.query(sqlActualizar, [cantidad, id], (errorActualizar) => {
      if (errorActualizar) {
        return res.status(500).json({
          mensaje: 'Error al disminuir inventario',
          error: errorActualizar
        });
      }

      res.json({
        mensaje: 'Inventario disminuido correctamente'
      });
    });
  });
});

module.exports = router;