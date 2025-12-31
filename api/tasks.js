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
      const params = []

      if (search) {
        params.push(`%${search}%`)
        where.push(`title ILIKE $${params.length}`)
      }

      if (done === "0" || done === "1") {
        params.push(done === "1")
        where.push(`done = $${params.length}`)
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

      // LIST QUERY
      const listParams = [...params, limit, offset]
      const listQuery = `
        SELECT id, title, done, created_at
        FROM tasks
        ${whereSql}
        ORDER BY id DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `

      // COUNT QUERY
      const countQuery = `
        SELECT COUNT(*)::int AS total
        FROM tasks
        ${whereSql}
      `

      const [items, total] = await Promise.all([
        pool.query(listQuery, listParams),
        pool.query(countQuery, params)
      ])

      return res.json({
        page,
        limit,
        total: total.rows[0].total,
        items: items.rows
      })
    }

    if (req.method === "POST") {
      const title = String(req.body?.title || "").trim()
      if (!title) return res.status(400).json({ error: "title required" })

      const r = await pool.query(
        `
        INSERT INTO tasks (title)
        VALUES ($1)
        RETURNING id, title, done, created_at
        `,
        [title]
      )

      return res.status(201).json(r.rows[0])
    }

    return res.status(405).json({ error: "method not allowed" })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e.message })
  }
}
