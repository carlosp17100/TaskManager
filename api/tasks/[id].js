const { getSql, initDb } = require("../_db")

module.exports = async (req, res) => {
  try {
    await initDb()
    const sql = getSql()

    const idRaw = req.query && req.query.id
    const taskId = parseInt(Array.isArray(idRaw) ? idRaw[0] : idRaw, 10)

    if (!taskId) {
      res.status(400).json({ error: "Invalid id" })
      return
    }

    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, title, done, created_at
        FROM tasks
        WHERE id = ${taskId};
      `
      if (!rows.length) {
        res.status(404).json({ error: "Not found" })
        return
      }
      res.status(200).json(rows[0])
      return
    }

    if (req.method === "PATCH" || req.method === "PUT") {
      const body = req.body || {}
      const hasTitle = Object.prototype.hasOwnProperty.call(body, "title")
      const hasDone = Object.prototype.hasOwnProperty.call(body, "done")

      if (!hasTitle && !hasDone) {
        res.status(400).json({ error: "Nothing to update" })
        return
      }

      const title = hasTitle ? String(body.title || "").trim() : null
      if (hasTitle && !title) {
        res.status(400).json({ error: "Invalid title" })
        return
      }

      const done = hasDone ? Boolean(body.done) : null

      const rows = await sql`
        UPDATE tasks
        SET
          title = COALESCE(${title}, title),
          done = COALESCE(${done}, done)
        WHERE id = ${taskId}
        RETURNING id, title, done, created_at;
      `
      if (!rows.length) {
        res.status(404).json({ error: "Not found" })
        return
      }
      res.status(200).json(rows[0])
      return
    }

    if (req.method === "DELETE") {
      const rows = await sql`
        DELETE FROM tasks
        WHERE id = ${taskId}
        RETURNING id;
      `
      if (!rows.length) {
        res.status(404).json({ error: "Not found" })
        return
      }
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: "Method not allowed" })
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" })
  }
}
