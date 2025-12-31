const { getPool } = require("./_db")

module.exports = async (req, res) => {
  const pool = getPool()

  const r = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE done = true)::int AS done,
      COUNT(*) FILTER (WHERE done = false)::int AS pending
    FROM tasks
  `)

  const s = r.rows[0]
  const donePct = s.total ? Math.round((s.done / s.total) * 100) : 0

  res.json({ ...s, donePct })
}
