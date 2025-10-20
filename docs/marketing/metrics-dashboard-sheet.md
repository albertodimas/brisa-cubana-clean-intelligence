# Metrics Dashboard · Google Sheets Template

## 1. Estructura sugerida

- **Sheet `Calendar`**: replica la tabla de `tracking-dashboard-template` (content_id, fecha, plataforma, etc.).
- **Sheet `Results`**: importará los datos reales (alcance, clicks, leads, follow-up).
- **Sheet `Summary`**: indicadores agregados (por campaña, plataforma y semana).

### Calendar

Columnas estándar:

```
A: week
B: content_id
C: platform
D: planned_date
E: published (Y/N)
F: post_url
G: utm_link
H: asset_path
I: owner
J: notes
```

### Results (rellenar manualmente o vía Zapier/Make)

```
A: timestamp
B: content_id
C: platform
D: views
E: clicks
F: leads
G: follow_up_owner
H: response_time_minutes
I: status (Contacted / In progress / Won / Lost)
```

## 2. Fórmulas clave (`Summary`)

- **Total leads por plataforma**

```
=QUERY(Results!A:H, "select C, sum(F) where C is not null group by C label sum(F) 'Leads'", 1)
```

- **Tasa de conversión (Clicks → Leads)**

```
=ARRAYFORMULA(IF(Results!E2:E="", "", ROUND(Results!F2:F / Results!E2:E, 4)))
```

- **Tiempo promedio de respuesta (min)**

```
=AVERAGEIF(Results!H:H, ">0")
```

- **Leads por campaña** (usando utm_campaign, si lo pasas a Results)

```
=QUERY(Results!A:H, "select J, sum(F) where J <> '' group by J", 1)
```

## 3. Integraciones

- **Zapier / Make**: Trigger formulario → agregar fila en `Results` → enviar notificación Slack (ver `docs/integrations/slack-leads-webhook.md`).
- **Google Analytics / PostHog**: Guarda los eventos con utm y cruza los datos vía API para automatizar el llenado de `Results`.

## 4. KPI sugeridos

| KPI                  | Fórmula                                                                  | Meta inicial      |
| -------------------- | ------------------------------------------------------------------------ | ----------------- |
| Conversion Rate      | Leads / Clicks                                                           | ≥ 8 %             |
| Tiempo respuesta     | Promedio de `response_time_minutes`                                      | ≤ 120 min         |
| Leads por semana     | SUMIF(Results!A:A, "semana_n", F:F)                                      | ≥ 12              |
| % Leads por servicio | `QUERY(Results, "select group, sum(F)")` (añade columna serviceInterest) | Identificar top 2 |

## 5. Buenas prácticas

- Actualiza `Results` dentro de las primeras 24 h tras cada publicación.
- Usa formato condicional para resaltar leads sin respuesta (>2 h), piezas sin publicar o semanas sin suficiente contenido.
- Duplica el dashboard al inicio de cada mes (`Summary_Nov2025`, etc.) para comparar rendimientos.

> Crea una carpeta `analytics/` en Google Drive y comparte con operaciones + marketing para mantener visibilidad conjunta.
