const { getSql, initDb } = require("./_db")
const { getUid } = require("./_uid")

module.exports = async (req, res) => {
  try {
    await initDb()
    const sql = getSql()
    const uid = getUid(req, res)

    if (req.method === "GET") {
      const q = String((req.query && req.query.q) || "").trim()
      const page = Math.max(parseInt((req.query && req.query.page) || "1", 10) || 1, 1)
      const limit = Math.min(Math.max(parseInt((req.query && req.query.limit) || "10", 10) || 10, 1), 100)
      const offset = (page - 1) * limit

      const doneParam = (req.query && req.query.done)
      const hasDone = doneParam !== undefined && doneParam !== null && String(doneParam) !== ""
      const doneVal = String(doneParam) === "1" || String(doneParam).toLowerCase() === "true"

      const like = `%${q}%`

      const rows = await sql`
        SELECT id, title, done, created_at
        FROM tasks
        WHERE user_id = ${uid}
          AND (${like} = '%%' OR title ILIKE ${like})
          AND (${hasDone} = false OR done = ${doneVal})
        ORDER BY id DESC
        LIMIT ${limit}
        OFFSET ${offset};
      `

      const totalRes = await sql`
        SELECT COUNT(*)::int AS total
        FROM tasks
        WHERE user_id = ${uid}
          AND (${like} = '%%' OR title ILIKE ${like})
          AND (${hasDone} = false OR done = ${doneVal});
      `

      const total = totalRes[0]?.total || 0

      res.status(200).json({
        page,
        limit,
        total,

        tasks: rows,
        items: rows,
        data: rows
      })
      return
    }

    if (req.method === "POST") {
      const body = req.body || {}
      const title = String(body.title || "").trim()
      if (!title) {
        res.status(400).json({ error: "Missing title" })
        return
      }

      const inserted = await sql`
        INSERT INTO tasks (user_id, title, done)
        VALUES (${uid}, ${title}, false)
        RETURNING id, title, done, created_at;
      `

      res.status(201).json(inserted[0])
      return
    }

    res.status(405).json({ error: "Method not allowed" })
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" })
  }
}
