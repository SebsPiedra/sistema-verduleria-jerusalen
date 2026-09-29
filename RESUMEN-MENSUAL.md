# Resumen mensual — versión web

Implementado en frontend (Expo/React Native Web) y backend (Express/PostgreSQL).
No pertenece a VerduleriaStudio / Visual Basic.

## Uso

1. Iniciar sesión como administrador y abrir **Resumen mensual**.
2. Escribir el mes en formato AAAA-MM y pulsar **Consultar mes**.
3. Revisar ingresos, costo de ventas, pérdidas por desechos y gastos adicionales.
4. Registrar gastos operativos con fecha, concepto y monto. No repetir las compras
   de inventario: se descuenta el costo de los productos vendidos automáticamente.
5. Pulsar **Guardar corte** para conservar una fotografía completa en PostgreSQL.
6. Pulsar **Descargar PDF del corte**. El PDF se puede imprimir desde su lector.
7. En **Cortes guardados**, abrir cualquier corte anterior. No se reemplaza al
   registrar o anular gastos. Para reflejar cambios, guardar otro corte.

La consulta se actualiza al entrar y cada minuto mientras la pantalla está activa.
Los datos operativos existentes permanecen en sus tablas; los gastos y cortes nuevos
se almacenan en `gastos_mensuales` y `cortes_mensuales`.

## Criterios del cálculo

Ganancia estimada = ventas completadas/pagadas - costo vendido - desechos vigentes
- gastos adicionales vigentes. Los pedidos vinculados a una venta no se suman otra
vez. Los pedidos pendientes no son ingresos. Cancelaciones/anulaciones no se suman.

Desde la migración, cada nueva línea de venta conserva su costo de compra mediante
un trigger, tanto en ventas manuales como en ventas generadas desde pedidos.
Las líneas anteriores sin costo histórico usan el precio de compra actual y se
marcan como estimadas. Se advierte sobre líneas sin costo y ventas sin detalle.
No se ha inventado ni sobrescrito ningún costo histórico.

Se usan las fechas calendario que ya guarda la aplicación (columnas sin zona
horaria), con límites inclusivo al iniciar el mes y exclusivo al iniciar el siguiente.
Los cortes muestran hora de generación de Costa Rica. No se modificaron fechas antiguas.
Inventario, clientes y proveedores son una fotografía al consultar/guardar, no una
reconstrucción del último día de un mes anterior. No hay cierre automático programado:
el administrador debe guardar el corte. La ganancia es estimada, antes de impuestos
o gastos no registrados, y no representa el efectivo disponible.

PDF descargable implementado para la versión web, incluidos navegadores de teléfono.
En aplicaciones nativas se indica abrir la versión web para descargar.

## Seguridad y consistencia

Todas las rutas `/api/resumen-mensual` requieren JWT administrativo y validación
del rol en PostgreSQL. Se necesita `JWT_SECRET` configurado, sin fallback para estos
informes. Los datos del corte se calculan en el servidor, nunca desde totales enviados
por el navegador. Lecturas y guardado usan una conexión y transacción independientes.
Los identificadores de solicitud evitan duplicar operaciones al reintentar.
Los gastos se anulan conservando su registro; no se eliminan desde la pantalla.

## Activación en producción — completada el 4 de septiembre de 2026

La migración aditiva se aplicó en la base de producción conservando los registros.
Backend publicado: https://backend-verduleria.vercel.app
Frontend publicado: https://frontend-verduleria.vercel.app
Se guardó un corte real de septiembre de 2026 y se verificó su PDF (10 400 bytes).
No se agregaron ventas ni gastos ficticios a producción. Se corrigió el empaquetado
de las fuentes estándar de PDFKit para que la descarga funcione en Vercel.
La ruta web responde HTTP 200 y su JavaScript usa la API de producción, no la local.

Para futuras publicaciones:

1. Verificar `vercel whoami` y los enlaces existentes de cada carpeta `.vercel`.
2. En `backend`, confirmar que `.env` apunta a la base de producción esperada y
   ejecutar `node scripts/migrate-monthly.js`. Es una migración aditiva y transaccional.
   El script usa conexión directa, no pooling, para la migración.
3. Publicar el backend existente con `vercel --prod` y comprobar autenticación y reporte.
4. En `frontend`, ejecutar `npx expo export --platform web --clear` sin
   `EXPO_PUBLIC_API_URL` de pruebas y luego publicar el frontend con `vercel --prod`.
   Limpiar la caché evita reutilizar una URL local de una compilación de pruebas.
   La API predeterminada sigue siendo `https://backend-verduleria.vercel.app/api`.
5. Comprobar el flujo con una sesión real de administrador. No crear gastos ficticios
   ni ventas de prueba en producción.

No subir `.env` ni `.vercel/monthly-test.env` a GitHub.

## Pruebas realizadas

- TypeScript: `npx tsc --noEmit` sin errores.
- Expo: exportación web correcta, incluyendo la ruta nueva.
- Migración probada en rama Neon aislada `codex-resumen-mensual-20260903`.
- Pruebas backend: límites de mes, ventas canceladas, pedido sin duplicar ingreso,
  costo histórico fijado, cálculo de ganancia, autenticación, fechas inválidas,
  reintentos de gasto/corte, corte inmutable tras anulación y respuesta PDF.
- Flujo visual en navegador: consulta, gasto, cambio de totales, corte y vista móvil.
- Descarga de PDF comprobada desde el botón en el navegador.
- Despliegue frontend: npm informó 31 vulnerabilidades (18 moderadas y 13 altas).
  Queda pendiente una revisión de dependencias separada; no se hicieron actualizaciones
  mayores automáticas durante esta publicación.
- `npm install` avisó de 4 vulnerabilidades en las dependencias (2 moderadas y 2
  altas). La consulta detallada de `npm audit` agotó el tiempo de red; no se aplicaron
  actualizaciones mayores ni se afirma haber completado una auditoría de seguridad.

La rama de pruebas se conserva para continuar la verificación. Sus datos ficticios
no están en producción. `backend/scripts/test-monthly.js` comprueba explícitamente
el host de esa rama antes de ejecutar, y revierte los fixtures de ventas.
El archivo de conexión de pruebas queda ignorado dentro de `.vercel`.
