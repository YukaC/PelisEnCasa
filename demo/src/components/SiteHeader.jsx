import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { getStorage } from '../lib/comments.js'
import { SPRINGS, scrollLift } from '../lib/motion.js'
import { signOut } from '../lib/session.js'
import { useSession } from '../lib/useSession.js'

/**
 * Marquesina. El fondo y la elevación siguen al scroll con `useScroll` + `useSpring`:
 * el valor llega amortiguado en vez de pegado al dedo.
 */
export default function SiteHeader({ loginHref = '#/login' }) {
  const reduced = useReducedMotion()
  const session = useSession()
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
        <a className="brand" href="#/" aria-label="Pelis en Casa, ir a la cartelera">
          <img className="brand__logo" src="/logo.png" alt="" width="100" height="100" />
          <span className="brand__tag">Cartelera de barrio</span>
        </a>

        <nav className="marquee__nav" aria-label="Navegación principal">
          <a href="#/">Cartelera</a>
          <span className="marquee__badge">demo</span>
          {!session && (
            <a className="marquee__cta" href={loginHref}>
              Iniciar sesión
            </a>
          )}
          {session && (
            <>
              <a href="#/subir">Subir película</a>
              <span className="marquee__user">{session.user}</span>
              <button className="marquee__signout" type="button" onClick={() => signOut(getStorage())}>
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
