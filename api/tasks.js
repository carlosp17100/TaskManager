const { getPool } = require("./_db")

module.exports = async (req, res) => {
  try {
    const pool = getPool()

    if (req.method === "GET") {
      const search = String(req.query.search || "").trim()
      const done = req.query.done
      const page = Math.max(1, Number(req.query.page || 1))
      const limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)))
      const offset = (page - 1) * limit

      const where = []
      const values = []

      if (search) {
        values.push(`%${search}%`)
        where.push(`title ILIKE $${values.length}`)
      }

      if (done === "0" || done === "1") {
        values.push(done === "1")
        where.push(`done = $${values.length}`)
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

      values.push(limit)
      values.push(offset)

      const items = await pool.query(
        `SELECT id, title, done, created_at
         FROM tasks
         ${whereSql}
         ORDER BY id DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values
      )

      const countValues = values.slice(0, values.length - 2)

      const total = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM tasks
         ${whereSql}`,
        countValues
      )

      return res.json({
        page,
        limit,
        total: total.rows[0]?.total || 0,
        items: items.rows
      })
    }

    if (req.method === "POST") {
      const title = String(req.body?.title || "").trim()
      if (!title) return res.status(400).json({ error: "title required" })

      const r = await pool.query(
        `INSERT INTO tasks (title)
         VALUES ($1)
         RETURNING id, title, done, created_at`,
        [title]
      )

      return res.status(201).json(r.rows[0])
    }

    return res.status(405).json({ error: "method not allowed" })
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}
