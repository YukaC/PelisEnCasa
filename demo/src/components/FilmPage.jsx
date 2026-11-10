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
    <article className="film">
      <a className="backlink" href="#/">
        <span aria-hidden="true">← </span>Volver a la cartelera
      </a>

      <div className="film__banner">
        <SafeImage src={imageUrl(film, 'banner')} alt="" aria-hidden="true" />
      </div>

      <header className="film__head">
        <div className="film__poster">
          <SafeImage
            src={imageUrl(film, 'poster')}
            alt={`Poster de ${film.name}`}
            width="300"
            height="450"
          />
        </div>

        <div className="film__info">
          <p className="kicker">{film.genres.join(' · ')}</p>
          <h1 className="film__title">{film.name}</h1>

          <dl className="film__facts">
            <div>
              <dt>Año</dt>
              <dd>{film.year}</dd>
            </div>
            <div>
              <dt>Duración</dt>
              <dd>{film.duration}</dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd>
                <span className="film__score">
                  <span aria-hidden="true">★ </span>
                  {formatScore(film.score)}
                  <span className="sr-only"> de 10</span>
                </span>
                <ScoreMeter score={film.score} />
              </dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{film.directors.join(', ')}</dd>
            </div>
            <div>
              <dt>Géneros</dt>
              <dd>{film.genres.join(', ')}</dd>
            </div>
          </dl>

          <p className="film__synopsis">{film.synopsis}</p>

          {session && (
            <div className="film__actions">
              <a className="button button--ghost" href={`#/film/${film.id}/editar`}>
                Editar película
              </a>
              <motion.button
                className="button button--ghost"
                type="button"
                onClick={handleDelete}
                onBlur={() => setConfirmingDelete(false)}
                {...pressMotion(reduced)}
              >
                {confirmingDelete ? 'Confirmar: borrar película' : 'Borrar película'}
              </motion.button>
              <p className="film__actions-status" role="alert">
                {deleteError}
              </p>
            </div>
          )}
        </div>
      </header>

      <section className="comments" aria-labelledby="comments-title">
        <div className="comments__head">
          <h2 id="comments-title">Comentarios</h2>
          <p className="comments__count">
            {comments.length === 1 ? '1 comentario' : `${comments.length} comentarios`}
          </p>
        </div>

        {session ? (
          <CommentForm filmId={film.id} author={session.user} onSaved={setStore} />
        ) : (
          <div className="login-prompt">
            <p>Sólo quien inició sesión puede dejar una reseña.</p>
            <a className="button" href={`#/login?next=/film/${film.id}`}>
              Iniciar sesión para comentar
            </a>
          </div>
        )}

        {comments.length === 0 && (
          <p className="comments__empty">Todavía no hay comentarios.</p>
        )}

        {/* La lista queda montada desde el arranque: así el primer comentario
            también entra con spring en vez de aparecer sin animación. */}
        <ol className="comments__list">
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.li
                className="comment"
                key={comment.id}
                layout="position"
                {...commentItemMotion(reduced)}
              >
                <div className="comment__meta">
                  <span className="comment__author">{comment.author}</span>
                  <time className="comment__date" dateTime={comment.date}>
                    {formatDate(comment.date)}
                  </time>
                  {comment.id.startsWith('local-') && (
                    <span className="comment__tag">guardado acá</span>
                  )}
                </div>
                <p className="comment__text">{comment.text}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </section>
    </article>
  )
}
