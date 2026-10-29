import { useCallback, useEffect, useState } from 'react'

const FILM_PATH = /^\/film\/(\d+)$/

/**
 * Traduce el hash de la URL a una ruta de la app. Único lugar donde vive el ruteo.
 * @param {string|null|undefined} hash
 * @returns {{ name: 'catalog' } | { name: 'film', filmId: number } | { name: 'not-found', path: string }}
 */
export function parseHash(hash) {
  const raw = String(hash ?? '').replace(/^#/, '')
  const path = (raw.split('?')[0] || '/').replace(/\/+$/, '') || '/'

  if (path === '/') return { name: 'catalog' }

  const match = path.match(FILM_PATH)
  if (match) return { name: 'film', filmId: Number(match[1]) }

  return { name: 'not-found', path }
}

/**
 * Ruta actual, resuelta con `hashchange` (sin router externo).
 * @returns {ReturnType<typeof parseHash>}
 */
export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))

  const sync = useCallback(() => {
    setRoute(parseHash(window.location.hash))
  }, [])

  useEffect(() => {
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [sync])

  return route
}

/**
 * Navegación programática por hash.
 * @param {string} path
 */
export function navigate(path) {
  window.location.hash = path
}
