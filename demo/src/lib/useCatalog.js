import { useMemo, useSyncExternalStore } from 'react'
import { resolveFilm, seedFilms } from '../data/catalog.js'
import { getStorage } from './comments.js'
import { FILMS_KEY, readFilms, visibleFilms } from './films.js'
import { collectOptions } from './search.js'
import { useSession } from './useSession.js'

/** Catálogo vigente con la forma de `db.json`. La primera lectura lo recupera del storage. */
let current = null
const listeners = new Set()

function getRawFilms() {
  if (!current) current = readFilms(getStorage(), seedFilms)
  return current
}

function subscribe(listener) {
  listeners.add(listener)
  const onStorage = (event) => {
    if (event.key === null || event.key === FILMS_KEY) commitFilms(readFilms(getStorage(), seedFilms))
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * Publica el catálogo que devolvió `addFilm`, `editFilm` o `deleteFilm`.
 * @param {object[]} next
 */
export function commitFilms(next) {
  current = next
  for (const listener of listeners) listener()
}

/**
 * Catálogo de la demo. `films` es lo que ve quien navega (las últimas 10 sin sesión,
 * como la API del TP); `getFilm` resuelve cualquier id, igual que `/peliculas/<id>`.
 */
export function useCatalog() {
  const rawFilms = useSyncExternalStore(subscribe, getRawFilms, () => seedFilms)
  const session = useSession()

  return useMemo(() => {
    const allFilms = rawFilms.map(resolveFilm)
    const films = visibleFilms(allFilms, session)
    return {
      rawFilms,
      allFilms,
      films,
      genreOptions: collectOptions(films, 'genres'),
      directorOptions: collectOptions(films, 'directors'),
      getFilm: (id) => allFilms.find((film) => film.id === Number(id)) ?? null,
      getRawFilm: (id) => rawFilms.find((film) => film.id === Number(id)) ?? null,
    }
  }, [rawFilms, session])
}
