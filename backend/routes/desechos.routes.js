const express = require('express');
const util = require('util');
const conexion = require('../db');

const router = express.Router();

const query = util.promisify(conexion.query).bind(conexion);
const beginTransaction = util.promisify(conexion.beginTransaction).bind(conexion);
const commit = util.promisify(conexion.commit).bind(conexion);
const rollback = util.promisify(conexion.rollback).bind(conexion);

const obtenerFilas = (resultado) => {
  if (Array.isArray(resultado)) return resultado;
  if (resultado?.rows) return resultado.rows;
  return [];
};

const obtenerPrimero = (resultado) => {
  const filas = obtenerFilas(resultado);
  return filas[0] || null;
};

const formatoNumero = (valor) => {
  const numero = Number(valor || 0);
  return Number.isNaN(numero) ? 0 : numero;
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

router.post('/', async (req, res) => {
  const { id_producto, cantidad, motivo, observacion } = req.body;

  if (!id_producto) {
    return res.status(400).json({
      mensaje: 'Debe seleccionar un producto.',
    });
  }

  if (!cantidad || Number(cantidad) <= 0) {
    return res.status(400).json({
      mensaje: 'La cantidad debe ser mayor a cero.',
    });
  }

  if (!motivo || !String(motivo).trim()) {
    return res.status(400).json({
      mensaje: 'Debe seleccionar un motivo.',
    });
  }

  const cantidadDesechada = formatoNumero(cantidad);

  try {
    await beginTransaction();

    const resultadoProducto = await query(
      `
        SELECT
          id_producto,
          nombre,
          COALESCE(cantidad, stock, 0) AS cantidad,
          COALESCE(stock, cantidad, 0) AS stock,
          COALESCE(precio_compra, 0) AS precio_compra,
          unidad_medida
        FROM productos
        WHERE id_producto = ?
        FOR UPDATE
      `,
      [id_producto]
    );

    const producto = obtenerPrimero(resultadoProducto);

    if (!producto) {
      await rollbackSeguro();

      return res.status(404).json({
        mensaje: 'Producto no encontrado.',
      });
    }

    const inventarioDisponible = formatoNumero(producto.cantidad);

    if (inventarioDisponible < cantidadDesechada) {
      await rollbackSeguro();

      return res.status(400).json({
        mensaje: `No hay suficiente inventario de ${producto.nombre}. Disponible: ${inventarioDisponible}.`,
      });
    }

    const precioCompra = formatoNumero(producto.precio_compra);
    const perdidaTotal = cantidadDesechada * precioCompra;
    const idDesecho = await obtenerSiguienteId('desechos', 'id_desecho');

    await query(
      `
        INSERT INTO desechos
        (
          id_desecho,
          id_producto,
          producto,
          nombre_producto,
          cantidad,
          precio_compra,
          perdida_total,
          motivo,
          observacion,
          fecha_desecho
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        idDesecho,
        producto.id_producto,
        producto.nombre,
        producto.nombre,
        cantidadDesechada,
        precioCompra,
        perdidaTotal,
        motivo,
        String(observacion || '').trim(),
      ]
    );

    await query(
      `
        UPDATE productos
        SET
          cantidad = GREATEST(COALESCE(cantidad, stock, 0) - ?, 0),
          stock = CAST(CEIL(GREATEST(COALESCE(cantidad, stock, 0) - ?, 0)) AS INTEGER)
        WHERE id_producto = ?
      `,
      [cantidadDesechada, cantidadDesechada, producto.id_producto]
    );

    await commit();

    return res.json({
      mensaje: 'Desecho registrado correctamente.',
      id_desecho: idDesecho,
      id_producto: producto.id_producto,
      producto: producto.nombre,
      nombre_producto: producto.nombre,
      cantidad: cantidadDesechada,
      precio_compra: precioCompra,
      perdida_total: perdidaTotal,
      motivo,
      observacion: String(observacion || '').trim(),
    });
  } catch (error) {
    await rollbackSeguro();

    console.log('Error al registrar desecho:', error);

    return res.status(500).json({
      mensaje: 'Error al registrar desecho.',
      error: error.message || error,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const resultadoRegistros = await query(`
      SELECT
        d.id_desecho,
        d.id_producto,
        d.fecha_desecho,
        COALESCE(d.producto, d.nombre_producto, p.nombre, 'Producto') AS producto,
        COALESCE(d.nombre_producto, d.producto, p.nombre, 'Producto') AS nombre_producto,
        p.unidad_medida,
        COALESCE(d.cantidad, 0) AS cantidad,
        COALESCE(d.precio_compra, p.precio_compra, 0) AS precio_compra,
        COALESCE(
          d.perdida_total,
          COALESCE(d.cantidad, 0) * COALESCE(d.precio_compra, p.precio_compra, 0)
        ) AS perdida_total,
        COALESCE(d.motivo, 'Sin motivo') AS motivo,
        COALESCE(d.observacion, '') AS observacion
      FROM desechos d
      LEFT JOIN productos p ON d.id_producto = p.id_producto
      ORDER BY d.fecha_desecho DESC, d.id_desecho DESC
    `);

    const registros = obtenerFilas(resultadoRegistros);

    const totalPerdida = registros.reduce((total, item) => {
      return total + formatoNumero(item.perdida_total);
    }, 0);

    const cantidadTotal = registros.reduce((total, item) => {
      return total + formatoNumero(item.cantidad);
    }, 0);

    return res.json({
      total_perdida: totalPerdida,
      cantidad_total: cantidadTotal,
      cantidad_registros: registros.length,
      registros,
      desechos: registros,
    });
  } catch (error) {
    console.log('Error al obtener desechos:', error);

    return res.status(500).json({
      mensaje: 'Error al obtener desechos.',
      error: error.message || error,
    });
  }
});

module.exports = router;