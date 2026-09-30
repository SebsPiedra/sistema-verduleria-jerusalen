const UNIDADES_ENTERAS = new Set([
  'unidad',
  'unidades',
  'bolsa',
  'bolsas',
  'caja',
  'cajas',
  'paquete',
  'paquetes',
]);

const requiereCantidadEntera = (unidad) =>
  UNIDADES_ENTERAS.has(String(unidad || '').trim().toLowerCase());

const cantidadValidaParaUnidad = (cantidad, unidad, permitirCero = false) => {
  const numero = Number(cantidad);
  const limiteValido = permitirCero ? numero >= 0 : numero > 0;

  return (
    Number.isFinite(numero) &&
    limiteValido &&
    Math.abs(numero * 100 - Math.round(numero * 100)) < 1e-8 &&
    (!requiereCantidadEntera(unidad) || Number.isInteger(numero))
  );
};

module.exports = { requiereCantidadEntera, cantidadValidaParaUnidad };
