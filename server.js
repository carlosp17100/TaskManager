const express = require("express")
const cors = require("cors")
const Database = require("better-sqlite3")
const path = require("path")

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

const db = new Database("app.db")

db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`)

const toInt = (v, d) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

app.get("/api/tasks", (req, res) => {
  const search = (req.query.search || "").trim()
  const done = req.query.done
  const page = Math.max(1, toInt(req.query.page, 1))
  const limit = Math.min(50, Math.max(1, toInt(req.query.limit, 10)))
  const offset = (page - 1) * limit

  const where = []
  const params = {}

  if (search) {
    where.push("title LIKE @search")
    params.search = `%${search}%`
  }

  if (done === "0" || done === "1") {
    where.push("done = @done")
    params.done = Number(done)
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

  const items = db.prepare(`
    SELECT id, title, done, created_at
    FROM tasks
    ${whereSql}
    ORDER BY id DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset })

  const total = db.prepare(`
    SELECT COUNT(*) as total
    FROM tasks
    ${whereSql}
  `).get(params).total

  res.json({ page, limit, total, items })
})

app.post("/api/tasks", (req, res) => {
  const title = (req.body.title || "").trim()
  if (!title) return res.status(400).json({ error: "title required" })

  const info = db.prepare(`INSERT INTO tasks (title) VALUES (?)`).run(title)
  const task = db.prepare(`SELECT id, title, done, created_at FROM tasks WHERE id = ?`).get(info.lastInsertRowid)
  res.status(201).json(task)
})

app.patch("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" })

  const current = db.prepare(`SELECT id, title, done, created_at FROM tasks WHERE id = ?`).get(id)
  if (!current) return res.status(404).json({ error: "not found" })

  const title = req.body.title !== undefined ? String(req.body.title).trim() : current.title
  const done = req.body.done !== undefined ? (req.body.done ? 1 : 0) : current.done

  if (!title) return res.status(400).json({ error: "title required" })

  db.prepare(`UPDATE tasks SET title = ?, done = ? WHERE id = ?`).run(title, done, id)
  const task = db.prepare(`SELECT id, title, done, created_at FROM tasks WHERE id = ?`).get(id)
  res.json(task)
})

app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" })

  const info = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id)
  if (info.changes === 0) return res.status(404).json({ error: "not found" })
  res.status(204).send()
})

app.get("/api/tasks/stats", (req, res) => {
  const items = db.prepare(`SELECT id, title, done FROM tasks`).all()

  const stats = items.reduce((acc, t) => {
    acc.total++
    if (t.done) acc.done++
    else acc.pending++
    return acc
  }, { total: 0, done: 0, pending: 0 })

  const donePct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0
  res.json({ ...stats, donePct })
})

app.listen(3001, () => console.log("http://localhost:3001"))
