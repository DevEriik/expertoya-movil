# Pasarela de pagos mobile — DAN-22

Este documento describe la integración mobile con Mercado Pago Checkout Pro y el puente de retorno automático implementado en el backend.

---

## 1. Arquitectura y Flujo

1. **Consulta inicial**: La pantalla `/pagos/[solicitudId]` consulta `GET /api/payments/solicitud/:solicitudId` (requiere token JWT de Cliente, Profesional o Admin).
2. **Preferencia de pago**: El cliente genera la preferencia con `POST /api/payments/preferences` con `{ solicitud_id }`.
3. **Checkout Pro**: La app abre `init_point` o `sandbox_init_point` con `WebBrowser.openBrowserAsync`.
4. **Retorno desde Mercado Pago (Puente Backend)**:
   - Mercado Pago redirige a `https://<APP_PUBLIC_URL>/pago/:status` (`success`, `failure`, `pending`).
   - El backend valida `:status`, extrae el UUID de la solicitud a partir de `external_reference` (`<uuid>-<timestamp>`), y responde una página HTML segura que redirige automáticamente a:
     ```text
     expertoyamovil://pago/:status?solicitudId=<uuid>&solicitud_id=<uuid>&external_reference=<raw>&payment_id=<id>&mp_status=<status>
     ```
   - Si no hay ID válido, la app muestra un error controlado sin romperse ("No pudimos identificar la solicitud").
5. **Recepción en Mobile (`/pago/[status].tsx`)**:
   - Lee los parámetros con prioridad: `solicitudId` (UUID válido) -> `solicitud_id` (UUID válido) -> `external_reference` (extracción de UUID).
   - Redirige internamente a `/pagos/[solicitudId]` activando el polling de verificación (`fromCheckout=true`).
6. **Sincronización en tiempo real**:
   - Webhook de Mercado Pago notifica al backend.
   - Backend valida firma HMAC, marca el pago `RETENIDO`, genera el comprobante digital PDF y emite el evento `pago:retenido` por Socket.io a las salas `usuario_<id>` y `user:<id>`.
   - La app escucha `pago:retenido` y actualiza la UI a `RETENIDO` en tiempo real.
   - De respaldo, la app cuenta con:
     - Polling cada 3 segundos durante 30 segundos (`usePaymentDetails`).
     - Refresco automático al volver a primer plano (`AppState.addEventListener("change", ...)`).
7. **Doble confirmación (Escrow)**:
   - Cliente y profesional confirman con `POST /api/payments/solicitud/:solicitudId/confirm`.
   - Cuando ambas partes confirman, el backend pasa el pago a `LIBERADO`, finaliza la solicitud y genera el payout.
8. **Comprobante digital**:
   - Se abre desde `comprobante_url` vía `WebBrowser.openBrowserAsync`.

---

## 2. Variables de entorno

```env
EXPO_PUBLIC_API_URL=https://<TUNEL_O_DOMINIO_BACKEND>
EXPO_PUBLIC_MP_ENV=sandbox
```

- Si `EXPO_PUBLIC_MP_ENV` vale `production`, la app usa `init_point`.
- Si no está definida o vale `sandbox`, usa `sandbox_init_point`.

---

## 3. Requisito de ejecución: Development Build

> [!IMPORTANT]
> El scheme personalizado `expertoyamovil://` requiere una **Development Build** de Android (`npx expo run:android` o APK generado con EAS). **Expo Go no soporta schemes personalizados** y no interceptará el deep link de retorno.

Para compilar la development build:
```bash
# Localmente con Android Studio / adb
npx expo run:android

# O mediante EAS Build
eas build --profile development --platform android
```

---

## 4. Pruebas de Deep Link con ADB

Podés verificar la respuesta de la app ante el deep link directamente por terminal:

```bash
# Caso 1: Retorno exitoso
adb shell am start -W -a android.intent.action.VIEW \
  -d "expertoyamovil://pago/success?solicitudId=220bdc40-ee9b-43ca-a2f7-1df8b0417c9b&solicitud_id=220bdc40-ee9b-43ca-a2f7-1df8b0417c9b&external_reference=220bdc40-ee9b-43ca-a2f7-1df8b0417c9b-1731760000000&payment_id=188860478443&mp_status=approved"

# Caso 2: Solo external_reference
adb shell am start -W -a android.intent.action.VIEW \
  -d "expertoyamovil://pago/success?external_reference=220bdc40-ee9b-43ca-a2f7-1df8b0417c9b-1731760000000&payment_id=188860478443"

# Caso 3: Pago fallido o pendiente
adb shell am start -W -a android.intent.action.VIEW \
  -d "expertoyamovil://pago/failure?solicitudId=220bdc40-ee9b-43ca-a2f7-1df8b0417c9b&mp_status=rejected"

# Caso 4: Sin ID válido (error controlado)
adb shell am start -W -a android.intent.action.VIEW \
  -d "expertoyamovil://pago/success"
```

---

## 5. Checklist de Verificación de Calidad

- [x] Contrato tipado con el backend en `src/services/payments.ts`.
- [x] Prioridad de IDs: `solicitudId` -> `solicitud_id` -> `external_reference`.
- [x] Pantalla de error controlado cuando falta el ID de solicitud.
- [x] Polling automático al volver de Mercado Pago (`fromCheckout=true`).
- [x] Recepción del evento Socket.io `pago:retenido`.
- [x] Respaldo de actualización por `AppState`.
- [x] `npm run lint` sin errores.
- [x] `npx expo export --platform android` correcto.
