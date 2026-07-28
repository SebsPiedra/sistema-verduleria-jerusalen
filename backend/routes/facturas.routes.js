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

router.get('/', async (req, res) => {
  try {
    const resultadoVentas = await ejecutar(`
      SELECT
        v.id_venta,
        v.id_cliente,
        COALESCE(v.cliente, c.nombre, 'Cliente general') AS cliente,
        COALESCE(v.numero_factura, 'FAC-' || LPAD(v.id_venta::TEXT, 6, '0')) AS numero_factura,
        COALESCE(v.total, 0) AS total,
        COALESCE(v.metodo_pago, 'Efectivo') AS metodo_pago,
        COALESCE(v.estado, 'Completada') AS estado,
        v.observacion,
        v.fecha_venta,
        c.correo AS correo_cliente,
        c.telefono AS telefono_cliente
      FROM ventas v
      LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
      ORDER BY v.id_venta DESC
    `);

    const ventas = obtenerFilas(resultadoVentas);

    const ids = ventas
      .map((venta) => Number(venta.id_venta))
      .filter((id) => id > 0);

    let detallesPorVenta = {};

    if (ids.length > 0) {
      const marcas = ids.map(() => '?').join(',');

      const resultadoDetalles = await ejecutar(
        `
          SELECT
            dv.id_detalle,
            dv.id_venta,
            dv.id_producto,
            COALESCE(dv.nombre_producto, dv.producto, p.nombre, 'Producto') AS nombre_producto,
            COALESCE(dv.producto, dv.nombre_producto, p.nombre, 'Producto') AS producto,
            COALESCE(dv.cantidad, 0) AS cantidad,
            COALESCE(dv.precio_unitario, 0) AS precio_unitario,
            COALESCE(dv.subtotal, COALESCE(dv.cantidad, 0) * COALESCE(dv.precio_unitario, 0)) AS subtotal,
            p.unidad_medida
          FROM detalle_ventas dv
          LEFT JOIN productos p ON p.id_producto = dv.id_producto
          WHERE dv.id_venta IN (${marcas})
          ORDER BY dv.id_venta DESC, dv.id_detalle ASC
        `,
        ids
      );

      const detalles = obtenerFilas(resultadoDetalles);

      detalles.forEach((detalle) => {
        const idVenta = Number(detalle.id_venta);

        if (!detallesPorVenta[idVenta]) {
          detallesPorVenta[idVenta] = [];
        }

        detallesPorVenta[idVenta].push(detalle);
      });
    }

    const respuesta = ventas.map((venta) => ({
      ...venta,
      factura: venta.numero_factura,
      detalles: detallesPorVenta[Number(venta.id_venta)] || [],
    }));

    res.json(respuesta);
  } catch (error) {
    console.log('ERROR GET /facturas:', error);

    res.status(500).json({
      mensaje: 'Error al cargar facturas',
      error: error.message || error,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const idVenta = Number(req.params.id);

    if (!idVenta) {
      return res.status(400).json({
        mensaje: 'ID de factura inválido',
      });
    }

    const resultadoVenta = await ejecutar(
      `
        SELECT
          v.id_venta,
          v.id_cliente,
          COALESCE(v.cliente, c.nombre, 'Cliente general') AS cliente,
          COALESCE(v.numero_factura, 'FAC-' || LPAD(v.id_venta::TEXT, 6, '0')) AS numero_factura,
          COALESCE(v.total, 0) AS total,
          COALESCE(v.metodo_pago, 'Efectivo') AS metodo_pago,
          COALESCE(v.estado, 'Completada') AS estado,
          v.observacion,
          v.fecha_venta,
          c.correo AS correo_cliente,
          c.telefono AS telefono_cliente
        FROM ventas v
        LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
        WHERE v.id_venta = ?
        LIMIT 1
      `,
      [idVenta]
    );

    const venta = obtenerPrimero(resultadoVenta);

    if (!venta) {
      return res.status(404).json({
        mensaje: 'Factura no encontrada',
      });
    }

    const resultadoDetalle = await ejecutar(
      `
        SELECT
          dv.id_detalle,
          dv.id_venta,
          dv.id_producto,
          COALESCE(dv.nombre_producto, dv.producto, p.nombre, 'Producto') AS nombre_producto,
          COALESCE(dv.producto, dv.nombre_producto, p.nombre, 'Producto') AS producto,
          COALESCE(dv.cantidad, 0) AS cantidad,
          COALESCE(dv.precio_unitario, 0) AS precio_unitario,
          COALESCE(dv.subtotal, COALESCE(dv.cantidad, 0) * COALESCE(dv.precio_unitario, 0)) AS subtotal,
          p.unidad_medida
        FROM detalle_ventas dv
        LEFT JOIN productos p ON p.id_producto = dv.id_producto
        WHERE dv.id_venta = ?
        ORDER BY dv.id_detalle ASC
      `,
      [idVenta]
    );

    const detalles = obtenerFilas(resultadoDetalle);

    res.json({
      ...venta,
      factura: venta.numero_factura,
      detalles,
    });
  } catch (error) {
    console.log('ERROR GET /facturas/:id:', error);

    res.status(500).json({
      mensaje: 'Error al cargar detalle de factura',
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
            precio,
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
        productoBD.precio ||
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

    const resultadoVenta = await ejecutar(
      `
        INSERT INTO ventas
        (id_cliente, cliente, total, metodo_pago, fecha_venta, estado, observacion)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'Completada', ?)
        RETURNING id_venta
      `,
      [
        id_cliente || null,
        cliente || 'Cliente general',
        totalVenta,
        metodo_pago || 'Efectivo',
        observacion || '',
      ]
    );

    const ventaCreada = obtenerPrimero(resultadoVenta);
    const idVenta = Number(ventaCreada?.id_venta || resultadoVenta?.insertId);

    if (!idVenta) {
      return res.status(500).json({
        mensaje: 'No se pudo obtener el ID de la venta.',
      });
    }

    const numeroFactura = generarFactura(idVenta);

    await ejecutar(
      `
        UPDATE ventas
        SET numero_factura = ?
        WHERE id_venta = ?
      `,
      [numeroFactura, idVenta]
    );

    for (const item of detallesVenta) {
      await ejecutar(
        `
          INSERT INTO detalle_ventas
          (id_venta, id_producto, producto, nombre_producto, cantidad, precio_unitario, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          idVenta,
          item.id_producto,
          item.producto,
          item.nombre_producto,
          item.cantidad,
          item.precio_unitario,
          item.subtotal,
        ]
      );

      await ejecutar(
        `
          UPDATE productos
          SET
            cantidad = GREATEST(COALESCE(cantidad, stock, 0) - ?, 0),
            stock = CEIL(GREATEST(COALESCE(cantidad, stock, 0) - ?, 0))::INTEGER
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
    console.log('ERROR POST /facturas:', error);

    res.status(500).json({
      mensaje: 'No se pudo registrar la venta.',
      error: error.message || error,
    });
  }
});

module.exports = router;