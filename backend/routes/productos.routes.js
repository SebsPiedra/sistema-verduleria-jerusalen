const express = require('express');
const conexion = require('../db');
const {
  agregarCategoriaProducto,
  obtenerCategoriaProducto
} = require('../utils/productos');
const { cantidadValidaParaUnidad } = require('../utils/unidades');

const router = express.Router();
const UNIDADES_PERMITIDAS = new Set(['kg', 'unidad', 'bolsa', 'caja', 'litro', 'paquete']);
const ESTADOS_PERMITIDOS = new Set(['Activo', 'Inactivo']);
const LIMITE_CANTIDAD = 1000000;
const LIMITE_PRECIO = 100000000;

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

const validarDatosProducto = ({
  nombre,
  cantidad,
  precio_compra,
  precio_venta,
  stock_minimo,
  unidad_medida,
  id_proveedor,
  imagen_url,
  estado,
}) => {
  const nombreFinal = String(nombre || '').trim();
  const unidadFinal = String(unidad_medida || 'kg').trim().toLowerCase();
  const estadoFinal = String(estado || 'Activo').trim();
  const precioCompra = Number(precio_compra);
  const precioVenta = Number(precio_venta);
  const proveedorFinal = normalizarId(id_proveedor);
  const imagenUrlFinal = String(imagen_url || '').trim();

  if (nombreFinal.length < 2 || nombreFinal.length > 100) {
    return { error: 'El nombre del producto debe tener entre 2 y 100 caracteres.' };
  }
  if (!UNIDADES_PERMITIDAS.has(unidadFinal)) {
    return { error: 'Debe seleccionar una unidad de medida válida.' };
  }
  if (
    !cantidadValidaParaUnidad(cantidad, unidadFinal, true) ||
    !cantidadValidaParaUnidad(stock_minimo, unidadFinal, true) ||
    Number(cantidad) > LIMITE_CANTIDAD ||
    Number(stock_minimo) > LIMITE_CANTIDAD
  ) {
    return { error: `La cantidad y el stock mínimo no son válidos para ${unidadFinal}.` };
  }
  if (
    !Number.isFinite(precioCompra) || precioCompra < 0 || precioCompra > LIMITE_PRECIO ||
    !Number.isFinite(precioVenta) || precioVenta <= 0 || precioVenta > LIMITE_PRECIO
  ) {
    return { error: 'Ingrese precios válidos y mayores que cero para la venta.' };
  }
  if (precioVenta < precioCompra) {
    return { error: 'El precio de venta no puede ser menor que el precio de compra.' };
  }
  if (proveedorFinal !== null && (!Number.isSafeInteger(proveedorFinal) || proveedorFinal <= 0)) {
    return { error: 'El proveedor seleccionado no es válido.' };
  }
  if (imagenUrlFinal && (imagenUrlFinal.length > 2048 || !/^https:\/\//i.test(imagenUrlFinal))) {
    return { error: 'La imagen debe ser un enlace HTTPS válido.' };
  }
  if (!ESTADOS_PERMITIDOS.has(estadoFinal)) {
    return { error: 'El estado del producto no es válido.' };
  }

  return {
    datos: {
      nombreFinal,
      unidadFinal,
      precioCompra,
      precioVenta,
      proveedorFinal,
      imagenUrlFinal: imagenUrlFinal || null,
      estadoFinal,
    },
  };
};

const cantidadAjusteValida = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 && numero <= LIMITE_CANTIDAD &&
    Math.abs(numero * 100 - Math.round(numero * 100)) < 1e-8;
};

const idValido = (valor) => Number.isSafeInteger(Number(valor)) && Number(valor) > 0;

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
        mensaje: 'Error al obtener productos'
      });
    }

    res.json(resultados.map(agregarCategoriaProducto));
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
        mensaje: 'Error al obtener productos con stock bajo'
      });
    }

    res.json(resultados.map(agregarCategoriaProducto));
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
        mensaje: 'Error al obtener alertas de productos'
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
  if (!idValido(id)) {
    return res.status(400).json({ mensaje: 'El producto indicado no es válido.' });
  }

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
        mensaje: 'Error al obtener producto'
      });
    }

    if (resultados.length === 0) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      });
    }

    res.json(agregarCategoriaProducto(resultados[0]));
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

  const validacion = validarDatosProducto(req.body);
  if (validacion.error) return res.status(400).json({ mensaje: validacion.error });
  const { nombreFinal, unidadFinal, precioCompra, precioVenta, proveedorFinal, imagenUrlFinal, estadoFinal } = validacion.datos;

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

  conexion.query(
    'SELECT id_producto FROM productos WHERE LOWER(TRIM(nombre)) = LOWER(?) LIMIT 1',
    [nombreFinal],
    (errorDuplicado, duplicados) => {
      if (errorDuplicado) {
        return res.status(500).json({ mensaje: 'Error al validar el producto' });
      }

      if (duplicados.length > 0) {
        return res.status(409).json({
          mensaje: 'Ya existe un producto con ese nombre'
        });
      }

      conexion.query(
        sql,
        [
          nombreFinal,
          normalizarNumero(cantidad, 0),
          precioCompra,
          precioVenta,
          normalizarNumero(stock_minimo, 5),
          unidadFinal,
          proveedorFinal,
          imagenUrlFinal,
          imagenUrlFinal,
          estadoFinal
        ],
        (error, resultado) => {
          if (error) {
            return res.status(500).json({
              mensaje: 'Error al registrar producto'
            });
          }

          res.json({
            mensaje: 'Producto registrado correctamente',
            id_producto: resultado.insertId,
            categoria: obtenerCategoriaProducto(nombreFinal)
          });
        }
      );
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

  const idProducto = Number(id);
  if (!Number.isSafeInteger(idProducto) || idProducto <= 0) {
    return res.status(400).json({ mensaje: 'El producto indicado no es válido.' });
  }
  const validacion = validarDatosProducto(req.body);
  if (validacion.error) return res.status(400).json({ mensaje: validacion.error });
  const { nombreFinal, unidadFinal, precioCompra, precioVenta, proveedorFinal, imagenUrlFinal, estadoFinal } = validacion.datos;

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
    'SELECT id_producto FROM productos WHERE LOWER(TRIM(nombre)) = LOWER(?) AND id_producto <> ? LIMIT 1',
    [nombreFinal, idProducto],
    (errorDuplicado, duplicados) => {
      if (errorDuplicado) {
        return res.status(500).json({ mensaje: 'Error al validar el producto' });
      }

      if (duplicados.length > 0) {
        return res.status(409).json({
          mensaje: 'Ya existe un producto con ese nombre'
        });
      }

      conexion.query(
        sql,
        [
          nombreFinal,
          normalizarNumero(cantidad, 0),
          precioCompra,
          precioVenta,
          normalizarNumero(stock_minimo, 5),
          unidadFinal,
          proveedorFinal,
          imagenUrlFinal,
          imagenUrlFinal,
          estadoFinal,
          idProducto
        ],
        (error, resultado) => {
          if (error) {
            return res.status(500).json({
              mensaje: 'Error al editar producto'
            });
          }

          if (resultado.affectedRows === 0) {
            return res.status(404).json({
              mensaje: 'Producto no encontrado'
            });
          }

          res.json({
            mensaje: 'Producto actualizado correctamente',
            categoria: obtenerCategoriaProducto(nombreFinal)
          });
        }
      );
    }
  );
});

// Aumentar inventario
router.patch('/:id/aumentar', (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;

  if (!idValido(id) || !cantidadAjusteValida(cantidad)) {
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
        mensaje: 'Error al aumentar inventario'
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

  if (!idValido(id) || !cantidadAjusteValida(cantidad)) {
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
        mensaje: 'Error al disminuir inventario'
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
