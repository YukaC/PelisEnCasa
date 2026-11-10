import { STORAGE_PREFIX } from './comments.js'

/** Clave única donde vive el tema elegido con el switch. */
export const THEME_KEY = `${STORAGE_PREFIX}theme`

export const THEMES = Object.freeze(['dark', 'light'])

/** Color de la barra del navegador para cada tema: el fondo de la página. */
export const THEME_COLORS = Object.freeze({ dark: '#000000', light: '#f6f1e7' })

function isTheme(value) {
  return THEMES.includes(value)
}

/**
 * Tema que la persona eligió con el switch, o `null` si nunca eligió.
 * @param {Pick<Storage, 'getItem'> | null} storage
 * @returns {'dark' | 'light' | null}
 */
export function readStoredTheme(storage) {
  if (!storage) return null
  try {
    const value = storage.getItem(THEME_KEY)
    return isTheme(value) ? value : null
  } catch {
    return null
  }
}

/**
 * La elección guardada gana; sin elección, la primera visita sigue al sistema.
 * @param {'dark' | 'light' | null} stored
 * @param {boolean} systemPrefersDark
 * @returns {'dark' | 'light'}
 */
export function resolveTheme(stored, systemPrefersDark) {
  if (isTheme(stored)) return stored
  return systemPrefersDark ? 'dark' : 'light'
}

/** @param {'dark' | 'light'} theme */
export function nextTheme(theme) {
  return theme === 'dark' ? 'light' : 'dark'
}

/**
 * Guarda la elección. Devuelve `false` si el tema no existe o el storage no deja escribir.
 * @param {Pick<Storage, 'setItem'> | null} storage
 * @param {string} theme
 */
export function storeTheme(storage, theme) {
  if (!storage || !isTheme(theme)) return false
  try {
    storage.setItem(THEME_KEY, theme)
    return true
  } catch {
    return false
  }
}
