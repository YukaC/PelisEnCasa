import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import CommentForm from './CommentForm.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import SafeImage from './SafeImage.jsx'
import ScoreMeter from './ScoreMeter.jsx'
import { seedCommentsByFilm } from '../data/catalog.js'
import { imageUrl } from '../lib/image.js'
import { commentsForFilm, readStoredComments, getStorage } from '../lib/comments.js'
import { deleteFilm } from '../lib/films.js'
import { commentItemMotion, pressMotion } from '../lib/motion.js'
import { navigate } from '../lib/route.js'
import { commitFilms, useCatalog } from '../lib/useCatalog.js'
import { formatDate, formatScore } from '../lib/format.js'
import { useSession } from '../lib/useSession.js'

export default function FilmPage({ filmId }) {
  const { getFilm } = useCatalog()
  const film = getFilm(filmId)
  if (!film) return <NotFoundPage message="No hay ninguna película con ese id en la cartelera." />
  return <FilmDetail film={film} />
}

function FilmDetail({ film }) {
  const reduced = useReducedMotion()
  const session = useSession()
  const { rawFilms } = useCatalog()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [store, setStore] = useState(() => readStoredComments(getStorage()))

  const comments = useMemo(
    () => commentsForFilm(seedCommentsByFilm[film.id] ?? [], store[film.id] ?? []),
    [film.id, store],
  )

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    const result = deleteFilm(getStorage(), rawFilms, session, film.id, comments.length)
    if (!result.ok) {
      setConfirmingDelete(false)
      setDeleteError(result.message)
      return
    }
    navigate('/')
    commitFilms(result.films)
  }

  return (
    <article>
      <a
        className="mb-4 inline-block text-step-n1 font-semibold tracking-[0.04em] text-fg-dim no-underline hover:text-accent-text"
        href="#/"
      >
        <span aria-hidden="true">← </span>Volver a la cartelera
      </a>

      <div className="banner-veil relative h-[clamp(9rem,28vw,18rem)] overflow-hidden rounded-xl bg-raised wide:h-[clamp(14rem,26vw,20rem)]">
        <SafeImage
          className="size-full object-cover"
          src={imageUrl(film, 'banner')}
          alt=""
          aria-hidden="true"
        />
      </div>

      <header className="-mt-8 grid grid-cols-1 gap-6 wide:-mt-12 wide:grid-cols-[12.5rem_minmax(0,1fr)] wide:gap-8">
        <div className="relative z-1 aspect-2/3 w-[min(11rem,45vw)] overflow-hidden rounded-md bg-raised shadow-poster wide:w-full">
          <SafeImage
            className="size-full object-cover"
            src={imageUrl(film, 'poster')}
            alt={`Poster de ${film.name}`}
            width="300"
            height="450"
          />
        </div>

        {/* El margen negativo es para el poster: el texto arranca debajo del banner. */}
        <div className="flex flex-col gap-4 wide:pt-12">
          <p className="kicker">{film.genres.join(' · ')}</p>
          <h1 className="text-step-4">{film.name}</h1>

          <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-x-6 gap-y-3 border-y border-line py-4">
            <div>
              <dt className="field-label">Año</dt>
              <dd className="m-0 text-step-0 text-fg">{film.year}</dd>
            </div>
            <div>
              <dt className="field-label">Duración</dt>
              <dd className="m-0 text-step-0 text-fg">{film.duration}</dd>
            </div>
            <div>
              <dt className="field-label">Score</dt>
              <dd className="m-0 text-step-0 text-fg">
                <span className="inline-block tabular-nums">
                  <span aria-hidden="true">★ </span>
                  {formatScore(film.score)}
                  <span className="sr-only"> de 10</span>
                </span>
                <ScoreMeter score={film.score} />
              </dd>
            </div>
            <div>
              <dt className="field-label">Dirección</dt>
              <dd className="m-0 text-step-0 text-fg">{film.directors.join(', ')}</dd>
            </div>
            <div>
              <dt className="field-label">Géneros</dt>
              <dd className="m-0 text-step-0 text-fg">{film.genres.join(', ')}</dd>
            </div>
          </dl>

          <p className="max-w-measure text-step-1 leading-[1.7] text-fg-dim">{film.synopsis}</p>

          {session && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a className="btn-ghost" href={`#/film/${film.id}/editar`}>
                Editar película
              </a>
              <motion.button
                className="btn-ghost"
                type="button"
                onClick={handleDelete}
                onBlur={() => setConfirmingDelete(false)}
                {...pressMotion(reduced)}
              >
                {confirmingDelete ? 'Confirmar: borrar película' : 'Borrar película'}
              </motion.button>
              <p className="min-h-[1.5em] basis-full text-step-n1 font-semibold text-danger" role="alert">
                {deleteError}
              </p>
            </div>
          )}
        </div>
      </header>

      <section className="mt-12 border-t border-line pt-6" aria-labelledby="comments-title">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 id="comments-title" className="text-step-3">
            Comentarios
          </h2>
          <p className="text-step-n1 tracking-[0.08em] text-fg-mute uppercase">
            {comments.length === 1 ? '1 comentario' : `${comments.length} comentarios`}
          </p>
        </div>

        {session ? (
          <CommentForm filmId={film.id} author={session.user} onSaved={setStore} />
        ) : (
          <div className="mb-8 flex flex-wrap items-center gap-4 text-fg-dim">
            <p>Sólo quien inició sesión puede dejar una reseña.</p>
            <a className="btn" href={`#/login?next=/film/${film.id}`}>
              Iniciar sesión para comentar
            </a>
          </div>
        )}

        {comments.length === 0 && (
          <p className="border-t border-line pt-4 text-fg-mute">Todavía no hay comentarios.</p>
        )}

        {/* La lista queda montada desde el arranque: así el primer comentario
            también entra con spring en vez de aparecer sin animación. */}
        <ol className="flex flex-col">
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.li
                className="border-t border-line py-4"
                key={comment.id}
                layout="position"
                {...commentItemMotion(reduced)}
              >
                <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <span className="font-semibold">{comment.author}</span>
                  <time className="text-step-n1 text-fg-mute tabular-nums" dateTime={comment.date}>
                    {formatDate(comment.date)}
                  </time>
                  {comment.id.startsWith('local-') && (
                    <span className="rounded-full border border-line-strong px-[0.4rem] py-[0.05rem] text-label tracking-[0.08em] text-accent-text uppercase">
                      guardado acá
                    </span>
                  )}
                </div>
                <p className="max-w-measure text-fg-dim">{comment.text}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </section>
    </article>
  )
}
