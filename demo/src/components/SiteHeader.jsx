import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { getStorage } from '../lib/comments.js'
import { SPRINGS, scrollLift } from '../lib/motion.js'
import { useHashRoute } from '../lib/route.js'
import { signOut } from '../lib/session.js'
import { useSession } from '../lib/useSession.js'
import ThemeSwitch from './ThemeSwitch.jsx'

/** Enlace de la barra: pastilla que se enciende con el hover y con la ruta activa. */
function navLink(active) {
  return `inline-flex flex-none items-center rounded-full px-2.5 py-2 text-step-n1 font-semibold tracking-[0.02em] no-underline transition-colors ${
    active ? 'bg-raised text-fg' : 'text-fg-dim hover:bg-raised hover:text-fg'
  }`
}

/**
 * Marquesina. Una píldora esmerilada flota sobre la página; la sombra sigue al scroll
 * con `useScroll` + `useSpring`, así el valor llega amortiguado y no pegado al dedo.
 * En pantallas angostas la barra se parte en dos filas en vez de esconder enlaces.
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
    <header className="sticky top-0 z-40 px-3 pt-3 pb-2">
      <nav
        className="relative mx-auto flex w-full max-w-page flex-wrap items-center gap-x-0.5 gap-y-2 rounded-[1.75rem] border border-line bg-surface/85 px-3 py-2 shadow-lift backdrop-blur-md sm:h-16 sm:flex-nowrap sm:rounded-full sm:px-4 sm:py-0"
        aria-label="Navegación principal"
      >
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-lift"
          style={{ opacity: lift }}
          aria-hidden="true"
        />
        <span
          className="marquee-lights pointer-events-none absolute inset-x-10 bottom-0 h-1.5"
          aria-hidden="true"
        />

        <a
          className="relative flex flex-none items-center gap-2.5 no-underline"
          href="#/"
          aria-label="Pelis en Casa, ir a las películas"
        >
          {/* El cintillo rojo del TP original: es el logo y ya dice el nombre. */}
          <img className="h-9 w-auto sm:h-10" src="/logo.png" alt="" width="100" height="100" />
          <span className="hidden text-label tracking-[0.18em] text-fg-mute uppercase lg:inline">
            Reseñas de cine
          </span>
        </a>

        <div className="relative ml-auto flex flex-wrap items-center justify-end gap-0.5 sm:flex-nowrap sm:gap-1.5">
          <a className={navLink(onFilms)} href="#/" aria-current={onFilms ? 'page' : undefined}>
            Películas
          </a>

          {session && (
            <a className={navLink(onUpload)} href="#/subir" aria-current={onUpload ? 'page' : undefined}>
              Subir<span className="hidden sm:inline"> película</span>
            </a>
          )}

          <span className="hidden rounded-full border border-line px-2 py-0.5 text-label tracking-[0.12em] text-fg-mute uppercase lg:inline-flex">
            demo
          </span>

          {!session ? (
            <a
              className="ml-0.5 inline-flex flex-none items-center rounded-full bg-accent-solid px-3 py-2 text-step-n1 font-semibold tracking-[0.02em] text-on-accent no-underline transition-colors hover:bg-accent-hover"
              href={loginHref}
            >
              Iniciar sesión
            </a>
          ) : (
            <>
              <span
                className="ml-0.5 flex flex-none items-center gap-2 rounded-full border border-line py-0.5 pr-1 pl-0.5"
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
                className="cursor-pointer rounded-full px-2 py-2 text-step-n1 font-semibold text-fg-mute transition-colors hover:bg-raised hover:text-fg"
                type="button"
                aria-label="Cerrar sesión"
                onClick={() => signOut(getStorage())}
              >
                Salir
              </button>
            </>
          )}

          <span className="flex flex-none items-center border-l border-line pl-1.5">
            <ThemeSwitch />
          </span>
        </div>
      </nav>
    </header>
  )
}
