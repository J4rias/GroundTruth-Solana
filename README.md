# GroundTruth — DePIN IoT Oracle on Solana

> **Solana LATAM Hackathon 2026**

---

## 🇪🇸 Español

**GroundTruth** es una red DePIN (Decentralized Physical Infrastructure) en Solana que convierte nodos IoT de bajo costo en oráculos de datos agroclimáticos verificables.

Cada lectura de sensor genera un certificado criptográfico on-chain. Los agricultores poseen sus datos. Los modelos de IA y los reguladores (EUDR) los consumen.

> *"El mundo tiene satélites y modelos de IA. Le falta el ground truth real del campo."*

### Stack

| Capa | Tecnología |
|---|---|
| Smart Contract | Anchor (Rust) · Solana devnet |
| Backend | Fastify + TypeScript + Prisma + Redis |
| Base de datos | Supabase (PostgreSQL hosted) |
| Frontend | React + Vite + DaisyUI + Recharts + i18n |
| Tipos compartidos | `@groundtruth/types` (pnpm workspaces) |
| Simulator | Node.js — modo demo (8s) / producción (5min) |

---

## 🇺🇸 English

**GroundTruth** is a DePIN (Decentralized Physical Infrastructure) network on Solana that turns low-cost IoT nodes into verifiable agroclimatic data oracles.

Each sensor reading generates a cryptographic certificate on-chain. Farmers own their data. AI models and regulators (EUDR) consume it.

> *"The world has satellites and AI models. It lacks real ground truth from the field."*

### Data Flow

```
[ESP32 Simulator]
  │  POST /api/hardware/ingest
  ▼
[Fastify Backend]
  ├── Redis rate limit (5 req/min per node)
  ├── Zod validation + SHA-256 chain-of-custody
  ├── Prisma → Supabase PostgreSQL
  └── Anchor → certify_reading() on-chain
        ↓
[Solana Devnet]  ReadingCertificate PDA with data_hash
```

### Anchor Program — 3 Instructions · 3 PDAs

| Instruction | PDA Seeds | Description |
|---|---|---|
| `initialize_farm` | `["farm", owner]` | Creates FarmAccount |
| `register_node` | `["node", node_id, farm]` | Creates NodeAccount |
| `certify_reading` | `["cert", node, timestamp]` | Creates ReadingCertificate + EUDR compliance score in Rust |

### Repository Structure

```
groundtruth/
├── apps/
│   ├── backend/        ← Fastify API (port 3001)
│   └── frontend/       ← React + Vite SPA (port 5173)
├── packages/
│   └── types/          ← @groundtruth/types (shared interfaces)
├── programs/           ← Anchor program (Rust)
├── simulator/          ← ESP32 mock — 9 sensor fields
└── docker-compose.yml  ← Redis only (PostgreSQL on Supabase)
```

### Dashboard Pages

- `/` — Farm Overview: stat cards + climate chart + node status
- `/telemetry` — Real-time table with Solana Explorer TX links
- `/eudr` — EUDR Compliance Report with Solana proof chain
- `/desci` — DeSci Data Marketplace (datasets available on-chain)

---

## Setup

```bash
# Prerequisites: Node.js, pnpm, Anchor CLI, Solana CLI, Docker
cp .env.example .env  # fill in Supabase + Solana credentials

docker compose up -d  # start Redis

pnpm install
pnpm --filter @groundtruth/types build
pnpm --filter backend dev
pnpm --filter frontend dev
```

## License

MIT
