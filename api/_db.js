const { Pool } = require("pg")

let pool

const isLocal = () => {
  const env = String(process.env.NODE_ENV || "")
  return env !== "production"
}

const getConnString = () => {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  )
}

const buildPool = () => {
  const connectionString = getConnString()
  if (!connectionString) throw new Error("Missing DATABASE_URL")

  return new Pool({
    connectionString,
    ssl: isLocal() ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true
  })
}

const getPool = () => {
  if (!pool) pool = buildPool()
  return pool
}

module.exports = { getPool }
