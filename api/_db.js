const { Pool } = require("pg")

let pool

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      port: 5432,
      ssl: { rejectUnauthorized: false }
    })
  }
  return pool
}

module.exports = { getPool }
