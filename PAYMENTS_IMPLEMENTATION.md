# 📋 IMPLEMENTACIÓN DE PAGOS - DIVIDELO

## ✅ Componentes Implementados

### Frontend (Next.js)
| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `/apps/web/app/api/payments/checkout/route.ts` | Proxy API para llamar al backend | ✅ Creado |
| `/apps/web/app/checkout/page.tsx` | Página de procesamiento de pago | ✅ Creada |
| `/apps/web/app/payment/success/page.tsx` | Página de éxito | ✅ Creada |
| `/apps/web/app/payment/failure/page.tsx` | Página de fallo | ✅ Creada |
| `/apps/web/app/payment/pending/page.tsx` | Página de pendiente | ✅ Creada |
| `/apps/web/app/api/payments/webhooks/[provider]/route.ts` | Webhook handler | ✅ Creado |
| `/apps/web/components/checkout/PriceBreakdown.tsx` | Actualizado con llamada real | ✅ Modificado |

### Backend (NestJS) - Ya existente
| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `payments.controller.ts` | Endpoints REST | ✅ Existente |
| `payments.service.ts` | Lógica de negocio | ✅ Existente |
| `payment-router.service.ts` | Smart routing | ✅ Existente |
| `wompi.adapter.ts` | Adapter Wompi | ✅ Existente |
| `placetopay.adapter.ts` | Adapter PlaceToPay | ✅ Existente |
| `billing-escrow.service.ts` | Sistema de escrow | ✅ Existente |

---

## 🔧 CONFIGURACIÓN REQUERIDA

### 1. Variables de Entorno (.env)

Copia `.env.example` a `.env` en ambos proyectos y configura:

**Frontend (`/apps/web/.env`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Backend (`/apps/api/.env`):**
```bash
# Wompi Sandbox
WOMPI_PUBLIC_KEY=pub_test_TU_CLAVE_PUBLICA
WOMPI_PRIVATE_KEY=prv_test_TU_CLAVE_PRIVADA
WOMPI_WEBHOOK_SECRET=tu_secreto_webhook
WOMPI_ENVIRONMENT=sandbox
WOMPI_REDIRECT_URL_SUCCESS=http://localhost:3000/payment/success
WOMPI_REDIRECT_URL_FAILURE=http://localhost:3000/payment/failure

# PlaceToPay Sandbox
PLACETOPAY_LOGIN=tu_login
PLACETOPAY_TRAN_KEY=tu_tran_key
PLACETOPAY_BASE_URL=https://test.placetopay.com/redirection
PLACETOPAY_WEBHOOK_SECRET=tu_secreto_webhook
PLACETOPAY_REDIRECT_URL_SUCCESS=http://localhost:3000/payment/success
PLACETOPAY_REDIRECT_URL_FAILURE=http://localhost:3000/payment/failure
```

### 2. Obtener Credenciales Sandbox

**Wompi:**
1. Regístrate en https://sandbox.wompi.com/
2. Ve a Configuración → API Keys
3. Copia las claves pública y privada

**PlaceToPay:**
1. Regístrate en https://test.placetopay.com/
2. Solicita credenciales de prueba
3. Configura URLs de retorno

---

## 🧪 PRUEBAS LOCALES

### Paso 1: Iniciar servicios
```bash
# Terminal 1 - Backend
cd apps/api
npm run dev

# Terminal 2 - Frontend  
cd apps/web
npm run dev
```

### Paso 2: Flujo de prueba
1. Navega a un listing: `http://localhost:3000/listings/[id]`
2. Selecciona método de pago (Nequi, PSE, etc.)
3. Haz clic en "Reservar mi cupo y pagar"
4. Serás redirigido a `/checkout` que llama al backend
5. El backend responde con `redirectUrl` del gateway
6. El frontend redirige a Wompi/PlaceToPay
7. Completa el pago en sandbox
8. El gateway redirige a `/payment/success` o `/payment/failure`

### Paso 3: Probar webhooks (ngrok)
```bash
# Instalar ngrok si no lo tienes
npm install -g ngrok

# Exponer tu localhost
ngrok http 3001

# En el dashboard de Wompi/PlaceToPay, configura:
# Webhook URL: https://tu-subdominio.ngrok.io/api/payments/webhooks/wompi
```

---

## 🚀 DESPLIEGUE EN PRODUCCIÓN

### URLs para configurar en pasarelas

**Producción:**
- Success URL: `https://tudominio.com/payment/success`
- Failure URL: `https://tudominio.com/payment/failure`
- Pending URL: `https://tudominio.com/payment/pending`
- Webhook URL: `https://tudominio.com/api/payments/webhooks/[provider]`

### Configuración en Vercel (Frontend)
1. Ve a Project Settings → Environment Variables
2. Agrega:
   - `NEXT_PUBLIC_API_URL`: URL de tu backend en Render
   - `NEXT_PUBLIC_APP_URL`: https://tudominio.com

### Configuración en Render (Backend)
1. Ve a Environment → Add Environment Variable
2. Agrega todas las variables de Wompi/PlaceToPay
3. Cambia `WOMPI_ENVIRONMENT=production` cuando tengas claves reales

---

## 🔒 SEGURIDAD

### Validaciones implementadas
- ✅ Proxy API oculta lógica sensible del frontend
- ✅ Webhooks reenviados al backend para validación de firmas
- ✅ Manejo de errores con mensajes genéricos al usuario
- ✅ Logs detallados solo en servidor

### Pendientes de producción
- [ ] Validar firma de webhooks de Wompi (X-Idempotency-Key)
- [ ] Validar firma de PlaceToPay con llave privada
- [ ] Implementar idempotencia en checkout
- [ ] Rate limiting en endpoint de checkout

---

## 📊 MONITOREO

### Logs a revisar
```bash
# Frontend (Vercel)
vercel logs --follow

# Backend (Render)
# Dashboard → Logs

# Buscar patrones:
[Webhook] Received webhook from wompi
Error en proxy de checkout
```

### Métricas clave
- Tasa de conversión checkout → pago completado
- Tiempo promedio en gateway de pago
- Errores por proveedor (Wompi vs PlaceToPay)
- Transacciones pendientes de confirmación

---

## 🆘 SOPORTE

### Errores comunes

**"No se recibió URL de redirección"**
- Verifica que las credenciales de Wompi/PlaceToPay sean correctas
- Revisa logs del backend para ver error específico

**Webhook no llega al backend**
- Asegúrate de usar ngrok en desarrollo
- Verifica que la URL del webhook esté bien configurada en el dashboard

**Error 400 en checkout**
- Valida que `listingId`, `method` y `guestId` se estén enviando

### Contactos
- Soporte Wompi: soporte@wompi.com
- Soporte PlaceToPay: https://placetopay.com/contacto

---

**Fecha de implementación:** $(date +%Y-%m-%d)
**Versión:** 1.0.0
