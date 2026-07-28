const express = require('express');
const util = require('util');
const conexion = require('../db');

const router = express.Router();

const query = util.promisify(conexion.query).bind(conexion);
const beginTransaction = util.promisify(conexion.beginTransaction).bind(conexion);
const commit = util.promisify(conexion.commit).bind(conexion);
const rollback = util.promisify(conexion.rollback).bind(conexion);

// Registrar producto desechado
router.post('/', async (req, res) => {
  const { id_producto, cantidad, motivo, observacion } = req.body;

  if (!id_producto || !cantidad || !motivo) {
    return res.status(400).json({
      mensaje: 'Debe ingresar producto, cantidad y motivo'
    });
  }

  const cantidadDesechada = Number(cantidad);

  if (cantidadDesechada <= 0) {
    return res.status(400).json({
      mensaje: 'La cantidad debe ser mayor a cero'
    });
  }

  try {
    await beginTransaction();

    const productos = await query(
      `
      SELECT 
        id_producto,
        nombre,
        cantidad,
        precio_compra
      FROM productos
      WHERE id_producto = ?
      FOR UPDATE
      `,
      [id_producto]
    );

    if (productos.length === 0) {
      await rollback();
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      });
    }

    const producto = productos[0];

    if (Number(producto.cantidad) < cantidadDesechada) {
      await rollback();
      return res.status(400).json({
        mensaje: `No hay suficiente inventario de ${producto.nombre} para desechar esa cantidad`
      });
    }

    const precioCompra = Number(producto.precio_compra);
    const perdidaTotal = precioCompra * cantidadDesechada;

    await query(
      `
      INSERT INTO desechos
      (id_producto, cantidad, precio_compra, perdida_total, motivo, observacion)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        id_producto,
        cantidadDesechada,
        precioCompra,
        perdidaTotal,
        motivo,
        observacion || null
      ]
    );

    await query(
      `
      UPDATE productos
      SET cantidad = cantidad - ?
      WHERE id_producto = ?
      `,
      [cantidadDesechada, id_producto]
    );

    await commit();

    res.json({
      mensaje: 'Desecho registrado correctamente',
      producto: producto.nombre,
      cantidad: cantidadDesechada,
      precio_compra: precioCompra,
      perdida_total: perdidaTotal
    });
  } catch (error) {
    await rollback();

    res.status(500).json({
      mensaje: 'Error al registrar desecho',
      error
    });
  }
});

// Listar productos desechados y resumen de pérdidas
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      d.id_desecho,
      d.fecha_desecho,
      p.nombre AS producto,
      p.unidad_medida,
      d.cantidad,
      d.precio_compra,
      d.perdida_total,
      d.motivo,
      d.observacion
    FROM desechos d
    INNER JOIN productos p ON d.id_producto = p.id_producto
    ORDER BY d.fecha_desecho DESC
  `;

  conexion.query(sql, (error, registros) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener desechos',
        error
      });
    }

    const totalPerdida = registros.reduce(
      (acumulado, item) => acumulado + Number(item.perdida_total),
      0
    );

    res.json({
      total_perdida: totalPerdida,
      cantidad_registros: registros.length,
      registros
    });
  });
});

module.exports = router;