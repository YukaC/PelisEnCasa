import { useId, useMemo, useState } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import FilmCard from './FilmCard.jsx'
import { directorOptions, films, genreOptions } from '../data/catalog.js'
import { gridItemMotion, gridListMotion, pressMotion } from '../lib/motion.js'
import { filterFilms, sortFilms } from '../lib/search.js'

const SORT_OPTIONS = [
  { value: 'score', label: 'Mejor score' },
  { value: 'year', label: 'Más nuevas' },
  { value: 'az', label: 'A–Z' },
]

const EMPTY_FILTERS = { query: '', genre: '', director: '' }

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

  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [director, setDirector] = useState('')
  const [sort, setSort] = useState('score')

  const visibleFilms = useMemo(
    () => sortFilms(filterFilms(films, { query, genre, director }), sort),
    [query, genre, director, sort],
  )

  const hasFilters = Boolean(query.trim() || genre || director)
  const total = films.length
  const countLabel =
    visibleFilms.length === total
      ? `${total} películas en cartelera`
      : `${visibleFilms.length} de ${total} películas`

  // Al cambiar género o director, las tarjetas vuelven a entrar escalonadas.
  // El orden (y la búsqueda) no re-montan: ahí manda `layout`, que reacomoda.
  const entryToken = `${genre}|${director}`
  const isEmpty = visibleFilms.length === 0

  function resetFilters() {
    setQuery(EMPTY_FILTERS.query)
    setGenre(EMPTY_FILTERS.genre)
    setDirector(EMPTY_FILTERS.director)
  }

  return (
    <section className="catalog" aria-labelledby="catalog-title">
      <header className="catalog__intro">
        <p className="kicker">Cartelera de barrio</p>
        <h1 id="catalog-title">Pelis en Casa</h1>
        <p className="catalog__lead">
          Once películas para elegir esta noche. Buscá por nombre, director o sinopsis, y entrá a la
          ficha para leer los comentarios.
        </p>
      </header>

      <div className="filters">
        <div className="field field--search">
          <label className="field__label" htmlFor={searchId}>
            Buscar
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, director o sinopsis"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={genreId}>
            Género
          </label>
          <select id={genreId} value={genre} onChange={(event) => setGenre(event.target.value)}>
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
            onChange={(event) => setDirector(event.target.value)}
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
          <select id={sortId} value={sort} onChange={(event) => setSort(event.target.value)}>
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
          Demo: los datos son un JSON embebido y los comentarios se guardan en este navegador.
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
              {visibleFilms.map((film, index) => (
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
    </section>
  )
}
