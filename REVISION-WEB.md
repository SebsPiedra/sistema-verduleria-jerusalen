# Revisión de la aplicación web · 4 de septiembre de 2026

Proyecto: Expo Web y Express de Visual Studio Code. No se modificó la aplicación Visual Basic.

## Cambios

- Estilo compartido para 22 pantallas: verde petróleo, fondos claros, bordes y botones uniformes.
- Menú administrativo agrupado, con panel superpuesto y cierre en teléfonos/tabletas.
- Navegación común del cliente: inicio, catálogo, pedidos y carrito.
- Menos textos explicativos repetidos; ayuda desplegable y advertencias de cálculo conservadas.
- Ocho tablas mantienen sus columnas legibles mediante desplazamiento horizontal interno.
- Campos de 16 px, objetivos táctiles mayores, foco visible y respeto a movimiento reducido.
- Inicialización del diseño después de montar para evitar tamaños incorrectos en la exportación estática.
- Carrito sin ventanas emergentes repetidas, validación de stock cero y copia independiente de artículos.
- Mensajes visibles al fallar consultas del cliente y al cargar parcialmente las estadísticas.

## Correcciones de datos y acceso

- Middleware valida JWT y rol en base de datos para las operaciones privadas.
- Clientes solo consultan sus propios pedidos y solo realizan pedidos con su identificación.
- Catálogo y registro/inicio de sesión permanecen públicos.
- Frontend envía la sesión en las consultas y redirige al login si vence.
- Transacciones independientes por solicitud, sin conexión global compartida.
- Bloqueo transaccional protege la numeración heredada MAX + 1.
- Venta manual completa en una transacción: venta, detalle e inventario.
- Registro de clientes transaccional y validación de correo reforzada.
- Rechazo de cantidades no finitas y líneas duplicadas en ventas/pedidos.
- Verificación del certificado TLS en la conexión PostgreSQL principal.

## Pruebas

`npx tsc --noEmit` y `npx eslint src --quiet`: sin errores.
Exportación Expo: 26 rutas generadas.

En la rama Neon aislada (nunca con ventas ficticias en producción):

- `backend/scripts/test-access.cjs`: seis módulos con administrador, rechazo anónimo/cliente,
  pedidos propios permitidos, consulta cruzada rechazada y tres transacciones concurrentes aisladas.
- `backend/scripts/test-purchase.cjs`: registro, login, venta manual, datos de factura, pedido,
  aceptación por administrador y descuento de stock una sola vez al repetir aceptación.
- Pruebas mensuales: cálculo, límites de mes, cortes conservados y PDF.
- Navegador: pantallas administrativas a 320, 768 y 1440 px; cliente a 320 y 390 px.
  Sin desbordamiento del ancho de página en el recorrido. Las tablas anchas se desplazan internamente.
- Carrito comprobado mediante botones en navegador. No se enviaron mensajes de WhatsApp ni correos de prueba.

Los scripts de revisión locales solo escuchan en 127.0.0.1 y rechazan otra base de datos.
Los registros de prueba se conservan únicamente en la rama aislada.

## Límites y pendientes

No es una garantía de ausencia absoluta de errores. Falta probar en dispositivos físicos
Safari/iOS y Android, y completar una auditoría independiente de seguridad y accesibilidad.
La revisión SMTP no envió correos reales ni alteró credenciales.

`npm audit --omit=dev` del backend detectó 3 dependencias con avisos: mysql2 y qs
(moderados), nodemailer (alto; actualización mayor necesaria según npm). El frontend
también contiene alertas de dependencias heredadas. No se ejecutó `audit fix --force` ni
se actualizó Expo de versión mayor. Estos avisos permanecen pendientes, no resueltos.

No se realizó commit ni push a GitHub en esta revisión.

## Publicación comprobada

- Frontend en producción: https://frontend-verduleria.vercel.app — READY.
  Despliegue: `dpl_BjW42qEoTkyVikrRGPZWv39ggdyS` (Expo Web).
- Backend en producción: https://backend-verduleria.vercel.app — READY.
  Despliegue: `dpl_2DxEg4trW9oMuwwfLNj75p92adXs` (Express).
- Publicados desde el estado local revisado, sin nuevo commit de Git.
- Verificación posterior: acceso administrativo, rechazo anónimo, catálogo de 62 productos,
  resumen mensual y cortes guardados correctos.
- Corte real de septiembre conservado; PDF descargado y validado: 10 400 bytes.
- Login de escritorio y catálogo móvil inspeccionados en producción; catálogo a 390 px
  sin desbordamiento de página ni errores JavaScript registrados en ese recorrido.
- Bundle publicado usa la API canónica; no contiene la API local de pruebas.
- Consulta de logs HTTP 500 del backend en los últimos 10 minutos: sin registros encontrados.
  Es una comprobación puntual, no monitoreo continuo; no se auditaron los drains.

## Ajuste de espacios señalado en capturas

- `ResponsiveTable` mide su contenedor real y asigna ese ancho a las filas, con un
  mínimo de 900 px solo para conservar columnas legibles en espacios estrechos.
- Historial utiliza todo el ancho; la factura se abre en un modal con desplazamiento
  vertical y cierre accesible, sin reservar una tarjeta vacía.
- Las tarjetas de estadísticas mantienen su altura natural, sin estirarse a la altura
  de la tarjeta contigua.
- TypeScript, ESLint de los tres archivos y exportación de 26 rutas: correctos.
- Ocho pantallas recorridas a 390 px sin desbordamiento de página; tablas con scroll interno.
- Siete pantallas recorridas a 1600 px sin controles fuera de pantalla.
- Factura abierta mediante botón e inspeccionada visualmente a 1600 y 390 px.
- Pruebas sobre rama aislada, sin modificar datos de producción.
- Ajuste publicado: `dpl_D9kn9pg9TzWQLv5hCNpbqK1Xtjd7`, READY, en la URL canónica
  del frontend. Bundle público comprobado: modal nuevo presente, API canónica y sin API local.

## Pedidos recientes y revisión final — 28 de septiembre de 2026

- La vista del cliente ahora presenta los pedidos del más reciente al más antiguo, con filtros
  por estado, resumen compacto, seguimiento contextual y acciones con nombres más directos.
- El detalle muestra los productos bajo demanda y comunica su estado de carga; la información
  técnica de inventario dejó de mostrarse al cliente.
- El diseño se compactó y centró para escritorio y celular. Se verificó a 1440 y 390 px;
  a 390 px el ancho del documento coincide con la pantalla y no aparece desplazamiento lateral.
- Se recorrieron las cuatro rutas de cliente y once módulos administrativos a 390 px. Las tablas
  extensas permanecen dentro de su contenedor desplazable.
- `npx tsc --noEmit`, `npx eslint src --quiet`, `npx expo-doctor` (18/18) y la exportación de
  las 26 rutas terminaron correctamente.
- Se alinearon los parches de Expo 54 y `expo-asset`; la exportación web volvió a quedar estable.

### Trabajo recomendado para una versión de producción más madura

1. Actualizar dependencias con una migración controlada: quedan 21 avisos en el frontend
   (17 moderados y 4 altos) y 3 en el backend (2 moderados y 1 alto). No usar
   `npm audit fix --force` sin revisar Expo y Nodemailer.
2. Dividir el bundle web, actualmente de aproximadamente 2,18 MB, mediante carga diferida de
   rutas y componentes para acelerar conexiones móviles.
3. Añadir pruebas E2E continuas para login, compra, aceptación, factura y resumen mensual,
   ejecutadas automáticamente antes de cada publicación.
4. Completar pruebas físicas en Safari/iOS y Android, además de navegación por teclado,
   lector de pantalla, contraste y foco de modales.
5. Configurar monitoreo de errores, métricas de rendimiento y alertas; hoy existen registros,
   pero no vigilancia continua.
6. Documentar y probar restauración de copias de la base de datos, retención de datos personales
   y entrega real de correo (SPF/DKIM y recuperación de contraseña).
7. Evitar sincronizar `node_modules`, `dist` y `.vercel` con OneDrive para reducir bloqueos y
   problemas de instalación en el entorno de desarrollo.

La mejora de pedidos recientes quedó publicada en el frontend canónico mediante el despliegue
`dpl_CsMGA8uknpiNp2GMJh2DsEtW7hJD` (READY). El bundle público contiene la interfaz nueva,
apunta a la API canónica y no contiene la dirección local de pruebas. La raíz del backend
respondió HTTP 200 y el frontend no registró errores en el escaneo puntual posterior.

## Seguimiento técnico — 28 de septiembre de 2026

- Se corrigió “En entrega”: ahora se habilita para pedidos a domicilio aceptados o en preparación.
  Los pedidos entregados siguen siendo terminales y no pueden retroceder de estado.
- Se retiró el total monetario acumulado de la pantalla “Pedidos recientes” del cliente.
- Prueba aislada completa: aceptar pedido, pasarlo a “En entrega”, repetir la operación sin un
  segundo descuento de inventario y rechazar líneas duplicadas. Resultado: PASS.
- El bundle web bajó de 2,19 MB a 1,40 MB al sustituir la ruta demostrativa `explore` por una
  redirección liviana y retirar dependencias explícitas sin uso.
- Backend: Nodemailer actualizado a 10.0.12 y `npm audit --omit=dev` quedó en 0 avisos.
- Frontend: el ajuste seguro bajó de 21 a 17 avisos. Se probó Expo 56, pero Expo Doctor detectó
  una regresión conocida de memoria en Hermes; se restauró Expo 54 y volvió a aprobar 18/18.
  La eliminación total requiere migrar a Expo 57 y probar Android/iOS físicamente.
- Se añadieron Web Analytics y Speed Insights, además de registros JSON por solicitud en el backend.
- Se añadió `.github/workflows/quality.yml` para comprobar compilación, tipos y lint en cada push/PR.
- Se añadió `OPERACION-Y-RESPALDOS.md`, un script de respaldo PostgreSQL y una prueba SMTP sin envío.
- Las variables SMTP existen en Vercel, pero la verificación DNS devolvió `ENOTFOUND`: `SMTP_HOST`
  no contiene actualmente un nombre resoluble. SPF/DKIM tampoco puede validarse hasta corregir el
  servidor y confirmar qué dominio/proveedor se utilizará.
- Frontend `dpl_2i97HZFbNQv3KXSQsTAJru4pjaDu` y backend
  `dpl_D56HVFGpw9phgTVYpuEG4fCzACo5` publicados y promovidos. Ambos respondieron HTTP 200;
  el escaneo puntual posterior no encontró errores de runtime.
