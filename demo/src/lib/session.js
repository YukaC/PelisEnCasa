import { STORAGE_PREFIX } from './comments.js'

/** Clave única donde vive la sesión simulada. */
export const SESSION_KEY = `${STORAGE_PREFIX}session`

/**
 * Las dos cuentas que trae `db['usuarios']` en el TP. No son un secreto: el formulario
 * las trae cargadas y la pantalla avisa que es un ingreso simulado, sin backend.
 */
export const DEMO_ACCOUNTS = Object.freeze([
  Object.freeze({ user: 'Yuka', password: '123' }),
  Object.freeze({ user: 'Clainux', password: '456' }),
])

/** Cuenta con la que arranca cargado el formulario. */
export const DEMO_ACCOUNT = DEMO_ACCOUNTS[0]

const WRONG_CREDENTIALS = 'Usuario o contraseña incorrectos. Usá una de las cuentas de ejemplo.'

function findAccount(user, password) {
  return DEMO_ACCOUNTS.find((account) => account.user === user && account.password === password) ?? null
}

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
 * los datos están completos pero no son los de ninguna de las dos cuentas del TP.
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

  if (!findAccount(user, password)) {
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
 * Abre la sesión si las credenciales son las de alguna de las cuentas del TP.
 * Un intento inválido no toca el storage ni la sesión vigente.
 * @param {Storage|null} storage
 * @param {{ user?: string, password?: string }} input
 * @returns {{ ok: true, session: { user: string } } | { ok: false, errors: { user?: string, password?: string, form?: string } }}
 */
export function signIn(storage, input) {
  const errors = validateLogin(input)
  if (errors.user || errors.password || errors.form) return { ok: false, errors }

  const account = findAccount(String(input.user).trim(), String(input.password ?? ''))
  const session = { user: account.user }
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
