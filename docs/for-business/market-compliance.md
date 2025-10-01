# 02 · Mercado y Compliance

## Insights clave (actualizado 29 sep 2025)

- **28.2 millones** de visitantes y **USD 22.0 B** en gasto directo durante 2024 según el GMCVB; la ocupación hotelera llegó al 77 % y los ingresos fiscales asociados a USD 2.2 B.[^gmcvb]
- 66.6 % de las viviendas ocupadas en Miami-Dade son en alquiler (ACS 2023 1-year, tabla B25003), lo que confirma la rotación alta y la necesidad de limpieza recurrente.[^acs]
- Competencia altamente fragmentada: **543 proveedores con 5★** en Thumbtack y precios publicados desde **USD 70** para servicios estándar, con limpiezas profundas entre USD 200–600.[^thumbtack]
- El release OEWS May 2024 sitúa el salario medio horario del grupo **Building & Grounds Cleaning** en **USD 17.55/h** (USD 36,504 anuales); mantenemos como referencia el valor histórico 2023 de **USD 29.8K/año (~USD 14/h)** para SOC 37-2012 hasta completar la extracción detallada.[^bls]
- El mercado global de robótica de limpieza proyecta **USD 24.5 B** en 2030 con un CAGR de 22.9 %, impulsado por hospitality, retail y aeropuertos que exigen autonomía e informes en tiempo real.[^robots]
- STR y el GMCVB estiman pipeline de más de **6,000 habitaciones adicionales** en Miami-Dade hacia 2027, lideradas por propiedades lifestyle y extended stay que requieren turnos express y SLAs verificables.[^pipeline]

## Segmentación

1. **Residencial premium / lujo**: Brickell, Coral Gables, Wynwood, Miami Beach – valoran seguridad, tecnología, evidencia visual.
2. **Property managers / alquileres vacacionales** (Airbnb, Vrbo) – necesitan turnos rápidos y reportes automáticos.
3. **Hospitality & eventos**: hoteles boutique, venues; SLA estrictos, integraciones PMS, métricas ESG.
4. **Comercial / oficinas boutique**: requieren contratos, compliance (OSHA/limpieza verde), reporting.
5. **Healthcare & wellness boutique**: clínicas estéticas, centros de bienestar con protocolos sanitarios avanzados.

## Competencia y pricing 2025

| Indicador                           | Valor         | Fuente                                                                             |
| ----------------------------------- | ------------- | ---------------------------------------------------------------------------------- |
| Proveedores 5★ en Thumbtack (Miami) | 543           | Thumbtack “House Cleaning Services in Miami, FL”.[^thumbtack]                      |
| Precio mínimo publicado             | USD 70        | Thumbtack (servicio estándar).[^thumbtack]                                         |
| Rango típico limpieza estándar      | USD 90 – 320  | Prime Residential Services, Maid You Look, Match Cleaner en Thumbtack.[^thumbtack] |
| Rango limpieza profunda             | USD 200 – 600 | Expert Cleaning, SuperClean, Leiby's Cleaning Miami.[^thumbtack]                   |
| Precio medio comunicado por hora    | USD 50        | Guía de precios Thumbtack 2024.[^thumbtack-guide]                                  |

### Implicaciones

- Posicionar CleanScore™ y los SLA verificables como diferenciadores frente a un mercado saturado en precios.
- Mantener benchmarking trimestral para detectar cambios abruptos y alimentar el motor de pricing dinámico.

## Costos laborales y talento

| Indicador                                   | Valor                      | Nota                                                                                                                       |
| ------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Hourly mean wage (37-0000)                  | USD 17.55                  | BLS OEWS May 2024 release para el agregado Building & Grounds.[^bls]                                                       |
| Annual mean wage (37-0000)                  | USD 36,504                 | Equivalente anualizado del dato anterior.[^bls]                                                                            |
| Referencia histórica SOC 37-2012 (May 2023) | USD 29,800/año (~USD 14/h) | Valor en uso hasta que se descargue el dataset May 2024 específico.[^bls-2023]                                             |
| Hiring difficulty index (Florida)           | 57/100 (moderada escasez)  | ManpowerGroup Talent Shortage Survey Q3 2025, limpieza & mantenimiento es la 4ª categoría con mayor dificultad.[^manpower] |

### Próximos pasos

- Descargar manualmente `oesm32mi.xlsx` (SOC 37-2012) y actualizar las cifras en `docs/resources/market/wage-maids-miami.md`.
- Ajustar el modelo financiero con la nueva cifra y documentar cualquier variación en costos operativos.

## Estrategia de entrada

- Lanzar con pilotos en alquileres vacacionales y residenciales premium (ciclos cortos de feedback).
- Alianzas con property managers top (Airbnb Pro, Hostaway, Mews Marketplace) y brokers de lujo.
- Marketing hyperlocal (Google Performance Max, Meta Advantage+, TikTok) con storytelling del CleanScore™.
- Programas de referidos y bundles con lavanderías, mantenimiento HVAC y servicios de concierge residencial.

## Regulación Miami-Dade / Florida

| Requisito                           | Detalle                                                       | Acción                                                               |
| ----------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Estructura legal**                | LLC Florida + EIN                                             | Tramitar en Sunbiz / IRS                                             |
| **Local Business Tax (LBT)**        | Condado + municipio según jurisdicción                        | Solicitar LBT condado y ciudad (contacto Local Business Tax Section) |
| **Certificate of Use**              | Si opera en zona no residencial                               | Verificación plan/zoning                                             |
| **Workers’ Compensation**           | ≥4 empleados (no construcción) deben tener póliza             | Contratar seguro workers comp                                        |
| **Responsabilidad civil / bonding** | Recomendado para confianza y contratos                        | Póliza general liability + bonding                                   |
| **TCPA / comunicaciones**           | SMS/WhatsApp requiere opt-in                                  | Implementar consentimiento y listas                                  |
| **Privacidad**                      | Florida Digital Bill of Rights (2024) + CCPA/CPRA si aplicara | Avisos claros, derecho acceso/borrado                                |
| **Químicos/OSHA**                   | MSDS, entrenamiento y protocolos                              | Policy de insumos y entrenamiento staff                              |

## Vigilancia regulatoria

- Sin cambios recientes (Sep 2025) en LBT o workers comp. Seguir agenda legislativa Miami-Dade y Florida Department of State.
- IA: monitorear guías NIST, FTC, AI Safety Institute, y evolución EU AI Act (relevante para alianzas internacionales).
- Considerar ESG reporting (clientes corporativos) y normativas de limpieza verde.

## Riesgos & mitigaciones

- **Uso indebido de fotos/PII** → Consentimientos explícitos, retención limitada, ofuscar datos sensibles.
- **Incumplimiento TCPA** → Política SMS/WhatsApp con opt-in y registro auditor.
- **Eventos disruptivos (huracanes)** → Plan de contingencia (backup crew, comunicación masiva, seguros).
- **Competencia agresiva en precios** → Diferenciar con tecnología, calidad comprobable, bundles de valor.

## Oportunidades

- Crecimiento hotelero (Grand Hyatt Convention Center 2027) -> preparar oferta B2B.
- Políticas de sostenibilidad → ofrecer paquetes eco y reporting de huella.
- Programas del GMCVB y cámaras locales → networking, certificaciones, visibilidad.

## Tendencias 2025 a vigilar

- **Robótica colaborativa**: hoteles y aeropuertos de Miami están incorporando robots de frotado, UV-C y aspirado; integrar telemetría a CleanScore™ permitirá SLA compartidos humano+robot.
- **Reporting ESG obligatorio**: cadenas corporativas exigen KPIs de emisiones, agua e insumos verificados por terceros. Nuestra plataforma debe exportar CSV/API compatibles con CDP/GRI.
- **Regulación IA**: Florida Digital Bill of Rights y guías FTC obligan transparencia en modelos y almacenamiento; preparar explainers para clientes + auditorías mensuales.
- **Experiencias phygital**: property managers buscan entregables inmersivos (tour 360, dashboards WebXR) para vender la experiencia de limpieza y monitoreo remoto.
- **Inmigración laboral**: programas EB-3/TPS en revisión → oportunidad para academias de talento y beneficios de alojamiento que eleven retención.

[^gmcvb]: PR Newswire, “Greater Miami & Miami Beach Break All-Time Tourism Records in 2024”, 12 mar 2025. https://www.prnewswire.com/news-releases/greater-miami--miami-beach-break-all-time-tourism-records-in-2024-302043734.html

[^acs]: U.S. Census Bureau, American Community Survey 1-year 2023, Tabla B25003 (Tenure), consultado el 29 sep 2025. https://data.census.gov/

[^thumbtack]: Thumbtack, “House Cleaning Services in Miami, FL”, consultado el 29 sep 2025. https://www.thumbtack.com/fl/miami/house-cleaning

[^thumbtack-guide]: Thumbtack, “Deep Cleaning Cost Guide 2024”, consultado el 29 sep 2025. https://www.thumbtack.com/p/deep-cleaning-cost

[^bls]: Bureau of Labor Statistics, “Occupational Employment and Wage Statistics – Miami–Fort Lauderdale–West Palm Beach, FL (May 2024 release)”, consultado el 29 sep 2025. https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_miami.htm

[^bls-2023]: Bureau of Labor Statistics, OEWS May 2023 release, SOC 37-2012 “Maids and Housekeeping Cleaners”.

[^robots]: MarketsandMarkets / PR Newswire, “Robotic Cleaning Market worth $24.5 Billion by 2030”, 23 ene 2025. https://www.prnewswire.com/news-releases/robotic-cleaning-market-worth-24-5-billion-by-2030--marketsandmarkets-302050198.html

[^pipeline]: STR & GMCVB, “Miami Hotel Pipeline Outlook 2025”, boletín 14 ago 2025. https://press.miamiandbeaches.com/

[^manpower]: ManpowerGroup, “Talent Shortage Survey Q3 2025 – Florida Highlights”, 19 jul 2025. https://workforce.manpowergroupusa.com/talent-shortage
