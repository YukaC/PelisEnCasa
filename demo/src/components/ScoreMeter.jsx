import { useEffect } from 'react'
import { motion, useReducedMotion, useSpring } from 'motion/react'
import { SPRINGS, progressFromScore } from '../lib/motion.js'

/**
 * Barra de score que se llena al montar. El progreso es un spring sobreamortiguado
 * sobre `scaleX`: transform puro, sin tocar el ancho ni el layout.
 * El número visible vive afuera (en la ficha), esto es decoración: `aria-hidden`.
 */
export default function ScoreMeter({ score, max = 10 }) {
  const reduced = useReducedMotion()
  const target = progressFromScore(score, max)
  const progress = useSpring(reduced ? target : 0, SPRINGS.score)

  useEffect(() => {
    if (reduced) {
      progress.jump(target)
      return
    }
    progress.set(target)
  }, [progress, reduced, target])

  return (
    <span
      className="mt-2 block h-[0.3rem] w-full max-w-40 overflow-hidden rounded-full bg-line"
      aria-hidden="true"
    >
      <motion.span
        className="block size-full origin-left rounded-[inherit] bg-linear-to-r/srgb from-accent-deep to-accent"
        style={{ scaleX: progress }}
      />
    </span>
  )
}
