import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { getStorage } from '../lib/comments.js'
import { SPRINGS, scrollLift } from '../lib/motion.js'
import { useHashRoute } from '../lib/route.js'
import { signOut } from '../lib/session.js'
import { useSession } from '../lib/useSession.js'
import ThemeSwitch from './ThemeSwitch.jsx'

/** Enlace de la barra: pastilla que se enciende con el hover y con la ruta activa. */
function navLink(active) {
  return `rounded-full px-3 py-2 text-step-n1 font-semibold tracking-[0.02em] no-underline transition-colors ${
    active ? 'bg-raised text-fg' : 'text-fg-dim hover:bg-raised hover:text-fg'
  }`
}

/** Acción de texto discreta, del mismo alto que los enlaces. */
const QUIET_ACTION =
  'cursor-pointer rounded-full px-2.5 py-2 text-step-n1 font-semibold text-fg-mute transition-colors hover:bg-raised hover:text-fg'

/**
 * Barra superior. Barra esmerilada que se eleva apenas al bajar: la sombra sigue al
 * scroll con `useScroll` + `useSpring`, así el valor llega amortiguado y no pegado al dedo.
 */
export default function SiteHeader({ loginHref = '#/login' }) {
  const reduced = useReducedMotion()
  const session = useSession()
  const route = useHashRoute()
  const { scrollY } = useScroll()
  const damped = useSpring(scrollY, SPRINGS.scroll)
  const source = reduced ? scrollY : damped

  const lift = useTransform(source, (value) => (reduced ? 0 : scrollLift(value - 24, 120)))

  const onFilms = route.name === 'catalog' || route.name === 'film'
  const onUpload = route.name === 'film-new'
  const initial = session?.user.trim().charAt(0).toUpperCase() ?? ''

  return (
    <header className="marquee-lights sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
      <motion.span
        className="pointer-events-none absolute inset-0 shadow-lift"
        style={{ opacity: lift }}
        aria-hidden="true"
      />

      <div className="relative z-1 mx-auto flex h-16 w-full max-w-page items-center gap-2 px-4 sm:gap-4 sm:px-8">
        <a
          className="flex flex-none items-center gap-2.5 no-underline sm:gap-3"
          href="#/"
          aria-label="Pelis en Casa, ir a las películas"
        >
          {/* El cintillo rojo del TP original: es el logo y ya dice el nombre. */}
          <img className="h-9 w-auto sm:h-10" src="/logo.png" alt="" width="100" height="100" />
          <span className="hidden text-label tracking-[0.18em] text-fg-mute uppercase md:inline">
            Reseñas de cine
          </span>
        </a>

        <nav className="ml-auto flex min-w-0 items-center gap-1 sm:gap-1.5" aria-label="Navegación principal">
          <a className={navLink(onFilms)} href="#/" aria-current={onFilms ? 'page' : undefined}>
            Películas
          </a>

          {session && (
            <a className={navLink(onUpload)} href="#/subir" aria-current={onUpload ? 'page' : undefined}>
              Subir<span className="hidden sm:inline"> película</span>
            </a>
          )}

          <span className="ml-1 hidden rounded-full border border-line px-2 py-0.5 text-label tracking-[0.12em] text-fg-mute uppercase md:inline-flex">
            demo
          </span>

          {!session ? (
            <a
              className="ml-1 inline-flex flex-none items-center rounded-full bg-accent-solid px-3.5 py-2 text-step-n1 font-semibold tracking-[0.02em] text-on-accent no-underline transition-colors hover:bg-accent-hover"
              href={loginHref}
            >
              Iniciar sesión
            </a>
          ) : (
            <>
              <span
                className="ml-1 flex flex-none items-center gap-2 rounded-full border border-line py-0.5 pr-1 pl-0.5"
                title={session.user}
              >
                <span
                  className="grid size-6 place-items-center rounded-full bg-raised text-label font-semibold text-fg uppercase"
                  aria-hidden="true"
                >
                  {initial}
                </span>
                <span className="hidden text-step-n1 font-semibold text-fg-dim sm:inline">{session.user}</span>
              </span>
              <button
                className={QUIET_ACTION}
                type="button"
                aria-label="Cerrar sesión"
                onClick={() => signOut(getStorage())}
              >
                Salir
              </button>
            </>
          )}

          <span className="ml-1 flex flex-none items-center border-l border-line pl-2">
            <ThemeSwitch />
          </span>
        </nav>
      </div>
    </header>
  )
}
