import { useEffect, useId, useMemo, useState } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import FilmCard from './FilmCard.jsx'
import SafeImage from './SafeImage.jsx'
import { GUEST_LIMIT } from '../lib/films.js'
import {
  FEATURED_ROTATION_MS,
  featuredOrder,
  firstSentence,
  nextFeaturedIndex,
  previousFeaturedIndex,
} from '../lib/featured.js'
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
/** Flecha de la destacada: redonda, sobre el banner, centrada en su alto. */
const HERO_ARROW =
  'absolute top-1/2 -mt-5.5 grid size-11 cursor-pointer place-items-center rounded-full border border-line-strong bg-surface/85 text-fg hover:border-accent hover:bg-surface'

function ArrowIcon({ direction }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === 'left' ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'} />
    </svg>
  )
}

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
  // Posición dentro de la rotación de destacadas, y si quien navega la frenó.
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [rotationPaused, setRotationPaused] = useState(false)
  const [heroEngaged, setHeroEngaged] = useState(false)

  const visibleFilms = useMemo(
    () => sortFilms(filterFilms(films, { query, genre, director }), sort),
    [films, query, genre, director, sort],
  )

  const pageCount = Math.max(1, Math.ceil(visibleFilms.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageFilms = visibleFilms.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Todas las películas visibles, mezcladas: la portada las recorre de a una.
  const rotation = useMemo(() => featuredOrder(films), [films])
  const featured = rotation.length > 0 ? rotation[featuredIndex % rotation.length] : null
  const rotates = rotation.length > 1
  // Con movimiento reducido no avanza sola; tampoco mientras se la mira o se la usa.
  const autoRotates = rotates && !reduced && !rotationPaused && !heroEngaged

  useEffect(() => {
    if (!autoRotates) return undefined
    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => nextFeaturedIndex(current, rotation.length))
    }, FEATURED_ROTATION_MS)
    return () => window.clearInterval(timer)
  }, [autoRotates, rotation.length])

  const hasFilters = Boolean(query.trim() || genre || director)
  const total = films.length
  const countLabel =
    visibleFilms.length === total
      ? `${total} películas`
      : `${visibleFilms.length} de ${total}`

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
        <p className="kicker">Reseñas de cine</p>
        <h1 id="catalog-title" className="text-step-4">Pelis en Casa</h1>
        <p className="max-w-measure text-fg-dim">
          El archivo de reseñas de la casa: puntaje, sinopsis y la palabra de quienes vieron cada
          película. Leé antes de elegir y dejá la tuya cuando la veas.
        </p>
      </header>

      {featured && (
        <motion.article
          className="relative mb-8 overflow-hidden rounded-xl border border-line bg-surface"
          // Sólo mouse y foco de teclado frenan la rotación: un toque no la deja trabada.
          onPointerEnter={(event) => event.pointerType === 'mouse' && setHeroEngaged(true)}
          onPointerLeave={() => setHeroEngaged(false)}
          onFocus={(event) => event.target.matches(':focus-visible') && setHeroEngaged(true)}
          onBlur={() => setHeroEngaged(false)}
          {...gridListMotion(reduced)}
        >
          {/* La clave por película hace que cada destacada entre con el mismo fundido. */}
          <div className="relative">
            <motion.div key={featured.id} {...gridListMotion(reduced)}>
              <SafeImage
                className="block h-40 w-full object-cover opacity-85 sm:h-56 dark:opacity-50"
                src={imageUrl(featured, 'banner')}
                alt=""
                aria-hidden="true"
              />
            </motion.div>
            {rotates && (
              <>
                <motion.button
                  className={`${HERO_ARROW} left-3`}
                  type="button"
                  aria-label="Película destacada anterior"
                  onClick={() =>
                    setFeaturedIndex((current) => previousFeaturedIndex(current, rotation.length))
                  }
                  {...pressMotion(reduced)}
                >
                  <ArrowIcon direction="left" />
                </motion.button>
                <motion.button
                  className={`${HERO_ARROW} right-3`}
                  type="button"
                  aria-label="Película destacada siguiente"
                  onClick={() => setFeaturedIndex((current) => nextFeaturedIndex(current, rotation.length))}
                  {...pressMotion(reduced)}
                >
                  <ArrowIcon direction="right" />
                </motion.button>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2 p-6">
            <p className="kicker">Reseña destacada</p>
            <h2 className="line-clamp-2 text-step-3 leading-[1.1]">{featured.name}</h2>
            <p className="text-step-n1 font-semibold tracking-[0.08em] text-fg-dim uppercase">
              {featured.year} · {featured.duration}
              {Number.isFinite(featured.score) ? ` · ${featured.score} de 10` : ''}
            </p>
            {/* Dos renglones fijos: la página no salta cuando cambia la destacada. */}
            <p className="line-clamp-2 min-h-[3.2em] max-w-measure text-fg-dim">
              {firstSentence(featured.synopsis)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a className="btn" href={`#/film/${featured.id}`}>
                Leer la reseña
              </a>
              {rotates && !reduced && (
                <motion.button
                  className="btn-ghost"
                  type="button"
                  aria-pressed={rotationPaused}
                  onClick={() => setRotationPaused((current) => !current)}
                  {...pressMotion(reduced)}
                >
                  {rotationPaused ? 'Reanudar rotación' : 'Pausar rotación'}
                </motion.button>
              )}
              {rotates && (
                <p className="text-step-n1 font-semibold tracking-[0.08em] text-fg-mute uppercase tabular-nums">
                  {(featuredIndex % rotation.length) + 1} de {rotation.length}
                </p>
              )}
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
              Ninguna película coincide con esos filtros. Probá con otro título, otro género, o
              limpiá la búsqueda.
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
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-4" aria-label="Paginación de las reseñas">
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
