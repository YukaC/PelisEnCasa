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
    <section className="catalog" aria-labelledby="catalog-title">
      <header className="catalog__intro">
        <p className="kicker">Cartelera de barrio</p>
        <h1 id="catalog-title">Pelis en Casa</h1>
        <p className="catalog__lead">
          Películas para elegir esta noche. Buscá por nombre, director o sinopsis, y entrá a la
          ficha para leer los comentarios.
        </p>
      </header>

      {featured && (
        <motion.article className="hero" {...gridListMotion(reduced)}>
          <SafeImage className="hero__banner" src={imageUrl(featured, 'banner')} alt="" aria-hidden="true" />
          <div className="hero__body">
            <p className="kicker">Destacada de la noche</p>
            <h2 className="hero__title">{featured.name}</h2>
            <p className="hero__meta">
              {featured.year} · {featured.duration}
              {Number.isFinite(featured.score) ? ` · ${featured.score} de 10` : ''}
            </p>
            <p className="hero__synopsis">{firstSentence(featured.synopsis)}</p>
            <div className="hero__actions">
              <a className="button" href={`#/film/${featured.id}`}>
                Ver la ficha
              </a>
              <motion.button
                className="button button--ghost"
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

      <div className="filters">
        <div className="field field--search">
          <label className="field__label" htmlFor={searchId}>
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

        <div className="field">
          <label className="field__label" htmlFor={genreId}>
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

        <div className="field">
          <label className="field__label" htmlFor={directorId}>
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

        <div className="field">
          <label className="field__label" htmlFor={sortId}>
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

      <div className="results">
        <p className="results__count" role="status" aria-live="polite">
          {countLabel}
        </p>
        <p className="demo-note">
          {!session && allFilms.length > GUEST_LIMIT
            ? `Estás viendo las últimas ${GUEST_LIMIT}. Iniciá sesión para ver el catálogo completo.`
            : 'Demo: los datos son un JSON embebido y los cambios se guardan en este navegador.'}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isEmpty ? (
          <motion.div
            key="empty"
            className="empty"
            role="status"
            aria-live="polite"
            {...gridListMotion(reduced)}
          >
            <p className="empty__title">Sin resultados</p>
            <p className="empty__text">
              No hay películas con esos filtros. Probá con otra búsqueda o limpiá todo.
            </p>
            {hasFilters && (
              <motion.button
                className="button button--ghost"
                type="button"
                onClick={resetFilters}
                {...pressMotion(reduced)}
              >
                Limpiar filtros
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.ul key="grid" className="film-grid" {...gridListMotion(reduced)}>
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
        <nav className="pager" aria-label="Paginación de la cartelera">
          <motion.button
            className="button button--ghost"
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            {...pressMotion(reduced)}
          >
            Atrás
          </motion.button>
          <p className="pager__status">
            Página {currentPage} de {pageCount}
          </p>
          <motion.button
            className="button button--ghost"
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
