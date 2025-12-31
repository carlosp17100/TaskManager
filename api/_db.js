const { Pool } = require("pg")

let pool

const getPool = () => {
  if (pool) return pool

  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL

  if (!connectionString) throw new Error("Missing DATABASE_URL/POSTGRES_URL")

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  return pool
}

module.exports = { getPool }
