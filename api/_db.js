const { neon, neonConfig } = require("@neondatabase/serverless")


neonConfig.poolQueryViaFetch = true

let sql
let initPromise

const getConnString = () =>
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  ""

const getSql = () => {
  if (sql) return sql
  const connectionString = getConnString()
  if (!connectionString) throw new Error("Missing DATABASE_URL")
  sql = neon(connectionString)
  return sql
}

const initDb = async () => {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const s = getSql()

    await s`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `

    await s`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id TEXT;`
    await s`UPDATE tasks SET user_id = 'public' WHERE user_id IS NULL;`
    await s`ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;`
    await s`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);`
  })()
  return initPromise
}

module.exports = { getSql, initDb }
