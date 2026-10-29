import { useEffect } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'
import { pageMotion } from './lib/motion.js'
import { useHashRoute } from './lib/route.js'
import SiteHeader from './components/SiteHeader.jsx'
import CatalogPage from './components/CatalogPage.jsx'
import FilmPage from './components/FilmPage.jsx'
import NotFoundPage from './components/NotFoundPage.jsx'

/**
 * Marco de la vista actual: entra y sale con spring. Mientras está saliendo no
 * recibe clicks, así la transición nunca bloquea la interacción.
 */
function RouteFrame({ children, ...motionProps }) {
  const isPresent = useIsPresent()

  return (
    <motion.div
      className="route"
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
  const routeKey = route.name === 'film' ? `film-${route.filmId}` : route.name

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [routeKey])

  return (
    <div className="app">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <SiteHeader />

      <main id="contenido" className="page" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false}>
          <RouteFrame key={routeKey} {...pageMotion(reduced)}>
            {route.name === 'catalog' && <CatalogPage />}
            {route.name === 'film' && <FilmPage filmId={route.filmId} />}
            {route.name === 'not-found' && (
              <NotFoundPage message="Esa dirección no existe en la cartelera." />
            )}
          </RouteFrame>
        </AnimatePresence>
      </main>

      <footer className="footer">
        <p>
          Pelis en Casa · demo estática de un TP de 2022, reescrita con React y Vite. Sin backend, sin
          login, sin base de datos.
        </p>
      </footer>
    </div>
  )
}
