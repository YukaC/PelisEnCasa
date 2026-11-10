import { useSyncExternalStore } from 'react'
import { getStorage } from './comments.js'
import { THEME_COLORS, THEME_KEY, nextTheme, readStoredTheme, resolveTheme, storeTheme } from './theme.js'

const SYSTEM_DARK = '(prefers-color-scheme: dark)'

/** Tema vigente. El storage sólo lo hace sobrevivir a una recarga. */
let current = null
const listeners = new Set()

function systemPrefersDark() {
  return typeof window.matchMedia === 'function' && window.matchMedia(SYSTEM_DARK).matches
}

/** `index.html` hace lo mismo antes del primer pintado; esto lo mantiene al día. */
function apply(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
}

function setCurrent(theme) {
  current = theme
  apply(theme)
  for (const listener of listeners) listener()
}

function sync() {
  setCurrent(resolveTheme(readStoredTheme(getStorage()), systemPrefersDark()))
}

function subscribe(listener) {
  listeners.add(listener)
  const media = typeof window.matchMedia === 'function' ? window.matchMedia(SYSTEM_DARK) : null
  // `key` is null when another tab clears the whole storage.
  const onStorage = ({ key }) => {
    if (key === null || key === THEME_KEY) sync()
  }
  media?.addEventListener('change', sync)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    media?.removeEventListener('change', sync)
    window.removeEventListener('storage', onStorage)
  }
}

function getSnapshot() {
  if (current === null) {
    current = resolveTheme(readStoredTheme(getStorage()), systemPrefersDark())
    apply(current)
  }
  return current
}

function toggleTheme() {
  const theme = nextTheme(getSnapshot())
  storeTheme(getStorage(), theme)
  setCurrent(theme)
}

/**
 * Tema claro/oscuro de la demo y el switch que lo alterna. Sigue al sistema hasta
 * que la persona elige; después manda lo guardado, también desde otra pestaña.
 * @returns {{ theme: 'dark' | 'light', toggleTheme: () => void }}
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'dark')
  return { theme, toggleTheme }
}
