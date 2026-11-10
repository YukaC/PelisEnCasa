import { motion, useReducedMotion } from 'motion/react'
import SafeImage from './SafeImage.jsx'
import { imageUrl } from '../lib/image.js'
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
      className="group flex h-full flex-col gap-3 no-underline"
      href={`#/film/${film.id}`}
      {...cardMotion({ reduced, finePointer })}
    >
      <div className="relative">
        <motion.span className="pointer-events-none absolute inset-x-[5%] top-[8%] -bottom-[4%] rounded-xl opacity-0 shadow-card" variants={CARD_LIFT_VARIANTS} aria-hidden="true" />

        <div className="relative aspect-2/3 overflow-hidden rounded-md bg-raised shadow-poster">
          <motion.div className="size-full" variants={POSTER_VARIANTS}>
            <SafeImage
              className="size-full object-cover"
              src={imageUrl(film, 'poster')}
              alt={`Poster de ${film.name}`}
              width="300"
              height="450"
              loading="lazy"
            />
          </motion.div>
        </div>

        <span className="absolute top-2 right-2 rounded-md bg-black/90 px-[0.4rem] py-[0.1rem] text-step-n1 font-semibold text-accent tabular-nums">
          <span aria-hidden="true">★ </span>
          {formatScore(film.score)}
          <span className="sr-only"> de 10</span>
        </span>
      </div>

      <div className="flex flex-col gap-[0.15rem]">
        <h3 className="text-step-1 font-semibold decoration-accent decoration-1 underline-offset-[0.2em] group-hover:underline group-focus-visible:underline">{film.name}</h3>
        <p className="text-step-n1 text-fg-dim tabular-nums">
          {film.year} · {film.duration}
        </p>
        <p className="text-step-n1 text-fg-mute">{film.genres.join(' · ')}</p>
        <p className="text-step-n1 text-fg-mute">{film.directors.join(', ')}</p>
      </div>
    </motion.a>
  )
}
