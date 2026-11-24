-- Resincronización final después de retirar las asignaciones MAX(id) + 1.
-- Es segura para ejecutar nuevamente: nunca reduce una secuencia por debajo del ID máximo.
SELECT setval('usuarios_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM usuarios), 1), EXISTS (SELECT 1 FROM usuarios));
SELECT setval('clientes_id_cliente_seq', GREATEST((SELECT COALESCE(MAX(id_cliente), 0) FROM clientes), 1), EXISTS (SELECT 1 FROM clientes));
SELECT setval('productos_id_producto_seq', GREATEST((SELECT COALESCE(MAX(id_producto), 0) FROM productos), 1), EXISTS (SELECT 1 FROM productos));
SELECT setval('ventas_id_venta_seq', GREATEST((SELECT COALESCE(MAX(id_venta), 0) FROM ventas), 1), EXISTS (SELECT 1 FROM ventas));
SELECT setval('detalle_ventas_id_detalle_seq', GREATEST((SELECT COALESCE(MAX(id_detalle), 0) FROM detalle_ventas), 1), EXISTS (SELECT 1 FROM detalle_ventas));
SELECT setval('pedidos_id_pedido_seq', GREATEST((SELECT COALESCE(MAX(id_pedido), 0) FROM pedidos), 1), EXISTS (SELECT 1 FROM pedidos));
SELECT setval('detalle_pedidos_id_detalle_seq', GREATEST((SELECT COALESCE(MAX(id_detalle_pedido), 0) FROM detalle_pedidos), 1), EXISTS (SELECT 1 FROM detalle_pedidos));
SELECT setval('desechos_id_desecho_seq', GREATEST((SELECT COALESCE(MAX(id_desecho), 0) FROM desechos), 1), EXISTS (SELECT 1 FROM desechos));

