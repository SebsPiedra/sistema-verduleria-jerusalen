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
        COALESCE(v.subtotal_productos, v.total, 0) AS subtotal_productos,
        COALESCE(v.costo_envio, 0) AS costo_envio,
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
          COALESCE(v.subtotal_productos, v.total, 0) AS subtotal_productos,
          COALESCE(v.costo_envio, 0) AS costo_envio,
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
    });
  }
});

module.exports = router;
