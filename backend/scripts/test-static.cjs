const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const leer = (archivo) => fs.readFileSync(path.join(raiz, archivo), 'utf8');
const rutasCriticas = [
  'routes/clientes.routes.js',
  'routes/desechos.routes.js',
  'routes/pedidos.routes.js',
  'routes/ventas.routes.js',
];

for (const archivo of rutasCriticas) {
  const codigo = leer(archivo);
  assert.doesNotMatch(codigo, /MAX\s*\([^)]*id[^)]*\)[^;\n]*\+\s*1/i, `${archivo} no debe calcular IDs con MAX + 1`);
}

const ventas = leer('routes/ventas.routes.js');
assert.match(ventas, /FOR UPDATE/, 'las ventas deben bloquear el inventario');
assert.doesNotMatch(ventas, /item\.precio_unitario\s*\|\|/, 'el precio nunca debe venir del navegador');
assert.match(ventas, /clienteFinal = 'Cliente general'/, 'deben mantenerse las ventas generales');
assert.match(ventas, /METODOS_PAGO_PERMITIDOS/, 'los métodos de pago deben validarse');

const facturas = leer('routes/facturas.routes.js');
assert.doesNotMatch(facturas, /router\.post\s*\(/, 'facturas es de consulta; las ventas se crean en /ventas');

console.log('PASS: secuencias, inventario, precios, cliente general, pagos y rutas verificadas.');
