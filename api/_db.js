const { Pool } = require("pg")

let pool

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL_NON_POOLING,
      ssl: { rejectUnauthorized: false }
    })
  }
  return pool
}

module.exports = { getPool }
