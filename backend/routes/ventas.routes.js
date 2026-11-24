const express = require('express');
const conexion = require('../db');
const { cantidadValidaParaUnidad } = require('../utils/unidades');

const router = express.Router();
const METODOS_PAGO_PERMITIDOS = new Set(['Efectivo', 'SINPE Móvil', 'Tarjeta', 'Transferencia']);

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

const iniciarTransaccion = () => new Promise((resolve, reject) =>
  conexion.beginTransaction((error) => error ? reject(error) : resolve())
);
const confirmarTransaccion = () => new Promise((resolve, reject) =>
  conexion.commit((error) => error ? reject(error) : resolve())
);
const revertirTransaccion = () => new Promise((resolve) => conexion.rollback(() => resolve()));
const rechazarTransaccion = async (res, estado, mensaje) => {
  await revertirTransaccion();
  return res.status(estado).json({ mensaje });
};

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
    const usaPaginacion = req.query.page !== undefined || req.query.limit !== undefined;

    if (usaPaginacion) {
      const pagina = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
      const limite = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
      const offset = (pagina - 1) * limite;
      const busqueda = String(req.query.search || '').trim().toLowerCase();
      const metodo = String(req.query.metodo || '').trim();
      const condiciones = [];
      const parametros = [];

      if (busqueda) {
        condiciones.push(`(
          LOWER(COALESCE(numero_factura, '')) LIKE ? OR
          LOWER(COALESCE(cliente, 'Cliente general')) LIKE ? OR
          LOWER(COALESCE(metodo_pago, 'Efectivo')) LIKE ? OR
          LOWER(COALESCE(estado, 'Completada')) LIKE ?
        )`);
        const patron = `%${busqueda}%`;
        parametros.push(patron, patron, patron, patron);
      }

      if (metodo && metodo !== 'Todos') {
        condiciones.push(`COALESCE(metodo_pago, 'Efectivo') = ?`);
        parametros.push(metodo);
      }

      const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

      const [resultadoVentas, resultadoConteo, resultadoResumen, resultadoMetodos] = await Promise.all([
        ejecutar(
          `
            SELECT
              id_venta,
              id_cliente,
              COALESCE(cliente, 'Cliente general') AS cliente,
              COALESCE(numero_factura, '') AS numero_factura,
              COALESCE(total, 0) AS total,
              COALESCE(subtotal_productos, total, 0) AS subtotal_productos,
              COALESCE(costo_envio, 0) AS costo_envio,
              COALESCE(metodo_pago, 'Efectivo') AS metodo_pago,
              COALESCE(estado, 'Completada') AS estado,
              observacion,
              fecha_venta
            FROM ventas
            ${where}
            ORDER BY id_venta DESC
            LIMIT ? OFFSET ?
          `,
          [...parametros, limite, offset]
        ),
        ejecutar(`SELECT COUNT(*) AS total FROM ventas ${where}`, parametros),
        ejecutar(`
          SELECT
            COUNT(*) AS total_facturas,
            COALESCE(SUM(total), 0) AS total_facturado,
            COALESCE(MAX(total), 0) AS venta_mayor
          FROM ventas
        `),
        ejecutar(`
          SELECT DISTINCT COALESCE(metodo_pago, 'Efectivo') AS metodo
          FROM ventas
          ORDER BY metodo ASC
        `),
      ]);

      const ventas = obtenerFilas(resultadoVentas).map((venta) => {
        const idVenta = Number(venta.id_venta);
        return {
          ...venta,
          numero_factura: venta.numero_factura || generarFactura(idVenta),
          factura: venta.numero_factura || generarFactura(idVenta),
        };
      });
      const total = Number(obtenerPrimero(resultadoConteo)?.total || 0);
      const resumen = obtenerPrimero(resultadoResumen) || {};

      return res.json({
        ventas,
        paginacion: {
          pagina,
          limite,
          total,
          total_paginas: Math.max(Math.ceil(total / limite), 1),
        },
        resumen: {
          total_facturas: Number(resumen.total_facturas || 0),
          total_facturado: Number(resumen.total_facturado || 0),
          venta_mayor: Number(resumen.venta_mayor || 0),
        },
        metodos: obtenerFilas(resultadoMetodos).map((fila) => fila.metodo),
      });
    }

    const resultadoVentas = await ejecutar(`
      SELECT
        id_venta,
        id_cliente,
        COALESCE(cliente, 'Cliente general') AS cliente,
        COALESCE(numero_factura, '') AS numero_factura,
        COALESCE(total, 0) AS total,
        COALESCE(subtotal_productos, total, 0) AS subtotal_productos,
        COALESCE(costo_envio, 0) AS costo_envio,
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
          COALESCE(subtotal_productos, total, 0) AS subtotal_productos,
          COALESCE(costo_envio, 0) AS costo_envio,
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
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      id_cliente,
      metodo_pago,
      costo_envio,
      observacion,
      productos,
    } = req.body;

    const metodoPagoFinal = String(metodo_pago || 'Efectivo').trim();
    const idClienteFinal = id_cliente === null || id_cliente === undefined || id_cliente === ''
      ? null
      : Number(id_cliente);
    const observacionFinal = String(observacion || '').trim();
    const costoEnvioFinal = Number(String(costo_envio ?? 0).replace(',', '.'));

    if (!METODOS_PAGO_PERMITIDOS.has(metodoPagoFinal)) {
      return res.status(400).json({ mensaje: 'Debe seleccionar un método de pago válido.' });
    }
    if (idClienteFinal !== null && (!Number.isSafeInteger(idClienteFinal) || idClienteFinal <= 0)) {
      return res.status(400).json({ mensaje: 'El cliente seleccionado no es válido.' });
    }
    if (observacionFinal.length > 500) {
      return res.status(400).json({ mensaje: 'La observación no puede superar 500 caracteres.' });
    }
    if (!Number.isFinite(costoEnvioFinal) || costoEnvioFinal < 0 || costoEnvioFinal > 1000000) {
      return res.status(400).json({ mensaje: 'El costo de envío debe estar entre ₡0 y ₡1 000 000.' });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        mensaje: 'Debe agregar al menos un producto a la venta.',
      });
    }

    if (new Set(productos.map(p=>Number(p.id_producto))).size !== productos.length) {
      return res.status(400).json({mensaje:'Agrupa las cantidades de cada producto en una sola línea.'});
    }
    await iniciarTransaccion();
    let totalVenta = 0;
    const detallesVenta = [];
    let clienteFinal = 'Cliente general';

    if (idClienteFinal !== null) {
      const clienteBD = obtenerPrimero(await ejecutar(
        `SELECT id_cliente, nombre, COALESCE(estado, 'Activo') AS estado
         FROM clientes WHERE id_cliente = ? LIMIT 1`,
        [idClienteFinal]
      ));
      if (!clienteBD) {
        return rechazarTransaccion(res, 404, 'El cliente seleccionado no existe.');
      }
      if (String(clienteBD.estado).toLowerCase() !== 'activo') {
        return rechazarTransaccion(res, 400, 'El cliente seleccionado está inactivo.');
      }
      clienteFinal = String(clienteBD.nombre || '').trim() || 'Cliente registrado';
    }

    for (const item of productos) {
      const idProducto = Number(item.id_producto);
      const cantidad = Number(item.cantidad);

      if (!Number.isSafeInteger(idProducto) || idProducto<=0 || !Number.isFinite(cantidad) || cantidad <= 0) {
        return rechazarTransaccion(res, 400, 'Hay un producto con cantidad inválida.');
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
          FOR UPDATE
        `,
        [idProducto]
      );

      const productoBD = obtenerPrimero(resultadoProducto);

      if (!productoBD) {
        return rechazarTransaccion(res, 404, `No se encontró el producto con ID ${idProducto}.`);
      }

      if (String(productoBD.estado || 'Activo').toLowerCase() === 'inactivo') {
        return rechazarTransaccion(res, 400, `El producto ${productoBD.nombre} está inactivo.`);
      }

      if (!cantidadValidaParaUnidad(cantidad, productoBD.unidad_medida)) {
        return rechazarTransaccion(res, 400, `La cantidad indicada no es válida para ${productoBD.nombre} (${productoBD.unidad_medida}).`);
      }

      const disponible = Number(productoBD.cantidad ?? productoBD.stock ?? 0);

      if (cantidad > disponible) {
        return rechazarTransaccion(res, 400, `No hay suficiente inventario para ${productoBD.nombre}. Disponible: ${disponible}.`);
      }

      const nombreProducto = productoBD.nombre || 'Producto';

      const precioUnitario = Number(productoBD.precio_venta || 0);

      if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
        return rechazarTransaccion(res, 400, `El producto ${nombreProducto} no tiene precio válido.`);
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
        (id_cliente, cliente, subtotal_productos, costo_envio, total, metodo_pago, fecha_venta, estado, observacion)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Completada', ?)
        RETURNING id_venta
      `,
      [
        idClienteFinal,
        clienteFinal,
        totalVenta,
        costoEnvioFinal,
        totalVenta + costoEnvioFinal,
        metodoPagoFinal,
        observacionFinal,
      ]
    );
    const idVenta = Number(obtenerPrimero(resultadoVenta)?.id_venta);
    if (!idVenta) throw new Error('No se obtuvo el identificador de la venta');
    const numeroFactura = generarFactura(idVenta);
    await ejecutar('UPDATE ventas SET numero_factura = ? WHERE id_venta = ?', [numeroFactura, idVenta]);

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
            stock = CAST(CEIL(GREATEST(COALESCE(cantidad, stock, 0) - ?, 0)) AS INTEGER)
          WHERE id_producto = ?
        `,
        [item.cantidad, item.cantidad, item.id_producto]
      );
    }

    await confirmarTransaccion();
    res.json({
      mensaje: 'Venta registrada correctamente.',
      id_venta: idVenta,
      numero_factura: numeroFactura,
      factura: numeroFactura,
      cliente: clienteFinal,
      metodo_pago: metodoPagoFinal,
      subtotal_productos: totalVenta,
      costo_envio: costoEnvioFinal,
      total: totalVenta + costoEnvioFinal,
      detalles: detallesVenta,
    });
  } catch (error) {
    console.log('ERROR POST /ventas:', error);
    await revertirTransaccion();

    res.status(500).json({
      mensaje: 'No se pudo registrar la venta.',
    });
  }
});

module.exports = router;
