require('dotenv').config({ path: '.env.local' })

const { Client } = require('pg')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL NO está cargada')
  process.exit(1)
}

console.log('DATABASE_URL cargada OK')

const client = new Client({
  connectionString: process.env.DATABASE_URL
})

client.connect()
  .then(() => client.query('select 1 as ok'))
  .then(res => {
    console.log('Conexión OK:', res.rows[0])
    return client.end()
  })
  .catch(err => {
    console.error('Error conectando a Postgres')
    console.error(err.message)
  })
