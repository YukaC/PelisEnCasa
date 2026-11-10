import { useEffect } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import { pageMotion } from './lib/motion.js'
import { useHashRoute } from './lib/route.js'
import SiteHeader from './components/SiteHeader.jsx'
import CatalogPage from './components/CatalogPage.jsx'
import FilmPage from './components/FilmPage.jsx'
import NotFoundPage from './components/NotFoundPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import FilmFormPage from './components/FilmFormPage.jsx'

/**
 * Marco de la vista actual: entra y sale con spring. Mientras está saliendo no
 * recibe clicks, así la transición nunca bloquea la interacción.
 */
function RouteFrame({ children, ...motionProps }) {
  const isPresent = useIsPresent()

  return (
    <motion.div
      style={{ pointerEvents: isPresent ? undefined : 'none' }}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const route = useHashRoute()
  const reduced = useReducedMotion()
  const routeKey = route.filmId ? `${route.name}-${route.filmId}` : route.name
  const loginHref = route.name === 'film' ? `#/login?next=/film/${route.filmId}` : '#/login'

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [routeKey])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        className="absolute top-2 left-2 z-50 -translate-y-[200%] rounded-md bg-accent-solid px-4 py-2 font-semibold text-on-accent no-underline focus:translate-y-0"
        href="#contenido"
      >
        Saltar al contenido
      </a>

      <SiteHeader loginHref={loginHref} />

      <main
        id="contenido"
        className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-18 outline-none sm:px-8"
        tabIndex={-1}
      >
        <AnimatePresence mode="wait" initial={false}>
          <RouteFrame key={routeKey} {...pageMotion(reduced)}>
            {route.name === 'catalog' && <CatalogPage />}
            {route.name === 'film' && <FilmPage filmId={route.filmId} />}
            {route.name === 'login' && <LoginPage next={route.next} />}
            {route.name === 'film-new' && <FilmFormPage />}
            {route.name === 'film-edit' && <FilmFormPage filmId={route.filmId} />}
            {route.name === 'not-found' && (
              <NotFoundPage message="Esa dirección no existe en el sitio." />
            )}
          </RouteFrame>
        </AnimatePresence>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-page items-center gap-3 px-4 py-6">
          <img className="h-auto w-9 flex-none opacity-75" src="/logo.png" alt="" width="100" height="100" />
          <p className="text-step-n1 text-fg-mute sm:px-8">
            Pelis en Casa · reseñas de cine. Demo estática del TP de 2022 (Flask con un JSON),
            reescrita con React y Vite: sin backend ni base de datos, con login simulado.
          </p>
          <nav className="ml-auto flex flex-wrap items-center gap-4 text-step-n1" aria-label="Enlaces del pie">
            <a
              className="border-b border-line-strong text-fg-dim no-underline hover:border-accent hover:text-fg"
              href="#/"
            >
              Películas
            </a>
            <a
              className="border-b border-line-strong text-fg-dim no-underline hover:border-accent hover:text-fg"
              href={loginHref}
            >
              Ingresar
            </a>
            <span className="text-fg-mute">Código bajo licencia MIT</span>
          </nav>
        </div>
      </footer>
    </div>
  )
}
