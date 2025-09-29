# Plan de Datos & Analítica

## Objetivo
Recopilar, procesar y visualizar datos clave para decisiones operativas y estratégicas.

## Fuentes
- Eventos plataforma (booking, CleanScore, tiempos).
- Datos externos (clima, tráfico, ocupación turística).
- Datos financieros (QuickBooks).
- Feedback clientes/staff, reseñas públicas.

## Pipeline
1. Ingesta (event mesh → Lakehouse).
2. Transformaciones (dbt/SQL) → métricas definidas.
3. Feature store (Feast) para modelos ML.
4. Dashboards en Metabase/Looker/Grafana.

## Métricas
- Operativas: SLA, CleanScore promedio, rework, utilización cuadrillas.
- Comerciales: CAC, conversión, LTV, ARPU.
- Financieras: margen, cashflow, AR/AP.
- IA: precisión, drift, fairness.

## Gobernanza
- Data catalog, definiciones (glosario).
- Roles: Data Lead, analistas, MLOps.
- Políticas: retención, acceso, calidad.

## Herramientas
- Lakehouse (DuckDB/MotherDuck/Snowflake).
- ETL: Airbyte/Fivetran, dbt.
- Dashboard: Metabase/Looker, Grafana para observabilidad.
- Monitor IA: LangSmith, MLflow, Evidently.

