import { STORAGE_PREFIX } from './comments.js'

/** Clave única donde vive la sesión simulada. */
export const SESSION_KEY = `${STORAGE_PREFIX}session`

/**
 * Única cuenta de la demo. No es un secreto: el formulario la trae cargada.
 * La tabla `usuarios` del TP no se copió, así que acá no hay credenciales reales.
 */
export const DEMO_ACCOUNT = Object.freeze({ user: 'demo', password: 'pelis2022' })

const WRONG_CREDENTIALS = 'Usuario o contraseña incorrectos. Usá la cuenta de ejemplo.'

/** Sesión vigente. Es la fuente de verdad: el storage sólo la hace sobrevivir a una recarga. */
let current = null
let hydrated = false
const listeners = new Set()

function isSession(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.user === 'string' &&
    value.user.trim() !== ''
  )
}

function setCurrent(next) {
  current = next
  hydrated = true
  for (const listener of listeners) listener()
}

/**
 * Valida el formulario de ingreso. Devuelve errores por campo, o `form` cuando
 * los datos están completos pero no son los de la cuenta de ejemplo.
 * @param {{ user?: string, password?: string }} input
 * @returns {{ user?: string, password?: string, form?: string }}
 */
export function validateLogin(input) {
  const user = String(input?.user ?? '').trim()
  const password = String(input?.password ?? '')

  /** @type {{ user?: string, password?: string, form?: string }} */
  const errors = {}
  if (!user) errors.user = 'Poné tu usuario.'
  if (!password) errors.password = 'Poné tu contraseña.'
  if (errors.user || errors.password) return errors

  if (user !== DEMO_ACCOUNT.user || password !== DEMO_ACCOUNT.password) {
    errors.form = WRONG_CREDENTIALS
  }
  return errors
}

/**
 * Lee la sesión guardada y descarta lo que no tenga forma válida.
 * @param {Storage|null} storage
 * @returns {{ user: string } | null}
 */
export function readSession(storage) {
  if (!storage) return null
  try {
    const raw = storage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isSession(parsed) ? { user: parsed.user } : null
  } catch {
    return null
  }
}

/**
 * Abre la sesión si las credenciales son las de la cuenta de ejemplo.
 * Un intento inválido no toca el storage ni la sesión vigente.
 * @param {Storage|null} storage
 * @param {{ user?: string, password?: string }} input
 * @returns {{ ok: true, session: { user: string } } | { ok: false, errors: { user?: string, password?: string, form?: string } }}
 */
export function signIn(storage, input) {
  const errors = validateLogin(input)
  if (errors.user || errors.password || errors.form) return { ok: false, errors }

  const session = { user: String(input.user).trim() }
  try {
    storage?.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // sin storage disponible: la sesión dura lo que dure la pestaña
  }
  setCurrent(session)
  return { ok: true, session }
}

/**
 * Cierra la sesión.
 * @param {Storage|null} storage
 */
export function signOut(storage) {
  try {
    storage?.removeItem(SESSION_KEY)
  } catch {
    // sin storage disponible: alcanza con limpiar la sesión en memoria
  }
  setCurrent(null)
}

/**
 * Sesión vigente. La primera lectura la recupera del storage.
 * @param {Storage|null} [storage]
 * @returns {{ user: string } | null}
 */
export function getSession(storage = null) {
  if (!hydrated) {
    current = readSession(storage)
    hydrated = true
  }
  return current
}

/**
 * Vuelve a leer el storage: otra pestaña abrió o cerró la sesión.
 * @param {Storage|null} storage
 */
export function syncSession(storage) {
  const next = readSession(storage)
  if (next?.user === current?.user) return
  setCurrent(next)
}

/**
 * @param {() => void} listener
 * @returns {() => void} función para dejar de escuchar
 */
export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
