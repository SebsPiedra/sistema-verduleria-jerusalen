CREATE TABLE IF NOT EXISTS configuracion_sistema (
  clave VARCHAR(80) PRIMARY KEY,
  valor NUMERIC(14,2) NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO configuracion_sistema(clave,valor) VALUES
  ('umbral_envio_gratis',15000),('costo_envio_base',1500)
ON CONFLICT (clave) DO NOTHING;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS subtotal_productos NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS costo_envio NUMERIC(14,2) NOT NULL DEFAULT 0;
