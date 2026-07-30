
Actúa como un Arquitecto de Soluciones Senior, Product Manager Financiero y Abogado Tech especializado en marketplaces y economía colaborativa en Colombia.

Necesito que actualices el "Plan Empresarial y Técnico" de nuestra plataforma de compartir suscripciones (modelo tipo Spliiit adaptado a Colombia) integrando los siguientes ajustes críticos derivados de nuestra validación de costos y modelado financiero:

### 1. AJUSTES AL MODELO FINANCIERO Y DE NEGOCIO

- **Nuestras Unit Economics Reales:** Actualiza el cálculo del margen de contribución. El costo de pasarela debe incluir el 19% de IVA sobre la comisión y un fee fijo real de $900 - $1.000 COP.
- **Nueva Estructura de Fees al Huésped:** Para mantener un margen de contribución positivo (superior a $1.000 COP por transacción), ajusta el fee fijo de la plataforma cobrado al huésped de $900 a $1.800 COP (manteniendo el 8% de take rate). Explica este cambio como "Tarifa de Protección y Gestión de Pago".
- **Modelo de Payouts Acumulados (Escrow Mensual):** Cambia la política de pagos a anfitriones. El dinero no se libera de inmediato. Los fondos recaudados del 1 al 30 de cada mes pasan por un periodo de garantía de 72 horas y se consolidan. El payout masivo a los anfitriones se ejecuta automáticamente el día 5 del mes siguiente.
- **Válvula de Escape (Retiro Express):** Define una funcionalidad de "Retiro Express" para anfitriones que necesiten liquidez inmediata (antes del día 5), aplicando un fee de $3.500 COP por transacción de retiro individual.

### 2. ACTUALIZACIÓN TÉCNICA Y ESQUEMA DE BASE DE DATOS (LEDGER)

- Diseña el esquema de PostgreSQL para el módulo de Billing & Escrow adaptado al nuevo modelo de payout acumulado.
- Define las tablas `wallets` y `ledger_entries` (contabilidad de doble entrada simplificada).
- Especifica los estados estrictos del saldo en la wallet del anfitrión:
  1. `pending` (Dinero recibido, en ventana de 72h de protección o esperando cierre de mes).
  2. `available` (Dinero liberado y listo para el payout del día 5).
  3. `locked` (Dinero retenido por disputa activa).
- Proporciona el código SQL para crear estas tablas con las restricciones (constraints) necesarias para evitar saldos negativos y garantizar la integridad transaccional.

### 3. FLUJOS DE USUARIO (UX) Y PANEL DE ANFITRIÓN

- Describe cómo debe verse la sección de "Wallet / Mis Ingresos" en el panel del anfitrión para que entienda perfectamente el modelo acumulado sin generar fricción o desconfianza.
- Define los textos (copywriting) para los estados de saldo (Pendiente, Disponible, En Disputa) y para explicar la fecha del próximo payout.

### 4. MARCO LEGAL Y TÉRMINOS Y CONDICIONES (COLOMBIA)

- Redacta la cláusula específica para los Términos y Condiciones que legalice el modelo de "Retención y Payout Acumulado" (Escrow).
- La cláusula debe dejar claro que la plataforma actúa como agente de retención temporal, que los fondos están protegidos, y que el ciclo de liquidación es mensual (día 5), blindando a la plataforma ante reclamaciones de los anfitriones por "retención indebida de fondos" y cumpliendo con las buenas prácticas para no ser clasificado como entidad financiera por la SFC.

### FORMATO DE SALIDA ESPERADO:

Por favor, entrégame la respuesta estructurada en las siguientes 4 secciones claras:

1. Resumen de Nuevas Unit Economics (Tabla comparativa antes/después).
2. Esquema de Base de Datos (Código SQL para Postgres del Ledger/Wallet).
3. Especificación de UX para el Panel del Anfitrión (Copy y flujos).
4. Cláusula Legal de Retención y Payout (Texto listo para T&C).

Mantén un tono profesional, técnico y adaptado a la realidad regulatoria y de mercado de Colombia.
