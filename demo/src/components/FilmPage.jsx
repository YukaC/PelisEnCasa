import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import CommentForm from './CommentForm.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import SafeImage from './SafeImage.jsx'
import ScoreMeter from './ScoreMeter.jsx'
import { bannerUrl, getFilm, posterUrl, seedCommentsByFilm } from '../data/catalog.js'
import { commentsForFilm, readStoredComments, getStorage } from '../lib/comments.js'
import { commentItemMotion } from '../lib/motion.js'
import { formatDate, formatScore } from '../lib/format.js'

export default function FilmPage({ filmId }) {
  const film = getFilm(filmId)
  if (!film) return <NotFoundPage message="No hay ninguna película con ese id en la cartelera." />
  return <FilmDetail film={film} />
}

function FilmDetail({ film }) {
  const reduced = useReducedMotion()
  const [store, setStore] = useState(() => readStoredComments(getStorage()))

  const comments = useMemo(
    () => commentsForFilm(seedCommentsByFilm[film.id] ?? [], store[film.id] ?? []),
    [film.id, store],
  )

  return (
    <article className="film">
      <a className="backlink" href="#/">
        <span aria-hidden="true">← </span>Volver a la cartelera
      </a>

      <div className="film__banner">
        <SafeImage src={bannerUrl(film.id)} alt="" aria-hidden="true" />
      </div>

      <header className="film__head">
        <div className="film__poster">
          <SafeImage
            src={posterUrl(film.id)}
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
        </div>
      </header>

      <section className="comments" aria-labelledby="comments-title">
        <div className="comments__head">
          <h2 id="comments-title">Comentarios</h2>
          <p className="comments__count">
            {comments.length === 1 ? '1 comentario' : `${comments.length} comentarios`}
          </p>
        </div>

        <CommentForm filmId={film.id} onSaved={setStore} />

        {comments.length === 0 && (
          <p className="comments__empty">Todavía no hay comentarios. Dejá el primero.</p>
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
