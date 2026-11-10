import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { getStorage } from '../lib/comments.js'
import { SPRINGS, scrollLift } from '../lib/motion.js'
import { useHashRoute } from '../lib/route.js'
import { signOut } from '../lib/session.js'
import { useSession } from '../lib/useSession.js'
import { useTheme } from '../lib/useTheme.js'
import ThemeSwitch from './ThemeSwitch.jsx'

/** Enlace de la barra: pastilla que se enciende con el hover y con la ruta activa. */
function navLink(active) {
  return `rounded-full px-3 py-2 text-step-n1 font-semibold tracking-[0.02em] no-underline transition-colors ${
    active ? 'bg-raised text-fg' : 'text-fg-dim hover:bg-raised hover:text-fg'
  }`
}

/** Fila de un enlace dentro de una tarjeta del menú. */
const CARD_LINK =
  'flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-step-n1 font-semibold no-underline transition-colors'

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none opacity-60"
      aria-hidden="true"
    >
      <path d="m6 3 5 5-5 5" />
    </svg>
  )
}

function MenuIcon({ open }) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {open ? <path d="m5 5 10 10M15 5 5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
    </svg>
  )
}

/**
 * Marquesina. La barra flota sobre una píldora esmerilada y la sombra sigue al scroll
 * con `useScroll` + `useSpring`: el valor llega amortiguado y no pegado al dedo.
 * El botón de la derecha despliega una fila de tarjetas, una por grupo de enlaces.
 */
export default function SiteHeader({ loginHref = '#/login' }) {
  const reduced = useReducedMotion()
  const session = useSession()
  const route = useHashRoute()
  const { theme, chooseTheme } = useTheme()
  const { scrollY } = useScroll()
  const damped = useSpring(scrollY, SPRINGS.scroll)
  const source = reduced ? scrollY : damped
  const lift = useTransform(source, (value) => (reduced ? 0 : scrollLift(value - 24, 120)))

  const [open, setOpen] = useState(false)
  const panelId = useId()
  const toggleRef = useRef(null)

  const onFilms = route.name === 'catalog' || route.name === 'film'
  const dark = theme === 'dark'
  const initial = session?.user.trim().charAt(0).toUpperCase() ?? ''

  // Al cambiar de página el menú se cierra solo; Escape también, y devuelve el foco.
  useEffect(() => setOpen(false), [route.name, route.filmId])

  function closeAndRefocus() {
    setOpen(false)
    toggleRef.current?.focus()
  }

  const cards = [
    {
      id: 'cuenta',
      title: 'Tu cuenta',
      note: session
        ? `Sesión de ${session.user}, guardada en este navegador.`
        : 'Demo sin backend: entrás con Ana / 123 o Bruno / 456.',
      className: 'border-transparent bg-accent-solid text-on-accent',
      noteClass: 'text-on-accent',
      links: session
        ? [{ label: 'Cerrar sesión', action: () => signOut(getStorage()) }]
        : [{ label: 'Iniciar sesión', href: loginHref }],
    },
    {
      id: 'catalogo',
      title: 'Películas',
      note: 'Reseñas con puntaje, sinopsis y la palabra de quien la vio.',
      className: 'border-line bg-raised text-fg',
      noteClass: 'text-fg-dim',
      links: session
        ? [
            { label: 'Todas las reseñas', href: '#/' },
            { label: 'Subir una película', href: '#/subir' },
          ]
        : [{ label: 'Todas las reseñas', href: '#/' }],
    },
    {
      id: 'apariencia',
      title: 'Apariencia',
      note: dark ? 'Marquesina nocturna, como la sala a oscuras.' : 'Papel cálido, como el programa de mano.',
      className: 'border-line bg-surface text-fg',
      noteClass: 'text-fg-dim',
      links: [
        { label: 'Tema oscuro', active: dark, action: () => chooseTheme('dark') },
        { label: 'Tema claro', active: !dark, action: () => chooseTheme('light') },
      ],
    },
  ]

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 pb-2">
      <div className="mx-auto w-full max-w-page">
        <nav
          className="relative flex h-16 items-center gap-2 rounded-full border border-line bg-surface/85 pr-2 pl-3 shadow-lift backdrop-blur-md sm:gap-3 sm:pl-4"
          aria-label="Navegación principal"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && open) closeAndRefocus()
          }}
        >
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full shadow-lift"
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
            <img className="h-9 w-auto" src="/logo.png" alt="" width="100" height="100" />
            <span className="hidden text-label tracking-[0.18em] text-fg-mute uppercase md:inline">
              Reseñas de cine
            </span>
          </a>

          <div className="relative ml-auto flex items-center gap-1 sm:gap-1.5">
            <a
              className={`${navLink(onFilms)} hidden sm:inline-flex`}
              href="#/"
              aria-current={onFilms ? 'page' : undefined}
            >
              Películas
            </a>

            {session && (
              <span
                className="ml-1 hidden flex-none items-center gap-2 rounded-full border border-line py-0.5 pr-2.5 pl-0.5 sm:flex"
                title={session.user}
              >
                <span
                  className="grid size-6 place-items-center rounded-full bg-raised text-label font-semibold text-fg uppercase"
                  aria-hidden="true"
                >
                  {initial}
                </span>
                <span className="text-step-n1 font-semibold text-fg-dim">{session.user}</span>
              </span>
            )}

            <span className="hidden items-center border-l border-line pl-2 sm:flex">
              <ThemeSwitch />
            </span>

            <button
              ref={toggleRef}
              className="grid size-10 flex-none cursor-pointer place-items-center rounded-full border border-line-strong text-fg transition-colors hover:border-accent hover:text-accent-text"
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setOpen((current) => !current)}
            >
              <MenuIcon open={open} />
            </button>
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              key="panel"
              className="origin-top"
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -8, scale: 0.98, transition: SPRINGS.exit }}
              transition={reduced ? { duration: 0 } : SPRINGS.panel}
            >
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={`flex flex-col gap-2 rounded-2xl border p-4 shadow-lift ${card.className}`}
                  >
                    <p className="text-label tracking-[0.16em] uppercase">{card.title}</p>
                    <ul className="flex flex-col gap-0.5">
                      {card.links.map((link) =>
                        link.href ? (
                          <li key={link.label}>
                            <a
                              className={`${CARD_LINK} hover:bg-black/10`}
                              href={link.href}
                              onClick={() => setOpen(false)}
                            >
                              {link.label}
                              <ChevronIcon />
                            </a>
                          </li>
                        ) : (
                          <li key={link.label}>
                            <button
                              className={`${CARD_LINK} w-full cursor-pointer text-left hover:bg-black/10`}
                              type="button"
                              aria-pressed={link.active}
                              onClick={() => {
                                link.action()
                                setOpen(false)
                              }}
                            >
                              {link.label}
                              {link.active ? <span aria-hidden="true">●</span> : <ChevronIcon />}
                            </button>
                          </li>
                        ),
                      )}
                    </ul>
                    <p className={`mt-auto text-step-n1 ${card.noteClass}`}>{card.note}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
