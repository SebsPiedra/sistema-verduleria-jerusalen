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

export const requiereCantidadEntera = (unidad: string) =>
  UNIDADES_ENTERAS.has(String(unidad || '').trim().toLowerCase());

export const normalizarCantidad = (cantidad: number, unidad: string) =>
  requiereCantidadEntera(unidad)
    ? Math.round(cantidad)
    : Math.round(cantidad * 100) / 100;

export const cantidadValidaParaUnidad = (
  cantidad: number,
  unidad: string,
  permitirCero = false
) =>
  Number.isFinite(cantidad) &&
  (permitirCero ? cantidad >= 0 : cantidad > 0) &&
  (!requiereCantidadEntera(unidad) || Number.isInteger(cantidad));

export const textoAyudaCantidad = (unidad: string) =>
  requiereCantidadEntera(unidad)
    ? `Use números enteros para ${unidad}.`
    : `Puede usar decimales, por ejemplo 1,6 ${unidad}.`;
