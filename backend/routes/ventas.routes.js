const express = require('express');
const conexion = require('../db');

const router = express.Router();

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

function generarFactura(idVenta) {
  return `FAC-${String(idVenta).padStart(6, '0')}`;
}

async function obtenerSiguienteId(tabla, columna) {
  const resultado = await ejecutar(
    `SELECT COALESCE(MAX(${columna}), 0) + 1 AS siguiente FROM ${tabla}`
  );

  const fila = obtenerPrimero(resultado);

  return Number(fila?.siguiente || 1);
}

async function cargarDetalles(idsVentas) {
  if (!idsVentas.length) return {};

  const marcas = idsVentas.map(() => '?').join(',');

  const resultadoDetalles = await ejecutar(
    `
      SELECT
        id_detalle,
        id_venta,
        id_producto,
        COALESCE(nombre_producto, producto, 'Producto') AS nombre_producto,
        COALESCE(producto, nombre_producto, 'Producto') AS producto,
        COALESCE(cantidad, 0) AS cantidad,
        COALESCE(precio_unitario, 0) AS precio_unitario,
        COALESCE(subtotal, COALESCE(cantidad, 0) * COALESCE(precio_unitario, 0)) AS subtotal
      FROM detalle_ventas
      WHERE id_venta IN (${marcas})
      ORDER BY id_venta DESC, id_detalle ASC
    `,
    idsVentas
  );

  const detalles = obtenerFilas(resultadoDetalles);
  const mapa = {};

  detalles.forEach((detalle) => {
    const idVenta = Number(detalle.id_venta);

    if (!mapa[idVenta]) {
      mapa[idVenta] = [];
    }

    mapa[idVenta].push(detalle);
  });

  return mapa;
}

router.get('/', async (req, res) => {
  try {
    const resultadoVentas = await ejecutar(`
      SELECT
        id_venta,
        id_cliente,
        COALESCE(cliente, 'Cliente general') AS cliente,
        COALESCE(numero_factura, '') AS numero_factura,
        COALESCE(total, 0) AS total,
        COALESCE(metodo_pago, 'Efectivo') AS metodo_pago,
        COALESCE(estado, 'Completada') AS estado,
        observacion,
        fecha_venta
      FROM ventas
      ORDER BY id_venta DESC
    `);

    const ventas = obtenerFilas(resultadoVentas);

    const idsVentas = ventas
      .map((venta) => Number(venta.id_venta))
      .filter((id) => id > 0);

    const detallesPorVenta = await cargarDetalles(idsVentas);

    const respuesta = ventas.map((venta) => {
      const idVenta = Number(venta.id_venta);

      return {
        ...venta,
        numero_factura: venta.numero_factura || generarFactura(idVenta),
        factura: venta.numero_factura || generarFactura(idVenta),
        detalles: detallesPorVenta[idVenta] || [],
      };
    });

    res.json(respuesta);
  } catch (error) {
    console.log('ERROR GET /ventas:', error);

    res.status(500).json({
      mensaje: 'Error al cargar ventas',
      error: error.message || error,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const idVenta = Number(req.params.id);

    if (!idVenta) {
      return res.status(400).json({
        mensaje: 'ID de venta inválido',
      });
    }

    const resultadoVenta = await ejecutar(
      `
        SELECT
          id_venta,
          id_cliente,
          COALESCE(cliente, 'Cliente general') AS cliente,
          COALESCE(numero_factura, '') AS numero_factura,
          COALESCE(total, 0) AS total,
          COALESCE(metodo_pago, 'Efectivo') AS metodo_pago,
          COALESCE(estado, 'Completada') AS estado,
          observacion,
          fecha_venta
        FROM ventas
        WHERE id_venta = ?
        LIMIT 1
      `,
      [idVenta]
    );

    const venta = obtenerPrimero(resultadoVenta);

    if (!venta) {
      return res.status(404).json({
        mensaje: 'Venta no encontrada',
      });
    }

    const detallesPorVenta = await cargarDetalles([idVenta]);

    res.json({
      ...venta,
      numero_factura: venta.numero_factura || generarFactura(idVenta),
      factura: venta.numero_factura || generarFactura(idVenta),
      detalles: detallesPorVenta[idVenta] || [],
    });
  } catch (error) {
    console.log('ERROR GET /ventas/:id:', error);

    res.status(500).json({
      mensaje: 'Error al cargar detalle de venta',
      error: error.message || error,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      cliente,
      id_cliente,
      metodo_pago,
      observacion,
      productos,
    } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        mensaje: 'Debe agregar al menos un producto a la venta.',
      });
    }

    let totalVenta = 0;
    const detallesVenta = [];

    for (const item of productos) {
      const idProducto = Number(item.id_producto);
      const cantidad = Number(item.cantidad);

      if (!idProducto || !cantidad || cantidad <= 0) {
        return res.status(400).json({
          mensaje: 'Hay un producto con cantidad inválida.',
        });
      }

      const resultadoProducto = await ejecutar(
        `
          SELECT
            id_producto,
            nombre,
            precio_venta,
            cantidad,
            stock,
            unidad_medida,
            estado
          FROM productos
          WHERE id_producto = ?
          LIMIT 1
        `,
        [idProducto]
      );

      const productoBD = obtenerPrimero(resultadoProducto);

      if (!productoBD) {
        return res.status(404).json({
          mensaje: `No se encontró el producto con ID ${idProducto}.`,
        });
      }

      if (String(productoBD.estado || 'Activo').toLowerCase() === 'inactivo') {
        return res.status(400).json({
          mensaje: `El producto ${productoBD.nombre} está inactivo.`,
        });
      }

      const disponible = Number(productoBD.cantidad ?? productoBD.stock ?? 0);

      if (cantidad > disponible) {
        return res.status(400).json({
          mensaje: `No hay suficiente inventario para ${productoBD.nombre}. Disponible: ${disponible}.`,
        });
      }

      const nombreProducto =
        item.nombre_producto ||
        item.producto ||
        item.nombre ||
        productoBD.nombre ||
        'Producto';

      const precioUnitario = Number(
        item.precio_unitario ||
        productoBD.precio_venta ||
        0
      );

      if (precioUnitario <= 0) {
        return res.status(400).json({
          mensaje: `El producto ${nombreProducto} no tiene precio válido.`,
        });
      }

      const subtotal = cantidad * precioUnitario;

      totalVenta += subtotal;

      detallesVenta.push({
        id_producto: idProducto,
        producto: nombreProducto,
        nombre_producto: nombreProducto,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal,
      });
    }

    const idVenta = await obtenerSiguienteId('ventas', 'id_venta');
    const numeroFactura = generarFactura(idVenta);

    await ejecutar(
      `
        INSERT INTO ventas
        (id_venta, id_cliente, cliente, numero_factura, total, metodo_pago, fecha_venta, estado, observacion)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Completada', ?)
      `,
      [
        idVenta,
        id_cliente || null,
        cliente || 'Cliente general',
        numeroFactura,
        totalVenta,
        metodo_pago || 'Efectivo',
        observacion || '',
      ]
    );

    let idDetalle = await obtenerSiguienteId('detalle_ventas', 'id_detalle');

    for (const item of detallesVenta) {
      await ejecutar(
        `
          INSERT INTO detalle_ventas
          (id_detalle, id_venta, id_producto, producto, nombre_producto, cantidad, precio_unitario, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          idDetalle,
          idVenta,
          item.id_producto,
          item.producto,
          item.nombre_producto,
          item.cantidad,
          item.precio_unitario,
          item.subtotal,
        ]
      );

      idDetalle += 1;

      await ejecutar(
        `
          UPDATE productos
          SET
            cantidad = GREATEST(COALESCE(cantidad, stock, 0) - ?, 0),
            stock = CAST(CEIL(GREATEST(COALESCE(cantidad, stock, 0) - ?, 0)) AS INTEGER)
          WHERE id_producto = ?
        `,
        [item.cantidad, item.cantidad, item.id_producto]
      );
    }

    res.json({
      mensaje: 'Venta registrada correctamente.',
      id_venta: idVenta,
      numero_factura: numeroFactura,
      factura: numeroFactura,
      cliente: cliente || 'Cliente general',
      metodo_pago: metodo_pago || 'Efectivo',
      total: totalVenta,
      detalles: detallesVenta,
    });
  } catch (error) {
    console.log('ERROR POST /ventas:', error);

    res.status(500).json({
      mensaje: 'No se pudo registrar la venta.',
      error: error.message || error,
    });
  }
});

module.exports = router;