import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { getStorage } from '../lib/comments.js'
import { SPRINGS, scrollLift } from '../lib/motion.js'
import { signOut } from '../lib/session.js'
import { useSession } from '../lib/useSession.js'
import ThemeSwitch from './ThemeSwitch.jsx'

const NAV_LINK =
  'border-b border-transparent font-semibold tracking-[0.04em] no-underline hover:border-accent'

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
    <header className="marquee-lights sticky top-0 z-30 border-b border-line bg-surface">
      <motion.span
        className="pointer-events-none absolute inset-0 bg-bg"
        style={{ opacity: scrim }}
        aria-hidden="true"
      />
      <motion.span
        className="pointer-events-none absolute inset-0 shadow-lift"
        style={{ opacity: lift }}
        aria-hidden="true"
      />

      <div className="relative z-1 mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-3 px-4 pt-6 pb-4 sm:px-8">
        <a
          className="inline-flex items-center gap-3 no-underline"
          href="#/"
          aria-label="Pelis en Casa, ir a las películas"
        >
          {/* El cintillo rojo del TP original: es el logo, así que no lo repite el texto. */}
          <img className="h-auto w-16 flex-none" src="/logo.png" alt="" width="100" height="100" />
          <span className="text-label tracking-[0.18em] text-fg-mute uppercase">Pelis en Casa</span>
        </a>

        <nav className="flex flex-wrap items-center gap-3 text-step-n1" aria-label="Navegación principal">
          <a className={NAV_LINK} href="#/">
            Películas
          </a>
          <span className="rounded-full border border-line-strong px-2 py-[0.15rem] text-label tracking-[0.12em] text-fg-mute uppercase">
            demo
          </span>
          {!session && (
            <a
              className="rounded-md border border-accent px-[0.8rem] py-[0.35rem] font-semibold tracking-[0.04em] no-underline hover:border-accent-solid hover:bg-accent-solid hover:text-on-accent"
              href={loginHref}
            >
              Iniciar sesión
            </a>
          )}
          {session && (
            <>
              <a className={NAV_LINK} href="#/subir">
                Subir película
              </a>
              <span className="font-semibold text-fg-dim">{session.user}</span>
              <button
                className={`${NAV_LINK} cursor-pointer`}
                type="button"
                onClick={() => signOut(getStorage())}
              >
                Cerrar sesión
              </button>
            </>
          )}
          <ThemeSwitch />
        </nav>
      </div>
    </header>
  )
}
