# GroundTruth — Agricultural Compliance on Solana

> **Solana LATAM Hackathon 2026**

---

## 🇪🇸 Español

### ¿Qué es GroundTruth?

**GroundTruth** es una red DePIN (Decentralized Physical Infrastructure) en Solana que convierte nodos IoT de bajo costo en oráculos de datos agroclimáticos verificables.

Cada lectura de sensor genera un certificado criptográfico on-chain. Los agricultores poseen sus datos. Los modelos de IA y reguladores (EUDR) los consumen directamente sin intermediarios.

> *"El mundo tiene satélites y modelos de IA. Le falta el ground truth real del campo."*

### ¿Qué hace?

- **Recolecta datos:** IoT sensors miden temperatura, humedad, presión en tiempo real
- **Certifica on-chain:** Cada lectura genera un hash SHA-256 y se registra en Solana como prueba inmutable
- **Verifica cumplimiento EUDR:** Calcula automáticamente si la finca cumple regulaciones de deforestación
- **Marketplace de datos:** Investigadores compran acceso a datasets históricos certificados en Solana
- **Dashboard:** Visualiza métricas en tiempo real, reportes de cumplimiento y transacciones Solana

### Cómo iniciarlo

#### Requisitos previos
- Node.js 18+
- pnpm
- Docker (para Redis)
- Anchor CLI (para Solana)
- Credenciales de Supabase

#### Pasos

```bash
# 1. Clonar y configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase y Solana RPC

# 2. Instalar dependencias
pnpm install

# 3. Construir tipos compartidos
pnpm --filter @groundtruth/types build

# 4. Iniciar Redis en Docker
docker compose up -d

# 5. Iniciar backend (puerto 3001)
pnpm --filter @groundtruth/backend dev

# 6. Iniciar frontend (puerto 5173)
pnpm --filter @groundtruth/frontend dev

# 7. Ejecutar simulador (opcional)
pnpm --filter @groundtruth/simulator dev
```

### Stack tecnológico

| Componente | Tecnología |
|---|---|
| Smart Contract | Anchor (Rust) — Solana Devnet |
| Backend API | Fastify + TypeScript |
| Base de datos | Supabase (PostgreSQL) |
| Cache | Redis |
| Frontend | React + Vite + DaisyUI + Recharts |
| Tipos compartidos | pnpm workspaces |
| Testing | Vitest (33 tests passing) |

### Estructura del proyecto

```
groundtruth/
├── apps/
│   ├── backend/        ← API REST (Fastify, port 3001)
│   └── frontend/       ← Dashboard React (Vite, port 5173)
├── packages/
│   └── types/          ← @groundtruth/types (interfaces compartidas)
├── programs/           ← Anchor program (Rust)
├── simulator/          ← Simulador IoT (ESP32 mock)
└── docker-compose.yml  ← Redis
```

### Páginas del dashboard

- **`/`** — Overview: métricas de la finca, gráfico climático, estado de nodos
- **`/telemetry`** — Tabla en tiempo real con datos de sensores y links a Solana Explorer
- **`/eudr`** — Reporte de cumplimiento EUDR con prueba de integridad on-chain
- **`/desci`** — Marketplace de datos (datasets certificados disponibles)

---

## 🇺🇸 English

### What is GroundTruth?

**GroundTruth** is a DePIN (Decentralized Physical Infrastructure) network on Solana that turns low-cost IoT nodes into verifiable agroclimatic data oracles.

Each sensor reading generates a cryptographic certificate on-chain. Farmers own their data. AI models and regulators (EUDR) consume it directly without intermediaries.

> *"The world has satellites and AI models. It lacks real ground truth from the field."*

### What does it do?

- **Collects data:** IoT sensors measure temperature, humidity, pressure in real-time
- **Certifies on-chain:** Each reading generates a SHA-256 hash and is registered on Solana as immutable proof
- **Verifies EUDR compliance:** Automatically calculates if a farm meets deforestation regulations
- **Data marketplace:** Researchers purchase access to historical certified datasets on Solana
- **Dashboard:** Visualize real-time metrics, compliance reports, and Solana transactions

### How to start

#### Prerequisites
- Node.js 18+
- pnpm
- Docker (for Redis)
- Anchor CLI (for Solana)
- Supabase credentials

#### Steps

```bash
# 1. Clone and configure environment variables
cp .env.example .env
# Edit .env with your Supabase and Solana RPC credentials

# 2. Install dependencies
pnpm install

# 3. Build shared types
pnpm --filter @groundtruth/types build

# 4. Start Redis in Docker
docker compose up -d

# 5. Start backend (port 3001)
pnpm --filter @groundtruth/backend dev

# 6. Start frontend (port 5173)
pnpm --filter @groundtruth/frontend dev

# 7. Run simulator (optional)
pnpm --filter @groundtruth/simulator dev
```

### Technology stack

| Component | Technology |
|---|---|
| Smart Contract | Anchor (Rust) — Solana Devnet |
| Backend API | Fastify + TypeScript |
| Database | Supabase (PostgreSQL) |
| Cache | Redis |
| Frontend | React + Vite + DaisyUI + Recharts |
| Shared types | pnpm workspaces |
| Testing | Vitest (33 tests passing) |

### Project structure

```
groundtruth/
├── apps/
│   ├── backend/        ← REST API (Fastify, port 3001)
│   └── frontend/       ← React Dashboard (Vite, port 5173)
├── packages/
│   └── types/          ← @groundtruth/types (shared interfaces)
├── programs/           ← Anchor program (Rust)
├── simulator/          ← IoT simulator (ESP32 mock)
└── docker-compose.yml  ← Redis
```

### Dashboard pages

- **`/`** — Overview: farm metrics, climate chart, node status
- **`/telemetry`** — Real-time table with sensor data and Solana Explorer links
- **`/eudr`** — EUDR compliance report with on-chain integrity proof
- **`/desci`** — Data marketplace (certified datasets available)

---

## Testing

Run the test suite (33 tests across 7 modules):

```bash
pnpm --filter @groundtruth/backend test
pnpm --filter @groundtruth/backend test:coverage  # see coverage %
```

---

## License

MIT
