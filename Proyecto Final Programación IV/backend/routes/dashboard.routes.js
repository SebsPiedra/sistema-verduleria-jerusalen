const express = require('express');
const conexion = require('../db');

const router = express.Router();

// Resumen general del sistema
router.get('/resumen', (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM productos) AS total_productos,
      (SELECT COUNT(*) FROM productos WHERE cantidad <= stock_minimo) AS productos_stock_bajo,
      (SELECT COUNT(*) FROM productos WHERE precio_compra = 0 OR precio_venta = 0) AS productos_sin_precio,

      (SELECT COUNT(*) FROM ventas) AS total_ventas,
      (SELECT IFNULL(SUM(total), 0) FROM ventas) AS monto_total_ventas,

      (SELECT COUNT(*) FROM desechos) AS total_desechos,
      (SELECT IFNULL(SUM(perdida_total), 0) FROM desechos) AS monto_total_perdidas,

      (SELECT COUNT(*) FROM clientes) AS total_clientes,

      (SELECT COUNT(*) FROM pedidos) AS total_pedidos,
      (SELECT COUNT(*) FROM pedidos WHERE estado = 'Pendiente') AS pedidos_pendientes,
      (SELECT COUNT(*) FROM pedidos WHERE estado = 'Aceptado') AS pedidos_aceptados,
      (SELECT COUNT(*) FROM pedidos WHERE estado = 'Rechazado') AS pedidos_rechazados,
      (SELECT COUNT(*) FROM pedidos WHERE estado = 'Entregado') AS pedidos_entregados,
      (SELECT IFNULL(SUM(total), 0) FROM pedidos) AS monto_total_pedidos
  `;

  conexion.query(sql, (error, resultados) => {
    if (error) {
      return res.status(500).json({
        mensaje: 'Error al obtener resumen del dashboard',
        error
      });
    }

    res.json(resultados[0]);
  });
});

module.exports = router;