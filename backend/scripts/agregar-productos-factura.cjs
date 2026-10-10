const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const obtenerVariables = require('../config/variables');

const productos = [
  ['Culantro coyote', 'kg'],
  ['Culantro Castilla', 'kg'],
  ['Chayote tierno', 'kg'],
  ['Chayote sazón', 'kg'],
  ['Frijol tierno', 'kg'],
  ['Frijol blanco', 'kg'],
  ['Limón mandarina', 'kg'],
  ['Peras', 'kg'],
  ['Perejil', 'kg'],
  ['Remolacha', 'kg'],
  ['Repollo', 'kg'],
  ['Rabanitos', 'kg'],
  ['Sandía', 'kg'],
  ['Zuquini', 'kg'],
  ['Tiquisque', 'kg'],
  ['Tamarindo', 'kg'],
  ['Tomillo', 'kg'],
  ['Trenzas de ajo', 'unidad'],
  ['Tacacos', 'kg'],
  ['Uvas', 'kg'],
  ['Vainica', 'kg'],
  ['Yuca parafinada', 'kg'],
  ['Zanahoria', 'kg']
];

const variables = obtenerVariables();
const pool = new Pool({
  connectionString: variables.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});

async function ejecutar() {
  const client = await pool.connect();
  try {
    const actuales = await client.query(`
      SELECT id_producto, nombre, cantidad, precio_compra, precio_venta,
             stock_minimo, unidad_medida, estado, imagen_url, imagen
      FROM productos
      ORDER BY id_producto
    `);

    const respaldoDir = path.resolve(__dirname, '..', 'backups');
    fs.mkdirSync(respaldoDir, { recursive: true });
    const marca = new Date().toISOString().replace(/[:.]/g, '-');
    const respaldo = path.join(respaldoDir, `productos-antes-factura-${marca}.json`);
    fs.writeFileSync(respaldo, JSON.stringify(actuales.rows, null, 2), 'utf8');

    await client.query('BEGIN');
    const agregados = [];
    const existentes = [];

    for (const [nombre, unidad] of productos) {
      const previo = await client.query(
        `SELECT id_producto, nombre FROM productos
         WHERE lower(trim(nombre)) = lower(trim($1))
         LIMIT 1`,
        [nombre]
      );

      if (previo.rowCount > 0) {
        existentes.push(previo.rows[0]);
        continue;
      }

      const resultado = await client.query(
        `INSERT INTO productos
          (nombre, cantidad, precio_compra, precio_venta, stock_minimo,
           unidad_medida, id_proveedor, imagen_url, imagen, estado)
         VALUES ($1, 0, 0, 0, 0, $2, NULL, NULL, NULL, 'Inactivo')
         RETURNING id_producto, nombre, unidad_medida, estado`,
        [nombre, unidad]
      );
      agregados.push(resultado.rows[0]);
    }

    await client.query('COMMIT');
    console.log(JSON.stringify({ respaldo, agregados, existentes }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

ejecutar().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
