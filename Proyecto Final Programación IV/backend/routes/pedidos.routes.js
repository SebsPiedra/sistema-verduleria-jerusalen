const express = require('express');
const util = require('util');
const conexion = require('../db');

const router = express.Router();

const query = util.promisify(conexion.query).bind(conexion);
const beginTransaction = util.promisify(conexion.beginTransaction).bind(conexion);
const commit = util.promisify(conexion.commit).bind(conexion);
const rollback = util.promisify(conexion.rollback).bind(conexion);

const generarNumeroFacturaPedido = (idPedido) => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minuto = String(fecha.getMinutes()).padStart(2, '0');
  const segundo = String(fecha.getSeconds()).padStart(2, '0');

  return `FAC-PED-${idPedido}-${anio}${mes}${dia}${hora}${minuto}${segundo}`;
};

// Registrar pedido del cliente
router.post('/', async (req, res) => {
  const { id_cliente, metodo_pago, direccion_entrega, observacion, productos } = req.body;

  if (!id_cliente) {
    return res.status(400).json({
      mensaje: 'Debe indicar el cliente'
    });
  }

  if (!direccion_entrega) {
    return res.status(400).json({
      mensaje: 'Debe indicar la dirección de entrega'
    });
  }

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      mensaje: 'Debe agregar al menos un producto al pedido'
    });
  }

  try {
    await beginTransaction();

    let total = 0;
    const detalles = [];

    for (const item of productos) {
      const idProducto = item.id_producto;
      const cantidadPedida = Number(item.cantidad);

      if (!idProducto || cantidadPedida <= 0) {
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
          precio_venta,
          estado
        FROM productos
        WHERE id_producto = ?
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

      if (producto.estado !== 'Activo') {
        await rollback();
        return res.status(400).json({
          mensaje: `El producto ${producto.nombre} no está activo`
        });
      }

      if (Number(producto.cantidad) < cantidadPedida) {
        await rollback();
        return res.status(400).json({
          mensaje: `No hay suficiente inventario para ${producto.nombre}`
        });
      }

      const precioUnitario = Number(producto.precio_venta);
      const subtotal = precioUnitario * cantidadPedida;

      total += subtotal;

      detalles.push({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        cantidad: cantidadPedida,
        precio_unitario: precioUnitario,
        subtotal
      });
    }

    const resultadoPedido = await query(
      `
      INSERT INTO pedidos
      (id_cliente, total, estado, metodo_pago, direccion_entrega, observacion)
      VALUES (?, ?, 'Pendiente', ?, ?, ?)
      `,
      [
        id_cliente,
        total,
        metodo_pago || 'Efectivo',
        direccion_entrega,
        observacion || null
      ]
    );

    const idPedido = resultadoPedido.insertId;

    for (const detalle of detalles) {
      await query(
        `
        INSERT INTO detalle_pedidos
        (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          idPedido,
          detalle.id_producto,
          detalle.cantidad,
          detalle.precio_unitario,
          detalle.subtotal
        ]
      );
    }

    await commit();

    res.json({
      mensaje: 'Pedido registrado correctamente',
      id_pedido: idPedido,
      estado: 'Pendiente',
      direccion_entrega,
      total,
      detalles
    });
  } catch (error) {
    await rollback();

    res.status(500).json({
      mensaje: 'Error al registrar pedido',
      error
    });
  }
});

// Listar pedidos para administrador
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      p.id_pedido,
      p.fecha_pedido,
      p.total,
      p.estado,
      p.metodo_pago,
      p.direccion_entrega,
      p.observacion,
      p.inventario_descontado,
      p.id_venta,
      v.numero_factura,
      c.nombre AS cliente,
      c.telefono,
      c.correo,
      c.direccion AS direccion_registrada,
      COUNT(dp.id_detalle_pedido) AS cantidad_productos
    FROM pedidos p
    INNER JOIN clientes c ON p.id_cliente = c.id_cliente
    LEFT JOIN ventas v ON p.id_venta = v.id_venta
    LEFT JOIN detalle_pedidos dp ON p.id_pedido = dp.id_pedido
    GROUP BY 
      p.id_pedido,
      p.fecha_pedido,
      p.total,
      p.estado,
      p.metodo_pago,
      p.direccion_entrega,
      p.observacion,
      p.inventario_descontado,
      p.id_venta,
      v.numero_factura,
      c.nombre,
      c.telefono,
      c.correo,
      c.direccion
    ORDER BY p.fecha_pedido DESC
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener pedidos',
        error
      });
    }

    res.json(resultados);
  });
});

// Ver pedidos de un cliente
router.get('/cliente/:id_cliente', (req, res) => {
  const { id_cliente } = req.params;

  const sql = `
    SELECT 
      p.id_pedido,
      p.fecha_pedido,
      p.total,
      p.estado,
      p.metodo_pago,
      p.direccion_entrega,
      p.observacion,
      p.inventario_descontado,
      p.id_venta,
      v.numero_factura
    FROM pedidos p
    LEFT JOIN ventas v ON p.id_venta = v.id_venta
    WHERE p.id_cliente = ?
    ORDER BY p.fecha_pedido DESC
  `;

  conexion.query(sql, [id_cliente], (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener pedidos del cliente',
        error
      });
    }

    res.json(resultados);
  });
});

// Ver detalle de un pedido
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pedido = await query(
      `
      SELECT 
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        p.estado,
        p.metodo_pago,
        p.direccion_entrega,
        p.observacion,
        p.inventario_descontado,
        p.id_venta,
        v.numero_factura,
        c.id_cliente,
        c.nombre AS cliente,
        c.telefono,
        c.correo,
        c.direccion AS direccion_registrada
      FROM pedidos p
      INNER JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN ventas v ON p.id_venta = v.id_venta
      WHERE p.id_pedido = ?
      `,
      [id]
    );

    if (pedido.length === 0) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    const detalles = await query(
      `
      SELECT 
        dp.id_detalle_pedido,
        dp.id_producto,
        pr.nombre,
        pr.unidad_medida,
        dp.cantidad,
        dp.precio_unitario,
        dp.subtotal
      FROM detalle_pedidos dp
      INNER JOIN productos pr ON dp.id_producto = pr.id_producto
      WHERE dp.id_pedido = ?
      `,
      [id]
    );

    res.json({
      pedido: pedido[0],
      detalles
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener detalle del pedido',
      error
    });
  }
});

// Cambiar estado del pedido
router.patch('/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosPermitidos = ['Pendiente', 'Aceptado', 'Rechazado', 'Entregado', 'Cancelado'];

  if (!estado || !estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      mensaje: 'Estado no válido'
    });
  }

  try {
    await beginTransaction();

    const pedidoResultado = await query(
      `
      SELECT 
        p.id_pedido,
        p.id_cliente,
        p.estado,
        p.total,
        p.metodo_pago,
        p.direccion_entrega,
        p.inventario_descontado,
        p.id_venta,
        c.nombre AS cliente
      FROM pedidos p
      INNER JOIN clientes c ON p.id_cliente = c.id_cliente
      WHERE p.id_pedido = ?
      FOR UPDATE
      `,
      [id]
    );

    if (pedidoResultado.length === 0) {
      await rollback();
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    const pedido = pedidoResultado[0];

    if (estado === 'Aceptado') {
      const detalles = await query(
        `
        SELECT 
          dp.id_producto,
          dp.cantidad,
          dp.precio_unitario,
          dp.subtotal,
          pr.nombre,
          pr.cantidad AS cantidad_disponible
        FROM detalle_pedidos dp
        INNER JOIN productos pr ON dp.id_producto = pr.id_producto
        WHERE dp.id_pedido = ?
        FOR UPDATE
        `,
        [id]
      );

      if (detalles.length === 0) {
        await rollback();
        return res.status(400).json({
          mensaje: 'El pedido no tiene productos registrados'
        });
      }

      if (Number(pedido.inventario_descontado) === 0) {
        for (const detalle of detalles) {
          if (Number(detalle.cantidad_disponible) < Number(detalle.cantidad)) {
            await rollback();
            return res.status(400).json({
              mensaje: `No hay suficiente inventario para ${detalle.nombre}`
            });
          }
        }

        for (const detalle of detalles) {
          await query(
            `
            UPDATE productos
            SET cantidad = cantidad - ?
            WHERE id_producto = ?
            `,
            [detalle.cantidad, detalle.id_producto]
          );
        }
      }

      let idVenta = pedido.id_venta;
      let numeroFactura = null;

      if (!idVenta) {
        numeroFactura = generarNumeroFacturaPedido(id);

        const resultadoVenta = await query(
          `
          INSERT INTO ventas
          (numero_factura, cliente, total, metodo_pago, id_usuario)
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            numeroFactura,
            pedido.cliente,
            pedido.total,
            pedido.metodo_pago || 'Efectivo',
            1
          ]
        );

        idVenta = resultadoVenta.insertId;

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
        }
      }

      await query(
        `
        UPDATE pedidos
        SET 
          estado = ?,
          inventario_descontado = 1,
          id_venta = ?
        WHERE id_pedido = ?
        `,
        [estado, idVenta, id]
      );

      await commit();

      return res.json({
        mensaje: 'Pedido aceptado, inventario descontado y factura generada correctamente',
        estado,
        id_venta: idVenta,
        numero_factura: numeroFactura
      });
    }

    await query(
      `
      UPDATE pedidos
      SET estado = ?
      WHERE id_pedido = ?
      `,
      [estado, id]
    );

    await commit();

    res.json({
      mensaje: 'Estado del pedido actualizado correctamente',
      estado
    });
  } catch (error) {
    await rollback();

    res.status(500).json({
      mensaje: 'Error al actualizar estado del pedido',
      error
    });
  }
});

module.exports = router;