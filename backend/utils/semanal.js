const { pool, centavos } = require('./mensual');

function fechaValida(value) {
  if (!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value || '')) {
    throw Object.assign(new Error('Seleccione una fecha válida.'), { status: 400 });
  }
  const parsed = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw Object.assign(new Error('Seleccione una fecha válida.'), { status: 400 });
  }
  return parsed;
}

function rangoSemanal(value) {
  const selected = fechaValida(value);
  const day = selected.getUTCDay();
  selected.setUTCDate(selected.getUTCDate() - (day === 0 ? 6 : day - 1));
  const end = new Date(selected);
  end.setUTCDate(end.getUTCDate() + 7);
  return [selected.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

const sumar = (rows, field) => rows.reduce((total, row) => total + centavos(row[field]), 0);

async function resumenSemanal(client, fecha) {
  const [inicio, finExclusivo] = rangoSemanal(fecha);
  const range = [inicio, finExclusivo];
  const rows = async (sql) => (await client.query(sql, range)).rows;
  const ventas = await rows(`SELECT v.id_venta, v.numero_factura, v.cliente, v.fecha_venta::text AS fecha,
    v.estado, v.metodo_pago, v.total,
    lower(coalesce(v.estado,'Completada')) IN ('completada','completado','pagada','pagado') AS contabilizada
    FROM ventas v WHERE fecha_venta >= $1::date AND fecha_venta < $2::date ORDER BY fecha_venta,id_venta`);
  const detalles = await rows(`SELECT d.id_venta, d.id_producto, coalesce(d.nombre_producto,d.producto,p.nombre,'Producto') AS producto,
    d.cantidad, d.precio_unitario, d.subtotal,
    coalesce(d.costo_unitario,p.precio_compra,0) AS costo_unitario,
    round(d.cantidad * coalesce(d.costo_unitario,p.precio_compra,0),2) AS costo,
    d.costo_unitario IS NULL AS estimado,
    coalesce(d.costo_unitario,p.precio_compra) IS NULL AS sin_costo
    FROM detalle_ventas d JOIN ventas v ON v.id_venta=d.id_venta LEFT JOIN productos p ON p.id_producto=d.id_producto
    WHERE v.fecha_venta >= $1::date AND v.fecha_venta < $2::date ORDER BY d.id_venta,d.id_detalle`);
  const pedidos = await rows(`SELECT id_pedido,id_venta,coalesce(cliente,'Cliente') AS cliente,fecha_pedido::text AS fecha,estado,total,tipo_entrega
    FROM pedidos WHERE fecha_pedido >= $1::date AND fecha_pedido < $2::date ORDER BY fecha_pedido,id_pedido`);
  const desechos = await rows(`SELECT d.id_desecho,coalesce(d.nombre_producto,d.producto,p.nombre,'Producto') AS producto,
    d.fecha_desecho::text AS fecha,d.cantidad,d.motivo,d.estado,
    coalesce(d.perdida_total,d.perdida,round(d.cantidad*coalesce(d.precio_compra,p.precio_compra,0),2)) AS perdida
    FROM desechos d LEFT JOIN productos p ON p.id_producto=d.id_producto
    WHERE fecha_desecho >= $1::date AND fecha_desecho < $2::date ORDER BY fecha_desecho,id_desecho`);
  const gastos = await rows(`SELECT id,fecha::text,concepto,monto,anulado_en::text FROM gastos_mensuales
    WHERE fecha >= $1::date AND fecha < $2::date ORDER BY fecha,creado_en`);
  const validas = ventas.filter((venta) => venta.contabilizada);
  const ids = new Set(validas.map((venta) => venta.id_venta));
  const detalleValido = detalles.filter((detalle) => ids.has(detalle.id_venta));
  const ingresos = sumar(validas, 'total');
  const costo = sumar(detalleValido, 'costo');
  const perdidas = sumar(desechos.filter((desecho) => !/^(anulad|cancelad)/i.test(desecho.estado || '')), 'perdida');
  const gastosTotal = sumar(gastos.filter((gasto) => !gasto.anulado_en), 'monto');
  const fin = new Date(`${finExclusivo}T12:00:00Z`);
  fin.setUTCDate(fin.getUTCDate() - 1);
  return {
    version: 1,
    inicio,
    fin: fin.toISOString().slice(0, 10),
    generado_en: new Date().toISOString(),
    criterio: 'Semana de lunes a domingo. Ingresos de ventas completadas o pagadas. El costo usa el precio de costo guardado en cada venta y, para registros antiguos sin ese dato, el precio de compra actual como estimación. También descuenta desechos y gastos registrados dentro de la semana.',
    totales: {
      ingresos, costo, perdidas, gastos: gastosTotal, ganancia: ingresos - costo - perdidas - gastosTotal,
      ventas: validas.length, pedidos: pedidos.length,
      costos_estimados: detalleValido.filter((detalle) => detalle.estimado).length,
      sin_costo: detalleValido.filter((detalle) => detalle.sin_costo).length,
      ventas_sin_detalle: validas.filter((venta) => !detalleValido.some((detalle) => detalle.id_venta === venta.id_venta)).length,
    },
    ventas, detalles, pedidos, desechos, gastos,
  };
}

module.exports = { pool, resumenSemanal, rangoSemanal };
