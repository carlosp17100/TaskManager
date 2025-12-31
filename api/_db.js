const { Pool } = require("pg")

let pool

const normalize = (s) => {
  const parts = String(s || "").split("?")
  if (parts.length === 1) return parts[0]
  const base = parts[0]
  const q = parts[1]
    .split("&")
    .filter(Boolean)
    .filter((p) => !p.toLowerCase().startsWith("sslmode="))
    .join("&")
  return q ? `${base}?${q}` : base
}

const getPool = () => {
  if (!pool) {
    const raw = process.env.POSTGRES_URL || process.env.DATABASE_URL
    const connectionString = normalize(raw)
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })
  }
  return pool
}

module.exports = { getPool }
