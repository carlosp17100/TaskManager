const crypto = require("crypto")

const parseCookies = (h) => {
  const out = {}
  if (!h) return out
  h.split(";").forEach((p) => {
    const i = p.indexOf("=")
    if (i === -1) return
    const k = p.slice(0, i).trim()
    const v = p.slice(i + 1).trim()
    out[k] = decodeURIComponent(v)
  })
  return out
}

const getUid = (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "")
  let uid = cookies.uid
  if (!uid || uid === "public") {
    uid = crypto.randomUUID()
    res.setHeader(
      "Set-Cookie",
      `uid=${encodeURIComponent(uid)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`
    )
  }
  return uid
}

module.exports = { getUid }
