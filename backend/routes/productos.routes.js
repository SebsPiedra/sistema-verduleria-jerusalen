const express = require('express');
const conexion = require('../db');

const router = express.Router();

const normalizarNumero = (valor, defecto = 0) => {
  const numero = Number(valor);
  return Number.isNaN(numero) ? defecto : numero;
};

const normalizarId = (valor) => {
  if (!valor || valor === '' || valor === 'null') {
    return null;
  }

  return Number(valor);
};

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
      COALESCE(p.imagen_url, p.imagen) AS imagen_url,
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

// Productos con stock bajo
router.get('/stock-bajo', (req, res) => {
  const sql = `
    SELECT
      p.id_producto,
      p.nombre,
      p.cantidad,
      p.stock_minimo,
      p.unidad_medida,
      p.precio_venta,
      COALESCE(p.imagen_url, p.imagen) AS imagen_url,
      p.estado,
      pr.nombre AS proveedor
    FROM productos p
    LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
    WHERE p.cantidad <= p.stock_minimo
      AND COALESCE(p.estado, 'Activo') = 'Activo'
    ORDER BY p.cantidad ASC
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

// Alertas de productos
router.get('/alertas', (req, res) => {
  const sqlStockBajo = `
    SELECT
      id_producto,
      nombre,
      cantidad,
      stock_minimo,
      unidad_medida
    FROM productos
    WHERE cantidad <= stock_minimo
      AND COALESCE(estado, 'Activo') = 'Activo'
    ORDER BY cantidad ASC
  `;

  conexion.query(sqlStockBajo, (error, stockBajo) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener alertas de productos',
        error
      });
    }

    res.json({
      total_alertas: stockBajo.length,
      stock_bajo: stockBajo
    });
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
      COALESCE(p.imagen_url, p.imagen) AS imagen_url,
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
    id_proveedor,
    imagen_url,
    estado
  } = req.body;

  if (!nombre) {
    return res.status(400).json({
      mensaje: 'Debe ingresar el nombre del producto'
    });
  }

  const sql = `
    INSERT INTO productos (
      nombre,
      cantidad,
      precio_compra,
      precio_venta,
      stock_minimo,
      unidad_medida,
      id_proveedor,
      imagen_url,
      imagen,
      estado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const imagenUrlFinal = imagen_url || null;

  conexion.query(
    sql,
    [
      nombre,
      normalizarNumero(cantidad, 0),
      normalizarNumero(precio_compra, 0),
      normalizarNumero(precio_venta, 0),
      normalizarNumero(stock_minimo, 5),
      unidad_medida || 'kg',
      normalizarId(id_proveedor),
      imagenUrlFinal,
      imagenUrlFinal,
      estado || 'Activo'
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
    imagen_url,
    estado
  } = req.body;

  if (!nombre) {
    return res.status(400).json({
      mensaje: 'Debe ingresar el nombre del producto'
    });
  }

  const imagenUrlFinal = imagen_url || null;

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
      imagen_url = ?,
      imagen = ?,
      estado = ?
    WHERE id_producto = ?
  `;

  conexion.query(
    sql,
    [
      nombre,
      normalizarNumero(cantidad, 0),
      normalizarNumero(precio_compra, 0),
      normalizarNumero(precio_venta, 0),
      normalizarNumero(stock_minimo, 5),
      unidad_medida || 'kg',
      normalizarId(id_proveedor),
      imagenUrlFinal,
      imagenUrlFinal,
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