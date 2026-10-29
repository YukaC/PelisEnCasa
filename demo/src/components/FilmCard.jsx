import { motion, useReducedMotion } from 'motion/react'
import SafeImage from './SafeImage.jsx'
import { posterUrl } from '../data/catalog.js'
import { formatScore } from '../lib/format.js'
import {
  CARD_LIFT_VARIANTS,
  POSTER_VARIANTS,
  cardMotion,
  useFinePointer,
} from '../lib/motion.js'

export default function FilmCard({ film }) {
  const reduced = useReducedMotion()
  const finePointer = useFinePointer()

  return (
    <motion.a
      className="film-card"
      href={`#/film/${film.id}`}
      {...cardMotion({ reduced, finePointer })}
    >
      <div className="film-card__media">
        <motion.span className="film-card__lift" variants={CARD_LIFT_VARIANTS} aria-hidden="true" />

        <div className="film-card__poster">
          <motion.div className="film-card__poster-inner" variants={POSTER_VARIANTS}>
            <SafeImage
              src={posterUrl(film.id)}
              alt={`Poster de ${film.name}`}
              width="300"
              height="450"
              loading="lazy"
            />
          </motion.div>
        </div>

        <span className="film-card__score">
          <span aria-hidden="true">★ </span>
          {formatScore(film.score)}
          <span className="sr-only"> de 10</span>
        </span>
      </div>

      <div className="film-card__body">
        <h3 className="film-card__title">{film.name}</h3>
        <p className="film-card__meta">
          {film.year} · {film.duration}
        </p>
        <p className="film-card__genres">{film.genres.join(' · ')}</p>
        <p className="film-card__director">{film.directors.join(', ')}</p>
      </div>
    </motion.a>
  )
}
