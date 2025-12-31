const { getPool } = require("./_db")

module.exports = async (req, res) => {
  const pool = getPool()
  const id = Number(req.query.id)

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "invalid id" })
  }

  if (req.method === "PATCH") {
    const current = await pool.query(
      `SELECT * FROM tasks WHERE id = $1`,
      [id]
    )

    if (!current.rows[0]) {
      return res.status(404).json({ error: "not found" })
    }

    const title =
      req.body.title !== undefined
        ? String(req.body.title).trim()
        : current.rows[0].title

    const done =
      req.body.done !== undefined
        ? Boolean(req.body.done)
        : current.rows[0].done

    if (!title) {
      return res.status(400).json({ error: "title required" })
    }

    const r = await pool.query(
      `UPDATE tasks
       SET title = $1, done = $2
       WHERE id = $3
       RETURNING id, title, done, created_at`,
      [title, done, id]
    )

    return res.json(r.rows[0])
  }

  if (req.method === "DELETE") {
    const r = await pool.query(
      `DELETE FROM tasks WHERE id = $1`,
      [id]
    )

    if (r.rowCount === 0) {
      return res.status(404).json({ error: "not found" })
    }

    return res.status(204).send()
  }

  res.status(405).json({ error: "method not allowed" })
}
