CREATE TABLE IF NOT EXISTS historial_estados_pedidos (
  id_historial BIGSERIAL PRIMARY KEY,
  id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
  estado_anterior VARCHAR(30),
  estado_nuevo VARCHAR(30) NOT NULL,
  motivo VARCHAR(300),
  id_usuario INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_cambio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_pedido_fecha
  ON historial_estados_pedidos (id_pedido, fecha_cambio DESC);
