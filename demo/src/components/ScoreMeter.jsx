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
    <span className="score-meter" aria-hidden="true">
      <motion.span className="score-meter__fill" style={{ scaleX: progress }} />
    </span>
  )
}
