-- Aditiva: no elimina ni recalcula registros históricos.
ALTER TABLE detalle_ventas ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(14,4);
CREATE OR REPLACE FUNCTION capturar_costo_venta_mensual() RETURNS trigger AS $$
BEGIN
  IF NEW.costo_unitario IS NULL THEN
    SELECT precio_compra INTO NEW.costo_unitario FROM productos WHERE id_producto = NEW.id_producto;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER capturar_costo_venta_mensual
BEFORE INSERT ON detalle_ventas FOR EACH ROW EXECUTE FUNCTION capturar_costo_venta_mensual();

CREATE TABLE IF NOT EXISTS gastos_mensuales (
  id UUID PRIMARY KEY,
  fecha DATE NOT NULL,
  concepto VARCHAR(200) NOT NULL CHECK (length(trim(concepto)) > 0),
  monto NUMERIC(14,2) NOT NULL CHECK (monto > 0),
  creado_por INTEGER NOT NULL REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  anulado_en TIMESTAMPTZ,
  anulado_por INTEGER REFERENCES usuarios(id)
);
CREATE INDEX IF NOT EXISTS gastos_mensuales_fecha ON gastos_mensuales(fecha);
CREATE TABLE IF NOT EXISTS cortes_mensuales (
  id UUID PRIMARY KEY,
  periodo CHAR(7) NOT NULL CHECK (periodo ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  creado_por INTEGER NOT NULL REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  datos JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS cortes_mensuales_periodo ON cortes_mensuales(periodo, creado_en DESC);
