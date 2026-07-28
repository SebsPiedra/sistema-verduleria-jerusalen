const express = require('express');
const util = require('util');
const conexion = require('../db');

const router = express.Router();

const query = util.promisify(conexion.query).bind(conexion);
const beginTransaction = util.promisify(conexion.beginTransaction).bind(conexion);
const commit = util.promisify(conexion.commit).bind(conexion);
const rollback = util.promisify(conexion.rollback).bind(conexion);

const estadosPermitidos = [
  'Pendiente',
  'Aceptado',
  'En preparación',
  'En entrega',
  'Entregado',
  'Rechazado',
  'Cancelado',
];

const estadosQueGeneranVenta = [
  'Aceptado',
  'En preparación',
  'En entrega',
  'Entregado',
];

const formatoNumero = (valor) => {
  const numero = Number(valor || 0);
  return Number.isNaN(numero) ? 0 : numero;
};

const obtenerFilas = (resultado) => {
  if (Array.isArray(resultado)) return resultado;
  if (resultado?.rows) return resultado.rows;
  return [];
};

const obtenerPrimero = (resultado) => {
  const filas = obtenerFilas(resultado);
  return filas[0] || null;
};

const rollbackSeguro = async () => {
  try {
    await rollback();
  } catch (error) {
    console.log('Rollback no aplicado:', error.message);
  }
};

const obtenerSiguienteId = async (tabla, columna) => {
  const resultado = await query(
    `SELECT COALESCE(MAX(${columna}), 0) + 1 AS siguiente FROM ${tabla}`
  );

  const fila = obtenerPrimero(resultado);
  return Number(fila?.siguiente || 1);
};

const generarFactura = (idVenta) => {
  return `FAC-${String(idVenta).padStart(6, '0')}`;
};

const cargarDetallesPorPedidos = async (pedidos) => {
  if (!pedidos || pedidos.length === 0) {
    return [];
  }

  const ids = pedidos
    .map((pedido) => Number(pedido.id_pedido))
    .filter((id) => id > 0);

  if (ids.length === 0) {
    return [];
  }

  const placeholders = ids.map(() => '?').join(',');

  const resultadoDetalles = await query(
    `
      SELECT
        dp.id_detalle_pedido,
        dp.id_pedido,
        dp.id_producto,
        COALESCE(dp.nombre_producto, dp.producto, pr.nombre, 'Producto') AS nombre,
        COALESCE(dp.producto, dp.nombre_producto, pr.nombre, 'Producto') AS producto,
        COALESCE(dp.nombre_producto, dp.producto, pr.nombre, 'Producto') AS nombre_producto,
        pr.unidad_medida,
        COALESCE(pr.imagen_url, pr.imagen, '') AS imagen_url,
        COALESCE(dp.cantidad, 0) AS cantidad,
        COALESCE(dp.precio_unitario, pr.precio_venta, 0) AS precio_unitario,
        COALESCE(
          dp.subtotal,
          COALESCE(dp.cantidad, 0) * COALESCE(dp.precio_unitario, pr.precio_venta, 0)
        ) AS subtotal
      FROM detalle_pedidos dp
      LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
      WHERE dp.id_pedido IN (${placeholders})
      ORDER BY dp.id_pedido DESC, dp.id_detalle_pedido ASC
    `,
    ids
  );

  return obtenerFilas(resultadoDetalles);
};

const cargarPedidosConDetalles = async (condicion = '', parametros = []) => {
  const resultadoPedidos = await query(
    `
      SELECT
        p.id_pedido,
        p.id_cliente,
        p.id_venta,
        COALESCE(p.fecha_pedido, CURRENT_TIMESTAMP) AS fecha_pedido,
        COALESCE(p.total, 0) AS total,
        COALESCE(p.estado, 'Pendiente') AS estado,
        COALESCE(p.metodo_pago, 'Efectivo') AS metodo_pago,
        COALESCE(p.tipo_entrega, 'Entrega') AS tipo_entrega,
        COALESCE(p.direccion_entrega, '') AS direccion_entrega,
        COALESCE(p.observacion, '') AS observacion,
        COALESCE(p.inventario_descontado, 0) AS inventario_descontado,
        COALESCE(c.nombre, 'Cliente') AS cliente,
        c.telefono,
        COALESCE(c.correo, '') AS correo,
        c.direccion AS direccion_registrada,
        COALESCE(SUM(dp.cantidad), 0) AS cantidad_productos
      FROM pedidos p
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN detalle_pedidos dp ON p.id_pedido = dp.id_pedido
      ${condicion}
      GROUP BY
        p.id_pedido,
        p.id_cliente,
        p.id_venta,
        p.fecha_pedido,
        p.total,
        p.estado,
        p.metodo_pago,
        p.tipo_entrega,
        p.direccion_entrega,
        p.observacion,
        p.inventario_descontado,
        c.nombre,
        c.telefono,
        c.correo,
        c.direccion
      ORDER BY p.id_pedido DESC
    `,
    parametros
  );

  const pedidos = obtenerFilas(resultadoPedidos);
  const detalles = await cargarDetallesPorPedidos(pedidos);

  return pedidos.map((pedido) => ({
    ...pedido,
    detalles: detalles.filter(
      (detalle) => Number(detalle.id_pedido) === Number(pedido.id_pedido)
    ),
  }));
};

const crearVentaDesdePedido = async (pedido, detalles) => {
  if (pedido.id_venta) {
    return Number(pedido.id_venta);
  }

  const idVenta = await obtenerSiguienteId('ventas', 'id_venta');
  const numeroFactura = generarFactura(idVenta);

  await query(
    `
      INSERT INTO ventas
      (
        id_venta,
        id_cliente,
        cliente,
        numero_factura,
        total,
        metodo_pago,
        fecha_venta,
        estado,
        observacion
      )
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Completada', ?)
    `,
    [
      idVenta,
      pedido.id_cliente || null,
      pedido.cliente || 'Cliente general',
      numeroFactura,
      formatoNumero(pedido.total),
      pedido.metodo_pago || 'Efectivo',
      `Venta generada desde pedido #${pedido.id_pedido}`,
    ]
  );

  let idDetalle = await obtenerSiguienteId('detalle_ventas', 'id_detalle');

  for (const detalle of detalles) {
    await query(
      `
        INSERT INTO detalle_ventas
        (
          id_detalle,
          id_venta,
          id_producto,
          producto,
          nombre_producto,
          cantidad,
          precio_unitario,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        idDetalle,
        idVenta,
        detalle.id_producto,
        detalle.nombre || 'Producto',
        detalle.nombre || 'Producto',
        formatoNumero(detalle.cantidad),
        formatoNumero(detalle.precio_unitario),
        formatoNumero(detalle.subtotal),
      ]
    );

    idDetalle += 1;
  }

  return idVenta;
};

const cambiarEstadoPedido = async (req, res, estadoNuevo) => {
  const { id } = req.params;

  if (!estadoNuevo || !estadosPermitidos.includes(estadoNuevo)) {
    return res.status(400).json({
      mensaje: 'Estado no válido',
    });
  }

  try {
    await beginTransaction();

   const resultadoPedido = await query(
  `
    SELECT
      p.id_pedido,
      p.id_cliente,
      p.id_venta,
      p.estado,
      p.total,
      p.metodo_pago,
      p.observacion,
      COALESCE(p.inventario_descontado, 0) AS inventario_descontado,
      COALESCE(c.nombre, 'Cliente general') AS cliente
    FROM pedidos p
    LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
    WHERE p.id_pedido = ?
    FOR UPDATE OF p
  `,
  [id]
);

    const pedido = obtenerPrimero(resultadoPedido);

    if (!pedido) {
      await rollbackSeguro();
      return res.status(404).json({
        mensaje: 'Pedido no encontrado',
      });
    }

    const resultadoDetalles = await query(
      `
        SELECT
          dp.id_pedido,
          dp.id_producto,
          COALESCE(dp.cantidad, 0) AS cantidad,
          COALESCE(dp.precio_unitario, 0) AS precio_unitario,
          COALESCE(dp.subtotal, 0) AS subtotal,
          COALESCE(dp.nombre_producto, dp.producto, pr.nombre, 'Producto') AS nombre,
          COALESCE(pr.cantidad, pr.stock, 0) AS cantidad_disponible
        FROM detalle_pedidos dp
        INNER JOIN productos pr ON dp.id_producto = pr.id_producto
        WHERE dp.id_pedido = ?
      `,
      [id]
    );

    const detalles = obtenerFilas(resultadoDetalles);

    if (detalles.length === 0) {
      await rollbackSeguro();
      return res.status(400).json({
        mensaje: 'Este pedido no tiene productos registrados. No se puede cambiar el estado.',
      });
    }

    let idVentaGenerada = pedido.id_venta || null;

    const debeGenerarVenta = estadosQueGeneranVenta.includes(estadoNuevo);

    const debeDescontarInventario =
      estadosQueGeneranVenta.includes(estadoNuevo) &&
      Number(pedido.inventario_descontado) === 0;

    if (debeDescontarInventario) {
      for (const detalle of detalles) {
        const disponible = formatoNumero(detalle.cantidad_disponible);
        const solicitado = formatoNumero(detalle.cantidad);

        if (disponible < solicitado) {
          await rollbackSeguro();

          return res.status(400).json({
            mensaje: `No hay suficiente inventario para ${detalle.nombre}. Disponible: ${disponible}, solicitado: ${solicitado}`,
          });
        }
      }

      for (const detalle of detalles) {
        const cantidad = formatoNumero(detalle.cantidad);

        await query(
          `
            UPDATE productos
            SET
              cantidad = GREATEST(COALESCE(cantidad, stock, 0) - ?, 0),
              stock = CAST(CEIL(GREATEST(COALESCE(cantidad, stock, 0) - ?, 0)) AS INTEGER)
            WHERE id_producto = ?
          `,
          [cantidad, cantidad, detalle.id_producto]
        );
      }
    }

    if (debeGenerarVenta && !idVentaGenerada) {
      idVentaGenerada = await crearVentaDesdePedido(pedido, detalles);
    }

    if (
      ['Rechazado', 'Cancelado'].includes(estadoNuevo) &&
      Number(pedido.inventario_descontado) === 1
    ) {
      for (const detalle of detalles) {
        const cantidad = formatoNumero(detalle.cantidad);

        await query(
          `
            UPDATE productos
            SET
              cantidad = COALESCE(cantidad, 0) + ?,
              stock = COALESCE(stock, 0) + CAST(CEIL(CAST(? AS NUMERIC)) AS INTEGER)
            WHERE id_producto = ?
          `,
          [cantidad, cantidad, detalle.id_producto]
        );
      }

      if (pedido.id_venta) {
        await query(
          `
            UPDATE ventas
            SET estado = 'Cancelada'
            WHERE id_venta = ?
          `,
          [pedido.id_venta]
        );
      }

      await query(
        `
          UPDATE pedidos
          SET
            estado = ?,
            inventario_descontado = 0,
            id_venta = ?
          WHERE id_pedido = ?
        `,
        [estadoNuevo, idVentaGenerada, id]
      );
    } else {
      await query(
        `
          UPDATE pedidos
          SET
            estado = ?,
            inventario_descontado = ?,
            id_venta = ?
          WHERE id_pedido = ?
        `,
        [
          estadoNuevo,
          debeDescontarInventario ? 1 : Number(pedido.inventario_descontado || 0),
          idVentaGenerada,
          id,
        ]
      );
    }

    await commit();

    return res.json({
      mensaje: `Pedido actualizado a ${estadoNuevo}`,
      estado: estadoNuevo,
      id_venta: idVentaGenerada,
      numero_factura: idVentaGenerada ? generarFactura(idVentaGenerada) : null,
    });
  } catch (error) {
    await rollbackSeguro();

    console.log('Error al cambiar estado del pedido:', error);

    return res.status(500).json({
      mensaje: 'Error al cambiar el estado del pedido',
      error: error.message || error,
    });
  }
};

router.post('/', async (req, res) => {
  const {
    id_cliente,
    metodo_pago,
    tipo_entrega,
    direccion_entrega,
    observacion,
    productos,
  } = req.body;

  if (!id_cliente) {
    return res.status(400).json({
      mensaje: 'Debe indicar el cliente',
    });
  }

  const tipoEntrega =
    tipo_entrega === 'Retiro en tienda' ? 'Retiro en tienda' : 'Entrega';

  const direccionFinal =
    tipoEntrega === 'Retiro en tienda'
      ? 'Retiro en tienda'
      : String(direccion_entrega || '').trim();

  if (tipoEntrega === 'Entrega' && !direccionFinal) {
    return res.status(400).json({
      mensaje: 'Debe indicar la dirección de entrega',
    });
  }

  if (!productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      mensaje: 'Debe agregar al menos un producto al pedido',
    });
  }

  try {
    await beginTransaction();

    let total = 0;
    const detalles = [];

    for (const item of productos) {
      const idProducto = Number(item.id_producto);
      const cantidadPedida = formatoNumero(item.cantidad);

      if (!idProducto || cantidadPedida <= 0) {
        await rollbackSeguro();

        return res.status(400).json({
          mensaje: 'Hay un producto con cantidad inválida',
        });
      }

      const resultadoProducto = await query(
        `
          SELECT
            id_producto,
            nombre,
            COALESCE(cantidad, stock, 0) AS cantidad,
            COALESCE(precio_venta, 0) AS precio_venta,
            COALESCE(estado, 'Activo') AS estado,
            unidad_medida
          FROM productos
          WHERE id_producto = ?
          FOR UPDATE
        `,
        [idProducto]
      );

      const producto = obtenerPrimero(resultadoProducto);

      if (!producto) {
        await rollbackSeguro();

        return res.status(404).json({
          mensaje: `Producto con ID ${idProducto} no encontrado`,
        });
      }

      if (String(producto.estado).toLowerCase() !== 'activo') {
        await rollbackSeguro();

        return res.status(400).json({
          mensaje: `El producto ${producto.nombre} no está activo`,
        });
      }

      if (formatoNumero(producto.cantidad) < cantidadPedida) {
        await rollbackSeguro();

        return res.status(400).json({
          mensaje: `No hay suficiente inventario para ${producto.nombre}`,
        });
      }

      const precioUnitario = formatoNumero(producto.precio_venta);

      if (precioUnitario <= 0) {
        await rollbackSeguro();

        return res.status(400).json({
          mensaje: `El producto ${producto.nombre} no tiene precio válido`,
        });
      }

      const subtotal = precioUnitario * cantidadPedida;
      total += subtotal;

      detalles.push({
        id_producto: producto.id_producto,
        producto: producto.nombre,
        nombre_producto: producto.nombre,
        nombre: producto.nombre,
        cantidad: cantidadPedida,
        precio_unitario: precioUnitario,
        subtotal,
      });
    }

    const idPedido = await obtenerSiguienteId('pedidos', 'id_pedido');
    const observacionLimpia = String(observacion || '').trim();

    await query(
      `
        INSERT INTO pedidos
        (
          id_pedido,
          id_cliente,
          total,
          estado,
          metodo_pago,
          tipo_entrega,
          direccion_entrega,
          observacion,
          inventario_descontado,
          fecha_pedido
        )
        VALUES (?, ?, ?, 'Pendiente', ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `,
      [
        idPedido,
        Number(id_cliente),
        total,
        metodo_pago || 'Efectivo',
        tipoEntrega,
        direccionFinal,
        observacionLimpia,
      ]
    );

    let idDetallePedido = await obtenerSiguienteId(
      'detalle_pedidos',
      'id_detalle_pedido'
    );

    for (const detalle of detalles) {
      await query(
        `
          INSERT INTO detalle_pedidos
          (
            id_detalle_pedido,
            id_pedido,
            id_producto,
            producto,
            nombre_producto,
            cantidad,
            precio_unitario,
            subtotal
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          idDetallePedido,
          idPedido,
          detalle.id_producto,
          detalle.producto,
          detalle.nombre_producto,
          detalle.cantidad,
          detalle.precio_unitario,
          detalle.subtotal,
        ]
      );

      idDetallePedido += 1;
    }

    await commit();

    return res.json({
      mensaje: 'Pedido registrado correctamente',
      id_pedido: idPedido,
      estado: 'Pendiente',
      metodo_pago: metodo_pago || 'Efectivo',
      tipo_entrega: tipoEntrega,
      direccion_entrega: direccionFinal,
      observacion: observacionLimpia,
      total,
      inventario_descontado: 0,
      detalles,
    });
  } catch (error) {
    await rollbackSeguro();

    console.log('Error al registrar pedido:', error);

    return res.status(500).json({
      mensaje: 'Error al registrar pedido',
      error: error.message || error,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const pedidos = await cargarPedidosConDetalles();
    res.json(pedidos);
  } catch (error) {
    console.log('Error al obtener pedidos:', error);

    res.status(500).json({
      mensaje: 'Error al obtener pedidos',
      error: error.message || error,
    });
  }
});

router.get('/cliente/:id_cliente', async (req, res) => {
  const { id_cliente } = req.params;

  try {
    const pedidos = await cargarPedidosConDetalles('WHERE p.id_cliente = ?', [
      id_cliente,
    ]);

    res.json(pedidos);
  } catch (error) {
    console.log('Error al obtener pedidos del cliente:', error);

    res.status(500).json({
      mensaje: 'Error al obtener pedidos del cliente',
      error: error.message || error,
    });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pedidos = await cargarPedidosConDetalles('WHERE p.id_pedido = ?', [id]);

    if (pedidos.length === 0) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado',
      });
    }

    return res.json({
      ...pedidos[0],
      pedido: pedidos[0],
      detalles: pedidos[0].detalles || [],
    });
  } catch (error) {
    console.log('Error al obtener detalle del pedido:', error);

    return res.status(500).json({
      mensaje: 'Error al obtener detalle del pedido',
      error: error.message || error,
    });
  }
});

router.patch('/:id/estado', async (req, res) => {
  return cambiarEstadoPedido(req, res, req.body.estado);
});

router.patch('/:id/aceptar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'Aceptado');
});

router.put('/:id/aceptar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'Aceptado');
});

router.patch('/:id/preparar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'En preparación');
});

router.put('/:id/preparar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'En preparación');
});

router.patch('/:id/enviar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'En entrega');
});

router.put('/:id/enviar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'En entrega');
});

router.patch('/:id/entregar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'Entregado');
});

router.put('/:id/entregar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'Entregado');
});

router.patch('/:id/rechazar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'Rechazado');
});

router.put('/:id/rechazar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'Rechazado');
});

router.patch('/:id/cancelar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'Cancelado');
});

router.put('/:id/cancelar', async (req, res) => {
  return cambiarEstadoPedido(req, res, 'Cancelado');
});

module.exports = router;