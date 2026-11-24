const test = require('node:test');
const assert = require('node:assert/strict');
const { requiereCantidadEntera, cantidadValidaParaUnidad } = require('../utils/unidades');

test('las unidades empacadas exigen cantidades enteras', () => {
  for (const unidad of ['unidad', 'bolsa', 'caja', 'paquete']) {
    assert.equal(requiereCantidadEntera(unidad), true);
    assert.equal(cantidadValidaParaUnidad(1.5, unidad), false);
    assert.equal(cantidadValidaParaUnidad(2, unidad), true);
  }
});

test('kg y litro permiten hasta dos decimales positivos', () => {
  assert.equal(cantidadValidaParaUnidad(1.25, 'kg'), true);
  assert.equal(cantidadValidaParaUnidad(0.5, 'litro'), true);
  assert.equal(cantidadValidaParaUnidad(1.234, 'kg'), false);
  assert.equal(cantidadValidaParaUnidad(0, 'kg'), false);
  assert.equal(cantidadValidaParaUnidad(-1, 'kg'), false);
  assert.equal(cantidadValidaParaUnidad(Infinity, 'kg'), false);
});

test('el inventario puede iniciar en cero cuando se autoriza', () => {
  assert.equal(cantidadValidaParaUnidad(0, 'kg', true), true);
  assert.equal(cantidadValidaParaUnidad(0, 'unidad', true), true);
});
