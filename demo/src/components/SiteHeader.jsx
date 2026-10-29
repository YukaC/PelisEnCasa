import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { SPRINGS, scrollLift } from '../lib/motion.js'

/**
 * Marquesina. El fondo y la elevación siguen al scroll con `useScroll` + `useSpring`:
 * el valor llega amortiguado en vez de pegado al dedo.
 */
export default function SiteHeader() {
  const reduced = useReducedMotion()
  const { scrollY } = useScroll()
  const damped = useSpring(scrollY, SPRINGS.scroll)
  const source = reduced ? scrollY : damped

  const scrim = useTransform(source, (value) => (reduced ? 0 : scrollLift(value)))
  const lift = useTransform(source, (value) => (reduced ? 0 : scrollLift(value - 24, 120)))

  return (
    <header className="marquee">
      <motion.span className="marquee__scrim" style={{ opacity: scrim }} aria-hidden="true" />
      <motion.span className="marquee__lift" style={{ opacity: lift }} aria-hidden="true" />

      <div className="marquee__inner">
        <a className="brand" href="#/">
          <span className="brand__name">Pelis en Casa</span>
          <span className="brand__tag">Cartelera de barrio</span>
        </a>

        <nav className="marquee__nav" aria-label="Navegación principal">
          <a href="#/">Cartelera</a>
          <span className="marquee__badge">demo</span>
        </nav>
      </div>
    </header>
  )
}
