// ── NodeReading — the 9-field payload sent by the ESP32 simulator ─────────────

export interface NodeReading {
  // Identification
  node_id: string; // "GT-NODE-001"
  farm_id: string; // pubkey of FarmAccount on-chain
  sequence: number; // incremental counter — detects connectivity gaps

  // BME280 I2C — Atmospheric climate
  temperature_c: number; // °C   · 18.0–34.0 · noise ±0.3°C
  humidity_pct: number; // %    · 45.0–95.0 · noise ±1.5%
  pressure_hpa: number; // hPa  · 950–1050  · noise ±0.5 hPa

  // Soil (capacitive sensor)
  soil_moisture_pct: number; // %    · 0–100    · noise ±2%  — critical for EUDR

  // Light (BH1750 I2C)
  light_lux: number; // lux  · 0–65535  · noise ±500 — photosynthesis correlation

  // CO₂ (MH-Z19 UART)
  co2_ppm: number; // ppm  · 400–2000 · noise ±8ppm — carbon sequestration (DeSci)

  // DePIN node hardware health
  battery_mv: number; // mV   · 4200→3000 · decreases -1mV/reading (LiPo)
  rssi_dbm: number; // dBm  · -30 to -100 · noise ±3dBm
  uptime_seconds: number; // s    · increases +interval per cycle

  // Cryptographic integrity
  timestamp: number; // Unix ms
  data_hash: string; // SHA-256 of all above fields concatenated
}

// ── HTTP ingest payload (superset of NodeReading) ─────────────────────────────

export interface SensorPayload extends NodeReading {
  version?: string; // optional firmware version
}

// ── Database record (from Prisma) ─────────────────────────────────────────────

export type ReadingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface SensorReading {
  id: string;
  node_id: string;
  farm_id: string;
  sequence: number;
  temperature_c: number;
  humidity_pct: number;
  pressure_hpa: number;
  soil_moisture_pct: number;
  light_lux: number;
  co2_ppm: number;
  battery_mv: number;
  rssi_dbm: number;
  uptime_seconds: number;
  data_hash: string;
  status: ReadingStatus;
  tx_signature: string | null;
  pda_address: string | null;
  created_at: Date;
}

// ── Aggregated stats ──────────────────────────────────────────────────────────

export interface ReadingStats {
  total_today: number;
  last_temperature_c: number | null;
  last_humidity_pct: number | null;
  last_reading_at: Date | null;
}
