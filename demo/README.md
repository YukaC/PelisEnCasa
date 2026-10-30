# Pelis en Casa — demo estática

**Demo en vivo: <https://peliscasa.vercel.app>**

Catálogo y fichas de un sitio de reseñas de películas, rehecho como demo para mostrar en una
entrevista. Es la versión estática del TP 2022 (páginas HTML + jQuery contra una API Flask): acá no
hay backend, no hay base de datos y no hay login.

- **React 19 + Vite 7**, JavaScript plano (`.jsx`). Sin TypeScript, sin router, sin Tailwind.
- **`motion`** (v14, import `motion/react`) para los springs de interacción y de scroll. Es la única
dependencia de animación.
- **Datos embebidos**: `flask/db.json` del TP, copiado a `src/data/db.json`. Las imágenes salen de
  `flask/static/` y viven en `public/films/`.
- **Comentarios**: se guardan en `localStorage` del navegador, con el prefijo `pelis-demo:`.
  La semilla son los 3 comentarios del TP.

## Qué está simulado

| Pieza del TP original | En esta demo |
| --- | --- |
| API Flask (`/peliculas`, `/generos`, `/directores`, `/peliculas/<id>/comentarios`) | JSON embebido, resuelto en `src/data/catalog.js` |
| Alta de películas, edición y borrado (`add-film`, `edit-film`, `DELETE`) | **no existe** |
| Login con usuario y contraseña | **no existe** (la tabla `usuarios` del TP no se copió: credenciales en claro y sin uso) |
| Comentarios en memoria del servidor | `localStorage`, por navegador; se pierden si se limpia el sitio |

Nada de sinopsis, scores, películas ni comentarios fue inventado: todo sale de `flask/db.json`.

## Cómo correrlo

```bash
cd demo
npm install
npm run dev      # http://localhost:5173
```

Build y preview del artefacto final:

```bash
npm run build
npm run preview  # http://localhost:4173
```

Tests de las funciones puras (búsqueda, filtros, orden, ruteo, comentarios, fechas) con el runner
nativo de Node:

```bash
npm test
```

## Rutas

- `#/` — catálogo: grilla, buscador (nombre/director/sinopsis), filtros de género y director, orden
  por score / año / A–Z.
- `#/film/:id` — ficha: banner, poster, sinopsis, datos, comentarios semilla y formulario.

El ruteo por hash vive en un solo módulo (`src/lib/route.js`) y se resuelve con `hashchange`.

## Deploy en Vercel

Es un sitio 100% estático: no necesita variables de entorno ni funciones serverless.

1. Importar el repo en Vercel.
2. **Root Directory**: `demo`.
3. **Framework Preset**: `Vite`.
4. Build Command: `npm run build` · Output Directory: `dist` (son los defaults de Vite).

Las rutas son por hash, así que no hace falta reescribir URLs ni `vercel.json`.

## Estructura

```
demo/
├── index.html
├── public/films/           # posters, banners y fallback copiados de flask/static
└── src/
    ├── main.jsx
    ├── App.jsx             # resuelve la ruta y arma la página
    ├── components/         # SiteHeader, CatalogPage, FilmCard, FilmPage, CommentForm, ...
    ├── data/
    │   ├── db.json         # datos del TP (sin la tabla usuarios)
    │   └── catalog.js      # resuelve ids de género/director y expone la API de datos
    ├── lib/
    │   ├── route.js        # parseHash + useHashRoute (hashchange)
    │   ├── search.js       # normalización, búsqueda, filtros y orden (puro)
    │   ├── comments.js     # validación y persistencia en localStorage (puro + storage)
    │   ├── motion.js       # presets de spring, variants y helpers de movimiento (puro)
    │   └── format.js       # score y fecha legible en es-AR
    └── styles/demo.css     # tokens en :root, mobile-first, un solo acento rojo
```

## Marca

La paleta y el logo son los del sitio original del TP, no una reinterpretación: negro puro
(`#000`), acento rojo (`#ff2d2d`, el `hsla(0, 100%, 50%, .8)` original solidificado para que
las etiquetas en mayúscula sigan pasando AA), tipografía en `hsl(0, 0%, 88%)` y grises neutros.
El cintillo rojo del logo vive en `public/logo.png` (cabecera y pie) y `public/logo2.png`
(favicon); como el logo ya dice "Pelis en Casa", la cabecera lo usa como marca y sólo le suma
el bajada "Cartelera de barrio".

La tipografía sí es del rediseño: el serif de sistema en los títulos se queda, porque lo que
se restauró fue el color y la marca, no la fuente.

## Accesibilidad

Mobile-first, contraste AA sobre negro, foco visible por teclado, skip link, `alt` real en
posters, `aria-live` en el conteo/estado vacío del catálogo y en el alta de comentarios, y errores de
formulario asociados con `aria-describedby`.

## Movimiento

Todas las animaciones viven en un solo módulo, `src/lib/motion.js`: presets de spring, variants y
helpers puros (testeados con `node --test`). Los componentes sólo los consumen.

| Interacción | Cómo | Spring |
| --- | --- | --- |
| Entrada de la grilla | `motion.li` con delay por índice + `layout="position"` | `stiffness 260 · damping 30 · mass 0.9` |
| Reacomodo al filtrar / ordenar | `layout` + `AnimatePresence mode="popLayout"` | el mismo del ítem |
| Hover de tarjeta (sólo `pointer: fine`) | elevación `y: -6` y poster `scale 1.045` | `stiffness 320 · damping 30` |
| Tap | `scale 0.985` | `stiffness 520 · damping 34` (más rígido) |
| Catálogo ↔ ficha | `AnimatePresence mode="wait"` (salida 380/34, entrada 280/32) | `stiffness 280 · damping 32` |
| Barra de score | `useSpring` sobre `scaleX` del progreso | `stiffness 140 · damping 26` (sobreamortiguado: no pasa de 100%) |
| Comentario nuevo | entrada por `opacity` + `y`, la altura la resuelve `layout` | `stiffness 240 · damping 30` |
| Error de validación | shake corto de springs (no es un loop) | `stiffness 420 · damping 18` |
| Header al scrollear | `useScroll` + `useSpring` sobre la opacidad de las capas de fondo/sombra | `stiffness 120 · damping 24` |

Se animan `transform`/`opacity` (y `layout` cuando hace falta): no se animan `filter`, `box-shadow`,
`width` ni `height`. La elevación usa una capa aparte cuya opacidad se mueve.

Con `prefers-reduced-motion: reduce` (`useReducedMotion`) nada se mueve: las tarjetas, la ficha, el
score y los comentarios aparecen en su estado final desde el primer frame, y el header no cambia.

## Lo que quedó afuera (a propósito)

Login, ABM de películas (alta/edición/borrado), roles de usuario, imágenes subidas por el usuario y
cualquier llamada de red. La demo muestra el catálogo y la conversación alrededor de una película,
que es lo que se puede defender en una entrevista.
