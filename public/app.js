const $ = (s) => document.querySelector(s)

const state = {
  page: 1,
  limit: 8,
  done: "",
  search: "",
  total: 0,
  items: []
}

const api = {
  async list() {
    const qs = new URLSearchParams()
    qs.set("page", String(state.page))
    qs.set("limit", String(state.limit))
    if (state.done === "0" || state.done === "1") qs.set("done", state.done)
    if (state.search.trim()) qs.set("search", state.search.trim())

    const r = await fetch(`/api/tasks?${qs.toString()}`)
    if (!r.ok) throw new Error(`list failed (${r.status})`)
    return r.json()
  },
  async stats() {
    const r = await fetch("/api/tasks-stats")
    if (!r.ok) throw new Error(`stats failed (${r.status})`)
    return r.json()
  },
  async create(title) {
    const r = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    })
    const data = await r.json().catch(() => null)
    if (!r.ok) throw new Error(data?.error || `create failed (${r.status})`)
    return data
  },
  async patch(id, payload) {
    const r = await fetch(`/api/task-id?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const data = await r.json().catch(() => null)
    if (!r.ok) throw new Error(data?.error || `patch failed (${r.status})`)
    return data
  },
  async remove(id) {
    const r = await fetch(`/api/task-id?id=${id}`, { method: "DELETE" })
    if (!r.ok && r.status !== 204) throw new Error(`delete failed (${r.status})`)
  }
}

const els = {
  form: $("#createForm"),
  input: $("#titleInput"),
  err: $("#createError"),
  list: $("#list"),
  status: $("#statusBar"),
  prev: $("#prevBtn"),
  next: $("#nextBtn"),
  pageInfo: $("#pageInfo"),
  search: $("#searchInput"),
  segBtns: Array.from(document.querySelectorAll(".segBtn")),
  statTotal: $("#statTotal"),
  statDone: $("#statDone"),
  statPending: $("#statPending"),
  statPct: $("#statPct")
}

const setCreateError = (msg) => {
  if (!msg) {
    els.err.textContent = ""
    els.err.classList.add("hidden")
    return
  }
  els.err.textContent = msg
  els.err.classList.remove("hidden")
}

const setStatus = (msg) => {
  els.status.textContent = msg || ""
}

const renderStats = (s) => {
  els.statTotal.textContent = String(s.total)
  els.statDone.textContent = String(s.done)
  els.statPending.textContent = String(s.pending)
  els.statPct.textContent = `${s.donePct}%`
}

const renderList = () => {
  els.list.innerHTML = ""

  if (state.items.length === 0) {
    const li = document.createElement("li")
    li.className = "muted"
    li.textContent = "No hay tareas con esos filtros."
    els.list.appendChild(li)
    return
  }

  state.items.forEach((t) => {
    const li = document.createElement("li")
    li.className = "item"

    const left = document.createElement("div")
    left.className = `title ${t.done ? "done" : ""}`

    const cb = document.createElement("input")
    cb.type = "checkbox"
    cb.checked = Boolean(t.done)
    cb.addEventListener("change", async () => {
      try {
        await api.patch(t.id, { done: cb.checked })
        await refresh()
      } catch (e) {
        cb.checked = !cb.checked
        alert(String(e.message || e))
      }
    })

    const span = document.createElement("span")
    span.textContent = t.title

    left.appendChild(cb)
    left.appendChild(span)

    const editBtn = document.createElement("button")
    editBtn.className = "iconBtn"
    editBtn.textContent = "Editar"
    editBtn.addEventListener("click", async () => {
      const nextTitle = prompt("Nuevo título:", t.title)
      if (nextTitle === null) return
      const title = String(nextTitle).trim()
      if (!title) return alert("Título inválido")
      try {
        await api.patch(t.id, { title })
        await refresh()
      } catch (e) {
        alert(String(e.message || e))
      }
    })

    const delBtn = document.createElement("button")
    delBtn.className = "iconBtn"
    delBtn.textContent = "X"
    delBtn.addEventListener("click", async () => {
      const ok = confirm("¿Eliminar tarea?")
      if (!ok) return
      try {
        await api.remove(t.id)
        const maxPage = Math.max(1, Math.ceil((state.total - 1) / state.limit))
        state.page = Math.min(state.page, maxPage)
        await refresh()
      } catch (e) {
        alert(String(e.message || e))
      }
    })

    li.appendChild(left)
    li.appendChild(editBtn)
    li.appendChild(delBtn)
    els.list.appendChild(li)
  })
}

const renderPagination = () => {
  const maxPage = Math.max(1, Math.ceil(state.total / state.limit))
  els.pageInfo.textContent = `Página ${state.page} de ${maxPage}`
  els.prev.disabled = state.page <= 1
  els.next.disabled = state.page >= maxPage
}

let searchTimer = null
const onSearch = (value) => {
  state.search = value
  state.page = 1
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => refresh(), 250)
}

const refresh = async () => {
  setStatus("Cargando...")
  const [listData, statsData] = await Promise.all([api.list(), api.stats()])
  state.total = listData.total
  state.items = listData.items
  renderStats(statsData)
  renderList()
  renderPagination()
  setStatus(`${state.total} tarea(s)`)
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault()
  setCreateError("")
  const title = els.input.value.trim()
  if (!title) return setCreateError("Escribe un título")

  try {
    await api.create(title)
    els.input.value = ""
    state.page = 1
    await refresh()
  } catch (err) {
    setCreateError(String(err.message || err))
  }
})

els.prev.addEventListener("click", async () => {
  state.page = Math.max(1, state.page - 1)
  await refresh()
})

els.next.addEventListener("click", async () => {
  state.page = state.page + 1
  await refresh()
})

els.search.addEventListener("input", (e) => onSearch(e.target.value))

els.segBtns.forEach((b) => {
  b.addEventListener("click", async () => {
    els.segBtns.forEach((x) => x.classList.remove("active"))
    b.classList.add("active")
    state.done = b.dataset.done
    state.page = 1
    await refresh()
  })
})

refresh().catch((e) => {
  setStatus("")
  alert(String(e.message || e))
})
