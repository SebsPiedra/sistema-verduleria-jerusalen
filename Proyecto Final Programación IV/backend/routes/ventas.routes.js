const express = require('express');
const util = require('util');
const conexion = require('../db');

const router = express.Router();

const query = util.promisify(conexion.query).bind(conexion);
const beginTransaction = util.promisify(conexion.beginTransaction).bind(conexion);
const commit = util.promisify(conexion.commit).bind(conexion);
const rollback = util.promisify(conexion.rollback).bind(conexion);

// Registrar venta / factura interna
router.post('/', async (req, res) => {
  const { cliente, metodo_pago, productos, id_usuario } = req.body;

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      mensaje: 'Debe agregar al menos un producto a la venta'
    });
  }

  try {
    await beginTransaction();

    let total = 0;
    const detalles = [];

    for (const item of productos) {
      const idProducto = item.id_producto;
      const cantidadVendida = Number(item.cantidad);

      if (!idProducto || cantidadVendida <= 0) {
        await rollback();
        return res.status(400).json({
          mensaje: 'Datos de producto inválidos'
        });
      }

      const resultadoProducto = await query(
        `
        SELECT 
          id_producto,
          nombre,
          cantidad,
          precio_venta
        FROM productos
        WHERE id_producto = ?
        FOR UPDATE
        `,
        [idProducto]
      );

      if (resultadoProducto.length === 0) {
        await rollback();
        return res.status(404).json({
          mensaje: `Producto con ID ${idProducto} no encontrado`
        });
      }

      const producto = resultadoProducto[0];

      if (Number(producto.cantidad) < cantidadVendida) {
        await rollback();
        return res.status(400).json({
          mensaje: `No hay suficiente inventario para ${producto.nombre}`
        });
      }

      const precioUnitario = Number(producto.precio_venta);
      const subtotal = precioUnitario * cantidadVendida;

      total += subtotal;

      detalles.push({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        cantidad: cantidadVendida,
        precio_unitario: precioUnitario,
        subtotal
      });
    }

    const numeroFactura = `FAC-${Date.now()}`;

    const resultadoVenta = await query(
      `
      INSERT INTO ventas 
      (numero_factura, cliente, total, metodo_pago, id_usuario)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        numeroFactura,
        cliente || 'Cliente contado',
        total,
        metodo_pago || 'Efectivo',
        id_usuario || 1
      ]
    );

    const idVenta = resultadoVenta.insertId;

    for (const detalle of detalles) {
      await query(
        `
        INSERT INTO detalle_ventas
        (id_venta, id_producto, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          idVenta,
          detalle.id_producto,
          detalle.cantidad,
          detalle.precio_unitario,
          detalle.subtotal
        ]
      );

      await query(
        `
        UPDATE productos
        SET cantidad = cantidad - ?
        WHERE id_producto = ?
        `,
        [detalle.cantidad, detalle.id_producto]
      );
    }

    await commit();

    res.json({
      mensaje: 'Venta registrada correctamente',
      id_venta: idVenta,
      numero_factura: numeroFactura,
      cliente: cliente || 'Cliente contado',
      metodo_pago: metodo_pago || 'Efectivo',
      total,
      detalles
    });
  } catch (error) {
    await rollback();

    res.status(500).json({
      mensaje: 'Error al registrar la venta',
      error
    });
  }
});

// Listar ventas
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      v.id_venta,
      v.numero_factura,
      v.cliente,
      v.fecha_venta,
      v.total,
      v.metodo_pago,
      COUNT(d.id_detalle) AS cantidad_productos
    FROM ventas v
    LEFT JOIN detalle_ventas d ON v.id_venta = d.id_venta
    GROUP BY 
      v.id_venta,
      v.numero_factura,
      v.cliente,
      v.fecha_venta,
      v.total,
      v.metodo_pago
    ORDER BY v.fecha_venta DESC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener ventas',
        error
      });
    }

    res.json(resultados);
  });
});

// Ver detalle de una factura
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const venta = await query(
      `
      SELECT 
        id_venta,
        numero_factura,
        cliente,
        fecha_venta,
        total,
        metodo_pago
      FROM ventas
      WHERE id_venta = ?
      `,
      [id]
    );

    if (venta.length === 0) {
      return res.status(404).json({
        mensaje: 'Venta no encontrada'
      });
    }

    const detalles = await query(
      `
      SELECT 
        d.id_detalle,
        d.id_producto,
        p.nombre,
        p.unidad_medida,
        d.cantidad,
        d.precio_unitario,
        d.subtotal
      FROM detalle_ventas d
      INNER JOIN productos p ON d.id_producto = p.id_producto
      WHERE d.id_venta = ?
      `,
      [id]
    );

    res.json({
      venta: venta[0],
      detalles
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener detalle de venta',
      error
    });
  }
});

module.exports = router;