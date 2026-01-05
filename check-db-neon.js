require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

async function main() {
  const res = await sql`select 1 as ok`
  console.log(res[0])
}

main().catch(console.error)
