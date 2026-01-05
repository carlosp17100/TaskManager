const { getSql, initDb } = require("../_db")
const { getUid } = require("../_uid")

module.exports = async (req, res) => {
  try {
    await initDb()
    const sql = getSql()
    const uid = getUid(req, res)

    const r = await sql`
      SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN done THEN 1 ELSE 0 END)::int AS done,
        SUM(CASE WHEN NOT done THEN 1 ELSE 0 END)::int AS pending
      FROM tasks
      WHERE user_id = ${uid};
    `

    const total = r[0]?.total ?? 0
    const done = r[0]?.done ?? 0
    const pending = r[0]?.pending ?? 0
    const pctDone = total === 0 ? 0 : Math.round((done / total) * 100)

    res.status(200).json({ total, done, pending, pctDone, percentDone: pctDone })
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" })
  }
}
