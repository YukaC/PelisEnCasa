import { useId, useMemo, useState } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import FilmCard from './FilmCard.jsx'
import SafeImage from './SafeImage.jsx'
import { GUEST_LIMIT } from '../lib/films.js'
import { firstSentence, pickFeatured } from '../lib/featured.js'
import { imageUrl } from '../lib/image.js'
import { useCatalog } from '../lib/useCatalog.js'
import { useSession } from '../lib/useSession.js'
import { gridItemMotion, gridListMotion, pressMotion } from '../lib/motion.js'
import { filterFilms, sortFilms } from '../lib/search.js'

const SORT_OPTIONS = [
  { value: 'score', label: 'Mejor score' },
  { value: 'year', label: 'Más nuevas' },
  { value: 'az', label: 'A–Z' },
]

const EMPTY_FILTERS = { query: '', genre: '', director: '' }

/** Películas por página: dos filas de la grilla en escritorio, una en celular. */
const PAGE_SIZE = 6

/**
 * Tarjeta de la grilla. Mientras sale (AnimatePresence) queda fuera del flujo con
 * `mode="popLayout"`, así que se le apagan los clicks para que no tape a otra.
 */
function GridItem({ film, index, reduced, ref }) {
  const isPresent = useIsPresent()

  return (
    <motion.li
      ref={ref}
      layout="position"
      style={{ pointerEvents: isPresent ? undefined : 'none' }}
      {...gridItemMotion(index, reduced)}
    >
      <FilmCard film={film} />
    </motion.li>
  )
}

export default function CatalogPage() {
  const searchId = useId()
  const genreId = useId()
  const directorId = useId()
  const sortId = useId()

  const reduced = useReducedMotion()
  const session = useSession()
  const { films, allFilms, genreOptions, directorOptions } = useCatalog()

  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [director, setDirector] = useState('')
  const [sort, setSort] = useState('score')
  const [page, setPage] = useState(1)
  // Cambiar `pick` vuelve a tirar el dado de la película destacada.
  const [pick, setPick] = useState(0)

  const visibleFilms = useMemo(
    () => sortFilms(filterFilms(films, { query, genre, director }), sort),
    [films, query, genre, director, sort],
  )

  const pageCount = Math.max(1, Math.ceil(visibleFilms.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageFilms = visibleFilms.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const featured = useMemo(
    () => pickFeatured(films),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [films, pick],
  )

  const hasFilters = Boolean(query.trim() || genre || director)
  const total = films.length
  const countLabel =
    visibleFilms.length === total
      ? `${total} películas en cartelera`
      : `${visibleFilms.length} de ${total} películas`

  // Al cambiar género o director, las tarjetas vuelven a entrar escalonadas.
  // El orden (y la búsqueda) no re-montan: ahí manda `layout`, que reacomoda.
  const entryToken = `${genre}|${director}|${currentPage}`
  const isEmpty = visibleFilms.length === 0

  /** Cualquier cambio de filtro, orden o búsqueda vuelve a la primera página. */
  function changeFilter(setter, value) {
    setter(value)
    setPage(1)
  }

  function resetFilters() {
    setQuery(EMPTY_FILTERS.query)
    setGenre(EMPTY_FILTERS.genre)
    setDirector(EMPTY_FILTERS.director)
    setPage(1)
  }

  return (
    <section aria-labelledby="catalog-title">
      <header className="flex max-w-2xl flex-col gap-3 pb-8">
        <p className="kicker">Cartelera de barrio</p>
        <h1 id="catalog-title" className="text-step-4">Pelis en Casa</h1>
        <p className="max-w-measure text-fg-dim">
          Películas para elegir esta noche. Buscá por nombre, director o sinopsis, y entrá a la
          ficha para leer los comentarios.
        </p>
      </header>

      {featured && (
        <motion.article className="relative mb-8 overflow-hidden rounded-xl border border-line bg-surface" {...gridListMotion(reduced)}>
          <SafeImage className="block h-40 w-full object-cover opacity-85 dark:opacity-50" src={imageUrl(featured, 'banner')} alt="" aria-hidden="true" />
          <div className="flex flex-col gap-2 p-6">
            <p className="kicker">Destacada de la noche</p>
            <h2 className="text-step-3 leading-[1.1]">{featured.name}</h2>
            <p className="text-step-n1 font-semibold tracking-[0.08em] text-fg-dim uppercase">
              {featured.year} · {featured.duration}
              {Number.isFinite(featured.score) ? ` · ${featured.score} de 10` : ''}
            </p>
            <p className="max-w-measure text-fg-dim">{firstSentence(featured.synopsis)}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <a className="btn" href={`#/film/${featured.id}`}>
                Ver la ficha
              </a>
              <motion.button
                className="btn-ghost"
                type="button"
                onClick={() => setPick((current) => current + 1)}
                {...pressMotion(reduced)}
              >
                Otra al azar
              </motion.button>
            </div>
          </div>
        </motion.article>
      )}

      <div className="grid gap-4 border-y border-line pt-6 pb-4 sm:grid-cols-3 wide:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,1fr))] wide:items-end">
        <div className="flex min-w-0 flex-col gap-2 sm:col-span-full wide:col-auto">
          <label className="field-label" htmlFor={searchId}>
            Buscar
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => changeFilter(setQuery, event.target.value)}
            placeholder="Nombre, director o sinopsis"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label className="field-label" htmlFor={genreId}>
            Género
          </label>
          <select id={genreId} value={genre} onChange={(event) => changeFilter(setGenre, event.target.value)}>
            <option value="">Todos</option>
            {genreOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label className="field-label" htmlFor={directorId}>
            Director
          </label>
          <select
            id={directorId}
            value={director}
            onChange={(event) => changeFilter(setDirector, event.target.value)}
          >
            <option value="">Todos</option>
            {directorOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label className="field-label" htmlFor={sortId}>
            Orden
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => changeFilter(setSort, event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-4 pb-6">
        <p className="text-step-n1 font-semibold tracking-[0.08em] text-fg-dim uppercase" role="status" aria-live="polite">
          {countLabel}
        </p>
        <p className="max-w-[46ch] text-step-n1 text-fg-mute">
          {!session && allFilms.length > GUEST_LIMIT
            ? `Estás viendo las últimas ${GUEST_LIMIT}. Iniciá sesión para ver el catálogo completo.`
            : 'Demo: los datos son un JSON embebido y los cambios se guardan en este navegador.'}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isEmpty ? (
          <motion.div
            key="empty"
            className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line-strong px-6 py-8"
            role="status"
            aria-live="polite"
            {...gridListMotion(reduced)}
          >
            <p className="font-display text-step-2">Sin resultados</p>
            <p className="max-w-[46ch] text-fg-dim">
              No hay películas con esos filtros. Probá con otra búsqueda o limpiá todo.
            </p>
            {hasFilters && (
              <motion.button
                className="btn-ghost"
                type="button"
                onClick={resetFilters}
                {...pressMotion(reduced)}
              >
                Limpiar filtros
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.ul key="grid" className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] sm:gap-x-6 sm:gap-y-8" {...gridListMotion(reduced)}>
            <AnimatePresence mode="popLayout">
              {pageFilms.map((film, index) => (
                <GridItem
                  key={`${entryToken}:${film.id}`}
                  film={film}
                  index={index}
                  reduced={reduced}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </AnimatePresence>

      {pageCount > 1 && (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-4" aria-label="Paginación de la cartelera">
          <motion.button
            className="btn-ghost"
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            {...pressMotion(reduced)}
          >
            Atrás
          </motion.button>
          <p className="text-step-n1 font-semibold tracking-[0.08em] text-fg-mute uppercase">
            Página {currentPage} de {pageCount}
          </p>
          <motion.button
            className="btn-ghost"
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            {...pressMotion(reduced)}
          >
            Siguiente
          </motion.button>
        </nav>
      )}
    </section>
  )
}
