# Respaldo y recuperación

## Base de datos

La base de datos de producción está en Neon, proyecto `holy-credit-72106115`, rama
`br-misty-silence-axx9494d`.

- Se creó la instantánea manual `antes-despliegue-secuencias-2026-11-24`.
- Identificador: `snap-cool-mode-axferppf`.
- Expira el 24 de diciembre de 2026.
- El plan actual no permite programar instantáneas automáticas desde la API de Neon.

Para recuperar datos, abrir Neon, seleccionar el proyecto y usar **Restore** sobre la
instantánea. Primero se debe restaurar en una rama nueva, comprobar conteos y totales y,
solo después de validar, promover la recuperación a producción. No restaurar directamente
sobre producción sin revisar la fecha y el alcance de los datos que se perderían.

## Código

GitHub conserva el historial principal. GitLab puede configurarse como espejo adicional,
pero no sustituye el respaldo de la base de datos. Para añadirlo se necesita crear primero
un repositorio vacío en GitLab y agregar su URL como segundo remoto.

## Comprobaciones después de recuperar

1. Abrir `/health` y confirmar que API y base de datos estén saludables.
2. Revisar productos, clientes, ventas, pedidos y desechos.
3. Comparar los totales semanal y mensual.
4. Ejecutar `npm run check` dentro de `backend`.
5. Hacer una venta de prueba controlada y verificar inventario, factura e historial.
