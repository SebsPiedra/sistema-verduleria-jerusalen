const { Pool } = require('pg');
const variables = require('../config/variables')();
// Independent clients: reports cannot join another request's legacy transaction.
const pool = new Pool({ connectionString: variables.DATABASE_URL, ssl: { rejectUnauthorized: true }, max: 3 });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function periodoValido(value) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(value || '')) throw Object.assign(new Error('Seleccione un mes válido entre 2000 y 2099.'), { status: 400 });
  return value;
}
function centavos(value) {
  const n = Math.round(Number(value || 0) * 100);
  if (!Number.isSafeInteger(n)) throw new Error('Monto fuera de rango.');
  return n;
}
const sumar = (rows, field) => rows.reduce((total, row) => total + centavos(row[field]), 0);
async function resumen(client, periodo) {
  periodoValido(periodo);
  // Existing timestamps have no zone. Retain the calendar dates recorded by the app.
  const range = [periodo + '-01'];
  const rows = async sql => (await client.query(sql, range)).rows;
  const ventas = await rows(`SELECT v.id_venta, v.numero_factura, v.cliente, v.fecha_venta::text AS fecha,
    v.estado, v.metodo_pago, v.total,
    lower(coalesce(v.estado,'Completada')) IN ('completada','completado','pagada','pagado') AS contabilizada
    FROM ventas v WHERE fecha_venta >= $1::date AND fecha_venta < $1::date + interval '1 month' ORDER BY fecha_venta,id_venta`);
  const detalles = await rows(`SELECT d.id_venta, d.id_producto, coalesce(d.nombre_producto,d.producto,p.nombre,'Producto') AS producto,
    d.cantidad, d.precio_unitario, d.subtotal,
    coalesce(d.costo_unitario,p.precio_compra,0) AS costo_unitario,
    round(d.cantidad * coalesce(d.costo_unitario,p.precio_compra,0),2) AS costo,
    d.costo_unitario IS NULL AS estimado,
    coalesce(d.costo_unitario,p.precio_compra) IS NULL AS sin_costo
    FROM detalle_ventas d JOIN ventas v ON v.id_venta=d.id_venta LEFT JOIN productos p ON p.id_producto=d.id_producto
    WHERE v.fecha_venta >= $1::date AND v.fecha_venta < $1::date + interval '1 month' ORDER BY d.id_venta,d.id_detalle`);
  const pedidos = await rows(`SELECT id_pedido,id_venta,coalesce(cliente,'Cliente') AS cliente,fecha_pedido::text AS fecha,estado,total,tipo_entrega
    FROM pedidos WHERE fecha_pedido >= $1::date AND fecha_pedido < $1::date + interval '1 month' ORDER BY fecha_pedido,id_pedido`);
  const desechos = await rows(`SELECT d.id_desecho,coalesce(d.nombre_producto,d.producto,p.nombre,'Producto') AS producto,
    d.fecha_desecho::text AS fecha,d.cantidad,d.motivo,d.estado,
    coalesce(d.perdida_total,d.perdida,round(d.cantidad*coalesce(d.precio_compra,p.precio_compra,0),2)) AS perdida
    FROM desechos d LEFT JOIN productos p ON p.id_producto=d.id_producto
    WHERE fecha_desecho >= $1::date AND fecha_desecho < $1::date + interval '1 month' ORDER BY fecha_desecho,id_desecho`);
  const gastos = await rows(`SELECT id,fecha::text,concepto,monto,anulado_en::text FROM gastos_mensuales
    WHERE fecha >= $1::date AND fecha < $1::date + interval '1 month' ORDER BY fecha,creado_en`);
  const inventario = (await client.query(`SELECT id_producto,nombre,coalesce(cantidad,stock,0) AS cantidad,unidad_medida,
    precio_compra,precio_venta,estado FROM productos ORDER BY nombre`)).rows;
  const clientes = (await client.query('SELECT id_cliente,nombre,estado FROM clientes ORDER BY nombre')).rows;
  const proveedores = (await client.query('SELECT id_proveedor,coalesce(nombre_proveedor,nombre) AS nombre,estado FROM proveedores ORDER BY 2')).rows;
  const validas = ventas.filter(v => v.contabilizada);
  const ids = new Set(validas.map(v => v.id_venta));
  const detalleValido = detalles.filter(d => ids.has(d.id_venta));
  const ingresos = sumar(validas,'total');
  const costo = sumar(detalleValido,'costo');
  const perdidas = sumar(desechos.filter(d => !/^(anulad|cancelad)/i.test(d.estado || '')),'perdida');
  const gastosTotal = sumar(gastos.filter(g => !g.anulado_en),'monto');
  return {
    version: 1, periodo, generado_en: new Date().toISOString(),
    criterio: 'Fechas calendario guardadas en el sistema. Ingresos de ventas completadas/pagadas; pedidos vinculados no se suman otra vez. Costos antiguos estimados al precio de compra actual. Inventario, clientes y proveedores son una fotografía al consultar, no al cierre histórico. Ganancia estimada antes de impuestos no registrados; no equivale a saldo de caja.',
    totales: { ingresos, costo, perdidas, gastos: gastosTotal, ganancia: ingresos-costo-perdidas-gastosTotal,
      ventas: validas.length, pedidos: pedidos.length, costos_estimados: detalleValido.filter(d=>d.estimado).length,
      sin_costo: detalleValido.filter(d=>d.sin_costo).length,
      ventas_sin_detalle: validas.filter(v=>!detalleValido.some(d=>d.id_venta===v.id_venta)).length },
    ventas, detalles, pedidos, desechos, gastos, inventario, clientes, proveedores
  };
}
module.exports = { pool, resumen, periodoValido, centavos, uuid };
