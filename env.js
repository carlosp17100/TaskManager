module.exports = async (req, res) => {
  res.status(200).json({
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    keys: Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("POSTGRES")).sort()
  })
}
