const { Pool } = require("pg")

let pool

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
    })
  }
  return pool
}

module.exports = { getPool }
