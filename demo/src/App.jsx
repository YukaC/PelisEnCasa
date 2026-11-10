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
  const routeKey = route.filmId ? `${route.name}-${route.filmId}` : route.name
  const loginHref = route.name === 'film' ? `#/login?next=/film/${route.filmId}` : '#/login'

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [routeKey])

  return (
    <div className="app">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <SiteHeader loginHref={loginHref} />

      <main id="contenido" className="page" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false}>
          <RouteFrame key={routeKey} {...pageMotion(reduced)}>
            {route.name === 'catalog' && <CatalogPage />}
            {route.name === 'film' && <FilmPage filmId={route.filmId} />}
            {route.name === 'login' && <LoginPage next={route.next} />}
            {route.name === 'film-new' && <FilmFormPage />}
            {route.name === 'film-edit' && <FilmFormPage filmId={route.filmId} />}
            {route.name === 'not-found' && (
              <NotFoundPage message="Esa dirección no existe en la cartelera." />
            )}
          </RouteFrame>
        </AnimatePresence>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <img className="footer__logo" src="/logo.png" alt="" width="100" height="100" />
          <p>
            Pelis en Casa · demo estática del TP de 2022, que era Flask con un JSON. Reescrita con React y
            Vite, sin backend ni base de datos: el login es simulado.
          </p>
          <nav className="footer__nav" aria-label="Enlaces del pie">
            <a href="#/">Cartelera</a>
            <a href={loginHref}>Ingresar</a>
            <span className="footer__license">Código bajo licencia MIT</span>
          </nav>
        </div>
      </footer>
    </div>
  )
}
