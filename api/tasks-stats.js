const { getPool } = require("./_db")

module.exports = async (req, res) => {
  try {
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

    return res.json({ ...s, donePct })
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) })
  }
}
