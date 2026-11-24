ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS subtotal_productos NUMERIC(14,2) NOT NULL DEFAULT 0;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS costo_envio NUMERIC(14,2) NOT NULL DEFAULT 0;

-- Los pedidos ya guardan el desglose exacto; se usa como fuente principal.
UPDATE ventas v
SET subtotal_productos = COALESCE(p.subtotal_productos, p.total - p.costo_envio, v.total),
    costo_envio = COALESCE(p.costo_envio, 0)
FROM pedidos p
WHERE p.id_venta = v.id_venta;

-- Para ventas manuales o antiguas, el subtotal corresponde a sus productos.
UPDATE ventas v
SET subtotal_productos = COALESCE((
  SELECT SUM(COALESCE(d.subtotal, d.cantidad * d.precio_unitario, 0))
  FROM detalle_ventas d
  WHERE d.id_venta = v.id_venta
), v.total - v.costo_envio, v.total)
WHERE v.subtotal_productos = 0;

