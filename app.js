const $ = (id) => document.getElementById(id)

const state = {
  done: "",
  search: "",
  page: 1,
  pageSize: 7,
  total: 0,
  items: []
}

const setStatus = (msg) => {
  $("statusBar").textContent = msg || ""
}

const setCreateError = (msg) => {
  const el = $("createError")
  if (!msg) {
    el.classList.add("hidden")
    el.textContent = ""
    return
  }
  el.classList.remove("hidden")
  el.textContent = msg
}

const qs = (obj) => {
  const p = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => {
    if (v === "" || v === null || v === undefined) return
    p.set(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ""
}

const api = async (path, options) => {
  const res = await fetch(path, options)
  const ct = res.headers.get("content-type") || ""
  const isJson = ct.includes("application/json")
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)
  if (!res.ok) {
    const msg = (data && data.error) ? data.error : (typeof data === "string" && data ? data : `HTTP ${res.status}`)
    throw new Error(msg)
  }
  return data
}

const loadStats = async () => {
  const s = await api(`/api/tasks-stats${qs({ done: state.done, search: state.search })}`)
  $("statTotal").textContent = s.total
  $("statDone").textContent = s.done
  $("statPending").textContent = s.pending
  $("statPct").textContent = `${s.pctDone}%`
}

const renderList = () => {
  const ul = $("list")
  ul.innerHTML = ""

  state.items.forEach((t) => {
    const li = document.createElement("li")
    li.className = "item"

    const left = document.createElement("div")
    left.className = "itemLeft"

    const title = document.createElement("div")
    title.className = "itemTitle"
    title.textContent = t.title

    const badge = document.createElement("div")
    badge.className = `badge ${t.done ? "done" : "todo"}`
    badge.textContent = t.done ? "Hecha" : "Pendiente"

    left.appendChild(title)
    left.appendChild(badge)

    const actions = document.createElement("div")
    actions.className = "actions"

    const toggle = document.createElement("button")
    toggle.className = "btn"
    toggle.textContent = t.done ? "Marcar pendiente" : "Marcar hecha"
    toggle.onclick = async () => {
      try {
        setStatus("Actualizando...")
        await api(`/api/task-id${qs({ id: t.id })}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ done: !t.done })
        })
        await refresh()
      } catch (e) {
        setStatus(String(e.message || e))
      }
    }

    const del = document.createElement("button")
    del.className = "btn btnDanger"
    del.textContent = "Eliminar"
    del.onclick = async () => {
      try {
        setStatus("Eliminando...")
        await api(`/api/task-id${qs({ id: t.id })}`, { method: "DELETE" })
        if (state.items.length === 1 && state.page > 1) state.page -= 1
        await refresh()
      } catch (e) {
        setStatus(String(e.message || e))
      }
    }

    actions.appendChild(toggle)
    actions.appendChild(del)

    li.appendChild(left)
    li.appendChild(actions)
    ul.appendChild(li)
  })

  $("pageInfo").textContent = `Página ${state.page}`
}

const loadTasks = async () => {
  const data = await api(`/api/tasks${qs({
    done: state.done,
    search: state.search,
    page: state.page,
    pageSize: state.pageSize
  })}`)

  state.items = data.items || []
  state.total = data.total || 0

  renderList()

  const maxPage = Math.max(1, Math.ceil(state.total / state.pageSize))
  $("prevBtn").disabled = state.page <= 1
  $("nextBtn").disabled = state.page >= maxPage
}

const refresh = async () => {
  try {
    setStatus("Cargando...")
    await Promise.all([loadTasks(), loadStats()])
    setStatus("")
  } catch (e) {
    setStatus(String(e.message || e))
  }
}

const init = () => {
  $("createForm").addEventListener("submit", async (ev) => {
    ev.preventDefault()
    const title = $("titleInput").value.trim()
    if (!title) return
    try {
      setCreateError("")
      setStatus("Creando...")
      await api("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title })
      })
      $("titleInput").value = ""
      state.page = 1
      await refresh()
    } catch (e) {
      setCreateError(String(e.message || e))
      setStatus("")
    }
  })

  $("searchInput").addEventListener("input", async (ev) => {
    state.search = ev.target.value.trim()
    state.page = 1
    await refresh()
  })

  document.querySelectorAll(".segBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".segBtn").forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      state.done = btn.getAttribute("data-done") ?? ""
      state.page = 1
      await refresh()
    })
  })

  $("prevBtn").addEventListener("click", async () => {
    if (state.page > 1) {
      state.page -= 1
      await refresh()
    }
  })

  $("nextBtn").addEventListener("click", async () => {
    state.page += 1
    await refresh()
  })

  refresh()
}

window.addEventListener("DOMContentLoaded", init)
