# C4 · Nivel 2 — Contenedores (Q4 2025)

```mermaid
graph TD
    Client[Cliente web/mobile]
    Staff[App Staff]
    Admin[Panel Admin]

    subgraph Edge
        CFWorker[Cloudflare Worker]
    end

    subgraph Backend
        Gateway[API Gateway (Next.js 15 / Bun)]
        Auth[Auth Provider]
        Temporal[Temporal Server]
        Services{{Microservicios Bun/Nest}}
        AI[Servicios IA (LangChain, modelos)]
        EventMesh[(Event Mesh Redpanda)]
    end

    subgraph Data
        Postgres[(PostgreSQL/Timescale)]
        Redis[(Redis)]
        VectorDB[(Weaviate/Milvus)]
        Lakehouse[(DuckDB/MotherDuck)]
        Warehouse[(Snowflake/BigQuery opcional)]
    end

    subgraph Observabilidad
        OTel[OpenTelemetry Collector]
        Grafana[Grafana / Prometheus]
        SIEM[SIEM/DataDog]
    end

    Client --> CFWorker --> Gateway
    Staff --> CFWorker
    Admin --> CFWorker

    Gateway --> Auth
    Gateway --> Services
    Gateway --> EventMesh
    Services --> Temporal
    Temporal --> Services
    Services --> AI
    AI --> VectorDB

    Services --> Postgres
    Services --> Redis
    Services --> Lakehouse
    Lakehouse --> Warehouse

    EventMesh --> Services
    EventMesh --> Temporal

    Services --> OTel
    Gateway --> OTel
    OTel --> Grafana
    OTel --> SIEM
```

> Propietario: Tech Lead. Actualizado 29 sep 2025.
