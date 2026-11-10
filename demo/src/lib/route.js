import { useCallback, useEffect, useState } from 'react'

const FILM_PATH = /^\/film\/(\d+)$/
const FILM_EDIT_PATH = /^\/film\/(\d+)\/editar$/

/** Destino después del login: sólo rutas internas, nunca una URL externa. */
function safeNext(query) {
  const next = new URLSearchParams(query ?? '').get('next') ?? ''
  return next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

/**
 * Traduce el hash de la URL a una ruta de la app. Único lugar donde vive el ruteo.
 * @param {string|null|undefined} hash
 * @returns {{ name: 'catalog' } | { name: 'film', filmId: number } | { name: 'film-edit', filmId: number } | { name: 'film-new' } | { name: 'login', next: string } | { name: 'not-found', path: string }}
 */
export function parseHash(hash) {
  const raw = String(hash ?? '').replace(/^#/, '')
  const [rawPath, query] = raw.split('?')
  const path = (rawPath || '/').replace(/\/+$/, '') || '/'

  if (path === '/') return { name: 'catalog' }
  if (path === '/login') return { name: 'login', next: safeNext(query) }
  if (path === '/subir') return { name: 'film-new' }

  const edit = path.match(FILM_EDIT_PATH)
  if (edit) return { name: 'film-edit', filmId: Number(edit[1]) }

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
