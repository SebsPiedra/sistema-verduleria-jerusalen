const { Pool } = require('pg');
const obtenerVariables = require('../config/variables');

const variables = obtenerVariables();
const pool = new Pool({
  connectionString: variables.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

(async () => {
  const tablas = (await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  )).rows.map((fila) => fila.tablename);

  for (const tabla of tablas) {
    const nombreSeguro = `"${tabla.replace(/"/g, '""')}"`;
    const resultado = await pool.query(`SELECT COUNT(*)::int AS cantidad FROM ${nombreSeguro}`);
    console.log(`${tabla}=${resultado.rows[0].cantidad}`);
  }

  const resumenes = {
    clientes: `SELECT id_cliente, nombre, telefono, correo FROM clientes ORDER BY id_cliente`,
    ventas: `SELECT id_venta, fecha_venta, total, metodo_pago, estado FROM ventas ORDER BY id_venta`,
    pedidos: `SELECT id_pedido, id_cliente, fecha_pedido, subtotal_productos, costo_envio, total, estado FROM pedidos ORDER BY id_pedido`,
    desechos: `SELECT id_desecho, id_producto, fecha_desecho, cantidad, perdida_total FROM desechos ORDER BY id_desecho`,
    cortes_mensuales: `SELECT * FROM cortes_mensuales ORDER BY 1`
  };

  for (const [nombre, consulta] of Object.entries(resumenes)) {
    try {
      const filas = (await pool.query(consulta)).rows;
      console.log(`\n[${nombre}]`);
      console.log(JSON.stringify(filas, null, 2));
    } catch (error) {
      console.log(`\n[${nombre}] ${error.message}`);
    }
  }
})()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
