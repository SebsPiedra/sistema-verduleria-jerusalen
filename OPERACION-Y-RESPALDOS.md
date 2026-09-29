# Operación, monitoreo y respaldos

## Monitoreo

- El frontend incorpora Vercel Web Analytics y Speed Insights para medir visitas y Core Web Vitals.
- El backend registra cada solicitud en JSON con identificador, ruta, estado y duración. Los errores
  HTTP 500 se escriben con nivel `error` y pueden consultarse en Runtime Logs de Vercel.
- Después de cada publicación se debe revisar: `vercel logs <url> --level error --since 1h`.
- Para alertas externas permanentes se necesita vincular una cuenta de Sentry/Datadog o un Log Drain
  de Vercel Pro. Esa conexión requiere elegir proveedor, plan y credenciales del propietario.

## Respaldo de PostgreSQL

Requisitos: PostgreSQL Client Tools (`pg_dump` y `pg_restore`) y `DATABASE_URL` configurada.

1. Crear una carpeta privada fuera de Git y OneDrive.
2. Ejecutar `backend/scripts/backup-database.ps1 -OutputDirectory "D:\Respaldos-Verduleria"`.
3. Conservar al menos un respaldo diario durante 7 días y uno mensual durante 12 meses.
4. Cifrar el disco o archivo porque contiene nombres, teléfonos, correos y direcciones.
5. Probar trimestralmente la restauración en una base aislada, nunca directamente en producción.

Para restaurar en una base vacía de prueba:

```powershell
$env:DATABASE_URL = 'postgresql://usuario:clave@servidor/base-prueba?sslmode=verify-full'
pg_restore --clean --if-exists --no-owner --dbname $env:DATABASE_URL 'D:\Respaldos-Verduleria\archivo.dump'
```

## Correo

- La aplicación requiere `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM`.
- Nodemailer debe validar la conexión antes de probar recuperación de contraseña.
- Si se usa un dominio propio, publicar SPF, DKIM y DMARC con los valores entregados por el proveedor.
- La comprobación definitiva exige acceso al DNS del dominio y recibir un correo real en una cuenta de prueba.

## OneDrive

Git ya ignora `node_modules`, `dist`, `.expo` y `.vercel`, pero eso no impide que OneDrive los sincronice.
La solución segura es guardar el repositorio fuera de OneDrive, por ejemplo en `C:\Proyectos\Verduleria`,
o excluir manualmente esas carpetas desde la configuración de sincronización. No se debe mover el proyecto
automáticamente mientras Visual Studio Code o procesos de Node estén abiertos.

