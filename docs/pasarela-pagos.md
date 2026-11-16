# Pasarela de pagos mobile — DAN-22

Este documento describe la integración mobile con Mercado Pago Checkout Pro y el único punto que queda pendiente del lado backend.

## Flujo implementado

1. La pantalla `/pagos/[solicitudId]` consulta `GET /api/payments/solicitud/:solicitudId`.
2. El cliente genera la preferencia con `POST /api/payments/preferences`.
3. La app abre `init_point` o `sandbox_init_point` con `WebBrowser.openBrowserAsync`.
4. Al cerrar el navegador, la app refresca el estado e inicia polling cada 3 segundos durante 30 segundos.
5. La app también escucha el evento `pago:retenido` por Socket.io y refresca al volver a primer plano.
6. Cliente y profesional confirman con `POST /api/payments/solicitud/:solicitudId/confirm`.
7. Cuando ambas partes confirman, el backend libera el pago y crea el payout.
8. El comprobante se abre desde `comprobante_url` cuando está disponible.

## Variables de entorno

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_MP_ENV=production
```

- Si `EXPO_PUBLIC_MP_ENV` no está definida, la app usa `sandbox_init_point`.
- Si vale `production`, la app usa `init_point`.

## Punto pendiente: retorno automático por deep link

El backend configura las `back_urls` de Mercado Pago así:

```text
https://<APP_PUBLIC_URL>/pago/success
https://<APP_PUBLIC_URL>/pago/failure
https://<APP_PUBLIC_URL>/pago/pending
```

Esas URLs son `https`, no usan el scheme mobile `expertoyamovil://`.

Por ese motivo, el retorno automático a la app no está garantizado únicamente con el deep link. La app cubre el caso con:

- refresco al cerrar el navegador
- polling del estado del pago
- evento `pago:retenido`
- refresco al volver la app a primer plano

La ruta `src/app/pago/[status].tsx` ya existe para manejar `/pago/success`, `/pago/failure` y `/pago/pending`, pero solo se activará si el backend o el dominio quedan configurados para abrir la app.

Para completar el retorno automático hay dos opciones:

1. Que el backend permita `back_urls` con el scheme de la app.
2. Que `APP_PUBLIC_URL` sea un dominio con Universal Links / App Links configurados.

Hasta que eso se defina, el flujo actual funciona sin asumir que el pago fue aprobado y sin depender del retorno del navegador.

## Probar en desarrollo

1. Instalar dependencias:

```bash
npm install
```

2. Definir `EXPO_PUBLIC_API_URL` apuntando al backend.
3. Iniciar la app:

```bash
npm start
```

4. Entrar a una solicitud aceptada y tocar `Gestionar pago`.
5. Crear la preferencia y abrir el checkout.
6. Volver a la app y verificar que el estado pase de `PENDIENTE` a `RETENIDO`.

Sin credenciales reales de Mercado Pago configuradas en backend, el checkout real no funciona. En ese caso se puede probar el resto del flujo con datos de prueba o mocks.
