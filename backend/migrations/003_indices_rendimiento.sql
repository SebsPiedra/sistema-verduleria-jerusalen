-- Índices para las consultas más frecuentes del panel administrativo.
-- Todos son idempotentes para que la migración pueda ejecutarse con seguridad.

CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_id
  ON pedidos (fecha_pedido DESC, id_pedido DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id
  ON pedidos (id_cliente, id_pedido DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_estado_id
  ON pedidos (estado, id_pedido DESC);

CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_pedido_detalle
  ON detalle_pedidos (id_pedido, id_detalle_pedido);

CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_producto
  ON detalle_pedidos (id_producto);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha_id
  ON ventas (fecha_venta DESC, id_venta DESC);

CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id
  ON ventas (id_cliente, id_venta DESC);

CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta_detalle
  ON detalle_ventas (id_venta, id_detalle);

CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto
  ON detalle_ventas (id_producto);

CREATE INDEX IF NOT EXISTS idx_productos_nombre_normalizado
  ON productos (LOWER(TRIM(nombre)));

CREATE INDEX IF NOT EXISTS idx_clientes_correo_normalizado
  ON clientes (LOWER(COALESCE(correo, email, '')));
