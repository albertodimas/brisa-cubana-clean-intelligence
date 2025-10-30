# SISTEMA DE TRACKING FINANCIERO

**BRISA CUBANA CLEAN INTELLIGENCE**

**Versión:** 1.0
**Fecha:** 2025-10-30

---

## INTRODUCCIÓN

Este documento describe el sistema de tracking financiero para Brisa Cubana durante la fase piloto y operación inicial. El sistema está diseñado para ser:

- ✅ **Simple:** Fácil de mantener diariamente
- ✅ **Completo:** Captura todos los ingresos y gastos
- ✅ **Escalable:** Puede migrar a QuickBooks u otro software contable en el futuro
- ✅ **Reportable:** Genera métricas clave para toma de decisiones

---

## COMPONENTES DEL SISTEMA

### 1. Registro de Ingresos (Income Log)

Todos los servicios facturados y pagos recibidos

### 2. Registro de Gastos (Expense Log)

Todos los costos operativos y de negocio

### 3. Registro de Adelantos y Pagos Parciales

Tracking de depósitos, adelantos y balances pendientes

### 4. Reporte de Flujo de Efectivo (Cash Flow)

Vista consolidada de entradas y salidas

### 5. Dashboard de Métricas Clave (KPIs)

Indicadores de salud financiera del negocio

---

## ESTRUCTURA DE ARCHIVOS

```
docs/financials/
├── 2025/
│   ├── 2025-Q4-financial-tracker.xlsx
│   ├── 2025-10-income.csv
│   ├── 2025-10-expenses.csv
│   └── monthly-reports/
│       └── 2025-10-report.pdf
├── templates/
│   ├── spreadsheets/
│   │   ├── income-template.csv
│   │   ├── expense-template.csv
│   │   ├── cashflow-template.csv
│   │   └── README.md
│   └── monthly-report-template.md
├── receipts/
│   ├── 2025-10/
│   └── 2025-11/
└── invoices/
    ├── sent/
    └── paid/
```

> Las planillas base (`docs/templates/spreadsheets/`) ya incluyen encabezados y ejemplos. Duplica el archivo antes de personalizarlo para cada mes.

---

## 1. REGISTRO DE INGRESOS

### Información a Capturar por Cada Transacción:

| Campo                 | Descripción                        | Ejemplo                                    |
| --------------------- | ---------------------------------- | ------------------------------------------ |
| **ID de Factura**     | Número único de factura            | INV-2025-001                               |
| **Fecha de Servicio** | Cuándo se realizó el servicio      | 2025-10-15                                 |
| **Fecha de Factura**  | Cuándo se emitió la factura        | 2025-10-15                                 |
| **Fecha de Pago**     | Cuándo se recibió el pago          | 2025-10-17                                 |
| **Cliente**           | Nombre del cliente                 | Juan Martínez                              |
| **Propiedad**         | Dirección o nombre de la propiedad | Villa Coral, Playa del Carmen              |
| **Tipo de Servicio**  | Categoría del servicio             | Turnover / Deep Clean / Recurrente         |
| **Descripción**       | Detalles específicos               | Turnover 2 recámaras + lavandería          |
| **Subtotal**          | Monto antes de impuestos           | $800.00 MXN                                |
| **IVA (16%)**         | Impuesto sobre el valor agregado   | $128.00 MXN                                |
| **Total**             | Monto total facturado              | $928.00 MXN                                |
| **Método de Pago**    | Cómo se pagó                       | Transferencia / PayPal / Efectivo / Stripe |
| **Status**            | Estado actual                      | Pendiente / Pagado / Vencido / Cancelado   |
| **Días para Pago**    | Términos de pago                   | 0 (inmediato) / 15 / 30                    |
| **Notas**             | Comentarios adicionales            | Incluye reposición de amenidades           |

### Template de Excel: Hoja "INGRESOS"

```
| ID Factura | Fecha Servicio | Fecha Factura | Fecha Pago | Cliente | Propiedad | Tipo Servicio | Descripción | Subtotal | IVA | Total | Método Pago | Status | Días Pago | Notas |
|------------|---------------|---------------|------------|---------|-----------|---------------|-------------|----------|-----|-------|-------------|--------|-----------|-------|
| INV-001    | 2025-10-15    | 2025-10-15    | 2025-10-17 | Juan M. | Villa Coral | Turnover | 2BR turnover | 800.00 | 128.00 | 928.00 | Transferencia | Pagado | 2 | -- |
| INV-002    | 2025-10-16    | 2025-10-16    |            | María L.| Casa Centro | Deep Clean | Deep clean 3BR | 1500.00 | 240.00 | 1740.00 | -- | Pendiente | 15 | -- |
```

### Fórmulas Útiles en Excel:

```excel
// Calcular IVA (16%)
=Subtotal * 0.16

// Calcular Total
=Subtotal + IVA

// Días transcurridos desde factura
=HOY() - [Fecha Factura]

// Status automático basado en pago
=SI([Fecha Pago]<>"", "Pagado", SI(HOY()-[Fecha Factura]>[Días Pago], "Vencido", "Pendiente"))

// Total de ingresos del mes
=SUMAR.SI.CONJUNTO([Total], [Fecha Pago], ">=" & FECHA(2025,10,1), [Fecha Pago], "<=" & FECHA(2025,10,31))
```

> **Tip:** duplica el archivo maestro (`docs/templates/spreadsheets/income-template.csv`) antes de editarlo para cada mes. Guarda los históricos en `docs/financials/YYYY/` y sincroniza con Google Drive.

---

## 2. REGISTRO DE GASTOS

### Categorías de Gastos:

1. **Suministros y Productos de Limpieza**
   - Productos químicos (desinfectantes, desengrasantes, etc.)
   - Paños, esponjas, cepillos
   - Bolsas de basura
   - Equipo desechable (guantes, cubrebocas)

2. **Equipo y Herramientas**
   - Aspiradoras, mopas, cubetas
   - Escaleras, bancos
   - Herramientas eléctricas
   - Equipos de seguridad

3. **Amenidades para Clientes**
   - Jabones, shampoos, acondicionadores
   - Papel higiénico, papel de cocina
   - Detergentes
   - Amenidades especiales (café, té, etc.)

4. **Transporte**
   - Gasolina
   - Mantenimiento de vehículos
   - Uber/transporte público
   - Estacionamiento

5. **Personal**
   - Salarios
   - Bonos
   - Uniformes
   - Capacitación

6. **Servicios Subcontratados**
   - Lavandería profesional
   - Mantenimiento especializado
   - Asistencia externa

7. **Tecnología y Software**
   - Hosting de sitio web
   - Subscripciones (Vercel, Sentry, etc.)
   - Equipo de cómputo
   - Celulares/tablets

8. **Marketing y Publicidad**
   - Tarjetas de presentación
   - Material impreso
   - Anuncios online
   - Fotografía profesional

9. **Administrativo y Legal**
   - Honorarios contables
   - Honorarios legales
   - Papelería
   - Seguros

10. **Otros Gastos Operativos**
    - Electricidad, agua (si aplica)
    - Alquiler de espacio de almacenamiento
    - Licencias y permisos
    - Gastos bancarios

### Template de Excel: Hoja "GASTOS"

```
| ID Gasto | Fecha | Categoría | Subcategoría | Proveedor | Descripción | Subtotal | IVA | Total | Método Pago | Factura? | # Factura | Cliente Asignado | Recibo/Comprobante | Notas |
|----------|-------|-----------|--------------|-----------|-------------|----------|-----|-------|-------------|----------|-----------|------------------|-------------------|-------|
| EXP-001 | 2025-10-15 | Suministros | Productos químicos | Home Depot | Desinfectante, desengrasante | 450.00 | 72.00 | 522.00 | Tarjeta | Sí | A12345 | -- | receipts/2025-10/001.pdf | -- |
| EXP-002 | 2025-10-16 | Amenidades | Jabones | Costco | Jabón de manos x20 | 350.00 | 56.00 | 406.00 | Efectivo | No | -- | Villa Coral | receipts/2025-10/002.jpg | Para cliente Juan |
| EXP-003 | 2025-10-17 | Transporte | Gasolina | Pemex | Gasolina | 600.00 | 96.00 | 696.00 | Efectivo | Sí | PEMX789 | -- | receipts/2025-10/003.pdf | -- |
```

### Fórmulas Útiles:

```excel
// Gasto Reembolsable (asignado a cliente específico)
=SI([Cliente Asignado]<>"", "Reembolsable", "Operativo")

// Total de gastos por categoría
=SUMAR.SI([Categoría], "Suministros", [Total])

// Gastos del mes
=SUMAR.SI.CONJUNTO([Total], [Fecha], ">=" & FECHA(2025,10,1), [Fecha], "<=" & FECHA(2025,10,31))
```

---

## 3. REGISTRO DE ADELANTOS Y PAGOS PARCIALES

### Cuándo usar adelantos:

- ✅ Clientes nuevos (sin historial)
- ✅ Servicios de alto valor (>$5,000 MXN)
- ✅ Servicios que requieren compra de suministros específicos
- ✅ Contratos de largo plazo (depósito inicial)

### Template: Hoja "ADELANTOS"

```
| ID Adelanto | Fecha Adelanto | Cliente | Servicio | Total del Servicio | Adelanto (%) | Monto Adelanto | Balance Pendiente | Fecha Balance Pagado | Método Adelanto | Método Balance | Status | Notas |
|-------------|----------------|---------|----------|-------------------|--------------|----------------|-------------------|---------------------|----------------|----------------|--------|-------|
| ADV-001 | 2025-10-10 | Carlos R. | Deep Clean Villa | 3000.00 | 50% | 1500.00 | 1500.00 | 2025-10-15 | Transferencia | Transferencia | Completado | -- |
| ADV-002 | 2025-10-12 | Ana L. | Contrato 3 meses | 12000.00 | 30% | 3600.00 | 8400.00 | -- | PayPal | -- | Pendiente | $2800/mes restantes |
```

### Políticas de Adelantos (sugeridas):

**Nuevos Clientes:**

- Servicios < $2,000: No adelanto requerido (pago contra entrega)
- Servicios $2,000 - $5,000: 30% adelanto
- Servicios > $5,000: 50% adelanto

**Clientes Establecidos (3+ servicios):**

- Crédito neto 15 días
- No adelanto requerido

**Contratos de Largo Plazo:**

- 1 mes de adelanto (depósito de seguridad)
- Pago mensual por adelantado

---

## 4. REPORTE DE FLUJO DE EFECTIVO

### Template: Hoja "FLUJO DE EFECTIVO"

```
FLUJO DE EFECTIVO - MES DE [OCTUBRE 2025]

BALANCE INICIAL (01 Oct)                         $ 15,000.00

ENTRADAS (+)
┌────────────────────────────────────────────────────────┐
│ Servicios Pagados                    $ 28,500.00       │
│ Adelantos Recibidos                  $  4,500.00       │
│ Otros Ingresos                       $      0.00       │
│                                                         │
│ TOTAL ENTRADAS                       $ 33,000.00       │
└────────────────────────────────────────────────────────┘

SALIDAS (-)
┌────────────────────────────────────────────────────────┐
│ Suministros y Productos              $ -3,200.00       │
│ Amenidades                           $ -1,800.00       │
│ Transporte                           $ -2,100.00       │
│ Salarios                             $ -12,000.00      │
│ Marketing                            $   -800.00       │
│ Tecnología/Software                  $   -150.00       │
│ Otros Gastos                         $   -950.00       │
│                                                         │
│ TOTAL SALIDAS                        $ -21,000.00      │
└────────────────────────────────────────────────────────┘

FLUJO NETO DEL MES                               $ 12,000.00

BALANCE FINAL (31 Oct)                           $ 27,000.00

┌────────────────────────────────────────────────────────┐
│ ANÁLISIS:                                              │
│ • Ingresos: +18.5% vs mes anterior                    │
│ • Gastos: +5.2% vs mes anterior                       │
│ • Margen neto: 36.4%                                   │
│ • Cuentas por cobrar: $5,200                          │
└────────────────────────────────────────────────────────┘
```

### Fórmulas:

```excel
// Balance Final
=Balance Inicial + Total Entradas - Total Salidas

// Margen Neto
=(Total Entradas - Total Salidas) / Total Entradas * 100

// Tasa de Crecimiento
=(Ingresos Mes Actual - Ingresos Mes Anterior) / Ingresos Mes Anterior * 100
```

---

## 5. DASHBOARD DE MÉTRICAS CLAVE (KPIs)

### Template: Hoja "DASHBOARD"

```
═══════════════════════════════════════════════════════════
  BRISA CUBANA CLEAN INTELLIGENCE - DASHBOARD FINANCIERO
                     OCTUBRE 2025
═══════════════════════════════════════════════════════════

┌─────────────────── INGRESOS ───────────────────┐
│                                                 │
│  Total Facturado:              $ 35,200.00     │
│  Total Cobrado:                $ 28,500.00     │
│  Por Cobrar:                   $  6,700.00     │
│  Tasa de Cobro:                    81%         │
│                                                 │
│  Ingreso Promedio/Servicio:    $    875.00     │
│  Número de Servicios:               32         │
│  Número de Clientes Activos:         8         │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────── GASTOS ─────────────────────┐
│                                                 │
│  Gastos Operativos:            $ 21,000.00     │
│  % de Ingresos:                    73.7%       │
│                                                 │
│  Desglose:                                      │
│    • Personal (57%):           $ 12,000.00     │
│    • Suministros (15%):        $  3,200.00     │
│    • Transporte (10%):         $  2,100.00     │
│    • Amenidades (9%):          $  1,800.00     │
│    • Otros (9%):               $  1,900.00     │
│                                                 │
└─────────────────────────────────────────────────┘

┌────────────────── RENTABILIDAD ────────────────┐
│                                                 │
│  Margen Bruto:                     26.3%       │
│  Utilidad Neta:                $ 7,500.00      │
│  ROI:                              35.7%       │
│                                                 │
└─────────────────────────────────────────────────┘

┌──────────────── CLIENTES ──────────────────────┐
│                                                 │
│  Clientes Nuevos (mes):             3          │
│  Clientes Retenidos:                5          │
│  Tasa de Retención:               100%         │
│  Valor Promedio/Cliente:       $ 3,562.50      │
│                                                 │
└─────────────────────────────────────────────────┘

┌────────────── CUENTAS POR COBRAR ──────────────┐
│                                                 │
│  0-15 días:                    $ 3,200.00      │
│  16-30 días:                   $ 2,400.00      │
│  31-60 días:                   $ 1,100.00      │
│  +60 días (vencido):           $     0.00      │
│                                                 │
└─────────────────────────────────────────────────┘

┌──────────── SERVICIOS MÁS RENTABLES ───────────┐
│                                                 │
│  1. Deep Cleaning          $ 1,500 (40% margin)│
│  2. Turnover 3BR+          $ 1,200 (35% margin)│
│  3. Contrato Recurrente    $ 2,800 (45% margin)│
│  4. Turnover 2BR           $   800 (30% margin)│
│  5. Staging                $ 1,000 (38% margin)│
│                                                 │
└─────────────────────────────────────────────────┘

┌───────────────── PROYECCIÓN ───────────────────┐
│                                                 │
│  Si continúa esta tendencia:                   │
│  • Ingresos Q4 2025:       $ 95,000.00         │
│  • Utilidad Q4 2025:       $ 25,000.00         │
│  • Break-even alcanzado:   ✅ Mes 2             │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Métricas Clave a Trackear:

#### Ingresos:

- **MRR (Monthly Recurring Revenue):** Ingresos predecibles de contratos recurrentes
- **Ticket Promedio:** Ingreso promedio por servicio
- **Tasa de Crecimiento:** % de incremento mes a mes

#### Gastos:

- **COGS (Cost of Goods Sold):** Costos directos de servicio (suministros, personal directo)
- **Gastos Operativos:** Gastos indirectos (marketing, admin, tecnología)
- **Burn Rate:** Tasa de consumo de efectivo

#### Rentabilidad:

- **Margen Bruto:** (Ingresos - COGS) / Ingresos
- **Margen Neto:** (Ingresos - Todos los Gastos) / Ingresos
- **EBITDA:** Earnings before interest, taxes, depreciation, and amortization

#### Clientes:

- **CAC (Customer Acquisition Cost):** Costo de adquirir un nuevo cliente
- **LTV (Lifetime Value):** Valor total de un cliente durante su relación
- **Tasa de Retención:** % de clientes que continúan usando el servicio
- **Churn Rate:** % de clientes que dejan el servicio

#### Eficiencia Operativa:

- **Servicios por Empleado/Día:** Productividad del equipo
- **Tiempo Promedio/Servicio:** Eficiencia operativa
- **Tasa de Utilización:** % del tiempo facturado vs disponible

---

## GUÍA DE REGISTRO DIARIO

### Rutina Diaria (5-10 minutos):

**Al final del día:**

1. Registrar todos los servicios realizados en "INGRESOS"
2. Registrar todos los gastos del día en "GASTOS"
3. Actualizar status de facturas pagadas
4. Archivar recibos/comprobantes digitalmente

### Rutina Semanal (30 minutos):

**Cada viernes:**

1. Revisar cuentas por cobrar (enviar recordatorios si es necesario)
2. Proyectar servicios de la semana siguiente
3. Verificar que todos los recibos estén archivados
4. Actualizar dashboard de métricas

### Rutina Mensual (2-3 horas):

**Último día del mes:**

1. Cerrar el mes (verificar que todo esté registrado)
2. Generar reporte de flujo de efectivo
3. Actualizar todas las métricas del dashboard
4. Analizar tendencias y variaciones
5. Preparar proyecciones para el siguiente mes
6. Backup de archivo financiero
7. Compartir reporte con contador (si aplica)

---

## TRANSICIÓN A SOFTWARE CONTABLE

### Cuándo Migrar a QuickBooks/Software Profesional:

**Señales de que es hora:**

- ✅ Más de 50 transacciones mensuales
- ✅ Múltiples empleados con nómina
- ✅ Necesidad de reportes fiscales complejos
- ✅ Integración con banco necesaria
- ✅ El sistema actual toma >2 horas semanales

### Proceso de Migración:

1. **Seleccionar Software:**
   - QuickBooks (más común en México/US)
   - Conta.com (específico para México)
   - Xero (alternativa moderna)
   - Wave (gratuito, básico)

2. **Preparar Datos:**
   - Exportar todos los registros a CSV
   - Categorizar según el chart of accounts del nuevo software
   - Validar que no haya duplicados

3. **Importar:**
   - Usar herramienta de importación del software
   - Verificar que todo esté correcto
   - Reconciliar totales

4. **Capacitación:**
   - Aprender el nuevo sistema (2-4 horas)
   - Configurar plantillas de facturas
   - Configurar recordatorios automáticos

---

## TEMPLATES DESCARGABLES

### Archivo Excel Maestro: `brisa-cubana-financial-tracker.xlsx`

**Hojas incluidas:**

1. Dashboard
2. Ingresos
3. Gastos
4. Adelantos
5. Flujo de Efectivo
6. Resumen Mensual
7. Proyecciones
8. Configuración

### Descarga y Uso:

```
1. Hacer una copia del template
2. Renombrar: "AAAA-MM-financial-tracker.xlsx"
3. Completar la hoja "Configuración" con tus datos
4. Comenzar a registrar transacciones
5. Backup semanal a Google Drive/Dropbox
```

---

## CHECKLIST DE IMPLEMENTACIÓN

### Setup Inicial:

- ☐ Descargar template de Excel
- ☐ Crear estructura de carpetas (docs/financials/)
- ☐ Configurar cuenta de Google Drive/Dropbox para backups
- ☐ Definir políticas de adelantos
- ☐ Establecer rutina diaria de registro
- ☐ Configurar recordatorios en calendario

### Primeras 2 Semanas:

- ☐ Registrar todas las transacciones retroactivas (si las hay)
- ☐ Crear categorías personalizadas si es necesario
- ☐ Verificar fórmulas funcionan correctamente
- ☐ Hacer primer reporte semanal
- ☐ Ajustar sistema según necesidad

### Primer Mes:

- ☐ Generar primer reporte mensual completo
- ☐ Analizar métricas clave
- ☐ Identificar áreas de mejora
- ☐ Refinar categorías y procesos
- ☐ Evaluar si el sistema es suficiente o necesita ajustes

---

## ANEXO: POLÍTICAS FINANCIERAS RECOMENDADAS

### Términos de Pago:

**Clientes Nuevos:**

- Servicios únicos: Pago contra entrega o prepago
- Servicios >$3,000: 50% adelanto

**Clientes Establecidos:**

- Crédito neto 15 días
- Descuento 5% por prepago

**Contratos Largo Plazo:**

- Pago mensual por adelantado
- Descuento 10% por pago trimestral anticipado

### Política de Cobranza:

- **Día 1:** Envío de factura
- **Día del vencimiento:** Recordatorio amigable
- **Día +3:** Segundo recordatorio
- **Día +7:** Llamada telefónica
- **Día +15:** Suspensión temporal de servicio
- **Día +30:** Proceso de cobranza formal

### Política de Reembolsos:

- Servicios no satisfactorios: Re-limpieza sin cargo
- Cancelación con >24h anticipación: 100% reembolso de adelanto
- Cancelación con <24h anticipación: 50% del adelanto
- No-show del cliente: 100% de cargo

---

## SOPORTE Y RECURSOS

**Plantillas:**

- `docs/templates/income-template.xlsx`
- `docs/templates/expense-template.xlsx`
- `docs/templates/financial-tracker-master.xlsx`

**Guías Relacionadas:**

- Política de Precios (`docs/business/pricing-guide.md`)
- Términos y Condiciones Financieros (ver Contrato de Servicio)
- Guía de Facturación Electrónica (si aplica en tu región)

**Contacto para Dudas:**

- Email: admin@brisacubanaclean.com
- Contador (cuando se contrate): [NOMBRE] - [EMAIL]

---

**Documento generado por Brisa Cubana Clean Intelligence**
**Versión:** 1.0
**Fecha:** 2025-10-30

💰 **Tip:** La disciplina en el registro financiero diario es la clave para un negocio sano y escalable.
