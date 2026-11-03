# Notificaciones push con Firebase

El sistema ya contiene los disparadores para estas notificaciones:

- pedido nuevo para administración;
- cambio de estado del pedido para el cliente;
- producto con stock bajo o agotado;
- pérdida por desecho de ₡5 000 o más;
- pruebas de pedido y stock desde **Seguridad**.

## Configuración pendiente en Firebase

1. Crear o abrir el proyecto en Firebase Console.
2. Agregar una aplicación Android con el paquete `com.sebaspiedra.verduleriajerusalen`.
3. Descargar `google-services.json` y colocarlo en `frontend/google-services.json`.
4. Agregar en `frontend/app.json`, dentro de `expo.android`:

   `"googleServicesFile": "./google-services.json"`

5. En Firebase, abrir **Configuración del proyecto > Cuentas de servicio**, generar una clave privada y configurar en el backend de Vercel:

   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

   También se admite una sola variable `FIREBASE_SERVICE_ACCOUNT_JSON` con el JSON completo.

6. Volver a desplegar el backend y generar una nueva compilación Android con EAS. No se debe subir la clave privada al repositorio.

## Demostración

1. Ingresar con la cuenta sandbox administrativa.
2. Abrir **Seguridad > Notificaciones importantes**.
3. Presionar **Activar notificaciones en este dispositivo**.
4. Usar las pruebas locales para comprobar permisos y presentación.
5. Usar **Firebase: pedido nuevo** y **Firebase: stock bajo** para comprobar el recorrido servidor → Firebase → teléfono.

Las pruebas del sandbox están permitidas porque no alteran productos, cantidades, ventas ni pedidos.
