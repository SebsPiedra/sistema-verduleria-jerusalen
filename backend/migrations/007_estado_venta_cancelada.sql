ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_valores_validos;
ALTER TABLE ventas ADD CONSTRAINT ventas_valores_validos CHECK (total >= 0 AND metodo_pago IN ('Efectivo', 'SINPE Móvil', 'Tarjeta', 'Transferencia') AND estado IN ('Completada', 'Cancelada'));
