export const STORAGE_PREFIX = 'pelis-demo:'
/** Clave única donde viven los comentarios escritos desde el navegador. */
export const STORAGE_KEY = `${STORAGE_PREFIX}comments`

const SEED_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

/**
 * localStorage puede no estar disponible (modo privado, permisos, SSR).
 * @returns {Storage|null}
 */
export function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

/**
 * Valida el formulario de comentario. Devuelve errores por campo, vacío si está ok.
 * @param {{ name?: string, text?: string }} input
 * @returns {{ name?: string, text?: string }}
 */
export function validateComment(input) {
  /** @type {{ name?: string, text?: string }} */
  const errors = {}
  if (!String(input?.name ?? '').trim()) errors.name = 'Poné tu nombre.'
  if (!String(input?.text ?? '').trim()) errors.text = 'Escribí un comentario.'
  return errors
}

/**
 * Convierte la fecha dd/mm/yyyy de la semilla en ISO (yyyy-mm-dd).
 * @param {string} value
 * @returns {string|null}
 */
export function parseSeedDate(value) {
  const match = String(value ?? '').match(SEED_DATE)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function isComment(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.author === 'string' &&
    typeof value.text === 'string' &&
    typeof value.date === 'string'
  )
}

/**
 * Fecha local en ISO corto (yyyy-mm-dd). Evita que un comentario de las 23:00
 * quede fechado al día siguiente por el corrimiento a UTC.
 * @param {Date} date
 * @returns {string}
 */
export function toLocalIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Lee el mapa { [filmId]: Comment[] } desde storage y descarta lo que no tenga forma válida.
 * @param {Storage|null} storage
 * @returns {Record<string, object[]>}
 */
export function readStoredComments(storage) {
  if (!storage) return {}

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    /** @type {Record<string, object[]>} */
    const clean = {}
    for (const [filmId, comments] of Object.entries(parsed)) {
      if (!Array.isArray(comments)) continue
      const valid = comments.filter(isComment)
      if (valid.length > 0) clean[filmId] = valid
    }
    return clean
  } catch {
    return {}
  }
}

/**
 * @param {Storage|null} storage
 * @param {Record<string, object[]>} store
 */
export function writeStoredComments(storage, store) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // sin storage disponible: la demo sigue funcionando en memoria
  }
}

/**
 * Valida y guarda un comentario. Un comentario inválido no toca el storage.
 * @param {Storage|null} storage
 * @param {number} filmId
 * @param {{ name?: string, text?: string }} input
 * @param {Date} [now]
 * @returns {{ ok: true, comment: object, store: Record<string, object[]> } | { ok: false, errors: { name?: string, text?: string }, store: Record<string, object[]> }}
 */
export function addCommentToStore(storage, filmId, input, now = new Date()) {
  const errors = validateComment(input)
  if (errors.name || errors.text) {
    return { ok: false, errors, store: readStoredComments(storage) }
  }

  const store = readStoredComments(storage)
  const key = String(filmId)

  const comment = {
    id: `local-${now.getTime()}`,
    author: String(input.name).trim(),
    text: String(input.text).trim(),
    date: toLocalIsoDate(now),
  }

  const next = { ...store, [key]: [comment, ...(store[key] ?? [])] }
  writeStoredComments(storage, next)

  return { ok: true, comment, store: next }
}

/**
 * Une comentarios semilla y guardados, del más nuevo al más viejo.
 * @param {object[]} seedComments
 * @param {object[]} storedComments
 * @returns {object[]}
 */
export function commentsForFilm(seedComments = [], storedComments = []) {
  return [...seedComments, ...storedComments].sort((a, b) => b.date.localeCompare(a.date))
}
