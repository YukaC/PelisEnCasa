import { useSyncExternalStore } from 'react'

/**
 * Único módulo de movimiento de la demo. Acá viven los presets de spring y los
 * variants que consumen los componentes: nada de `ease`/`cubic-bezier` para las
 * interacciones, y todo apagado cuando el sistema pide menos movimiento.
 *
 * Es data + funciones puras (más un hook de media query) para poder testearelo
 * con `node --test` sin DOM.
 */

/* ----------------------------------------------------------------- springs --- */

/**
 * Springs con peso: stiffness y damping explícitos, `mass` sólo donde hace falta.
 * Ninguno usa `ease`/`cubic-bezier`: eso sería un CSS easing disfrazado.
 */
export const SPRINGS = {
  /** Entrada escalonada de la grilla: firme, sin rebote en el texto. */
  grid: { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 },
  /** Hover de tarjeta: levanta con un resto mínimo de inercia. */
  card: { type: 'spring', stiffness: 320, damping: 30, mass: 0.9 },
  /** Tap: más rígido y más corto, para que se sienta en el dedo. */
  tap: { type: 'spring', stiffness: 520, damping: 34, mass: 0.6 },
  /** Cambio de página (catálogo ↔ ficha). */
  panel: { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 },
  /** Salida de una vista: rápida y sin rebote. */
  exit: { type: 'spring', stiffness: 380, damping: 34, mass: 0.7 },
  /** Score: sobreamortiguado a propósito, el número no debe pasarse de 10. */
  score: { type: 'spring', stiffness: 140, damping: 26, mass: 1 },
  /** Header atado al scroll: sigue al dedo pero amortiguado. */
  scroll: { type: 'spring', stiffness: 120, damping: 24, mass: 0.8 },
  /** Comentario nuevo. */
  comment: { type: 'spring', stiffness: 240, damping: 30, mass: 0.9 },
  /** Shake de validación: corto, con algo de rebote. */
  shake: { type: 'spring', stiffness: 420, damping: 18, mass: 0.6 },
}

/** Píxeles de scroll en los que el header termina de asentarse. */
export const HEADER_SCROLL_DISTANCE = 72
/** Segundos entre tarjeta y tarjeta al entrar la grilla. */
export const STAGGER_STEP = 0.035
/** Tope de tarjetas escalonadas: de la 10 en adelante entran juntas. */
export const STAGGER_MAX_STEPS = 9
/** Desplazamiento inicial de una tarjeta que entra (px). */
export const GRID_ENTRY_OFFSET = 20
/** Pasos del shake de validación: arranca desplazado y vuelve a 0. */
export const SHAKE_STEPS = [-7, 7, -4, 0]

/* ----------------------------------------------------------------- helpers --- */

/**
 * @param {number} value
 * @param {number} [min]
 * @param {number} [max]
 * @returns {number}
 */
export function clamp(value, min = 0, max = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return min
  return Math.min(max, Math.max(min, number))
}

/**
 * Progreso 0..1 del score (`useSpring` lo anima desde 0 al montar).
 * @param {unknown} score
 * @param {number} [max]
 * @returns {number}
 */
export function progressFromScore(score, max = 10) {
  const limit = Number(max) > 0 ? Number(max) : 10
  const value = Number.parseFloat(String(score))
  if (!Number.isFinite(value)) return 0
  return Math.round(clamp(value / limit) * 10000) / 10000
}

/**
 * 0 en el tope de la página, 1 cuando el header ya se asentó.
 * @param {unknown} value
 * @param {number} [distance]
 * @returns {number}
 */
export function scrollLift(value, distance = HEADER_SCROLL_DISTANCE) {
  const span = Number(distance) > 0 ? Number(distance) : HEADER_SCROLL_DISTANCE
  const offset = Number(value)
  if (!Number.isFinite(offset) || offset <= 0) return 0
  return clamp(offset / span)
}

/**
 * Retardo escalonado por índice, con tope para que 11 tarjetas no tarden una eternidad.
 * @param {unknown} index
 * @returns {number} segundos
 */
export function staggerDelay(index) {
  const parsed = Number(index)
  const step = Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
  return Math.min(step, STAGGER_MAX_STEPS) * STAGGER_STEP
}

/* ---------------------------------------------------------------- variants --- */

/** Salida instantánea: la app se ve completa y quieta. */
const stillExit = { opacity: 0, transition: { duration: 0 } }

/**
 * Tarjeta de la grilla: `initial`/`animate`/`exit` + delay por índice.
 * Con `layout` en el mismo nodo, el reacomodo lo resuelve motion por transform.
 * @param {number} index
 * @param {boolean} reduced
 */
export function gridItemMotion(index, reduced) {
  if (reduced) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1, transition: { duration: 0 } },
      exit: stillExit,
    }
  }

  return {
    initial: { opacity: 0, y: GRID_ENTRY_OFFSET },
    animate: {
      opacity: 1,
      y: 0,
      transition: { ...SPRINGS.grid, delay: staggerDelay(index) },
    },
    // `mode="popLayout"` saca la tarjeta del flujo: `GridItem` le apaga los clicks.
    exit: {
      opacity: 0,
      y: -GRID_ENTRY_OFFSET / 2,
      transition: SPRINGS.exit,
    },
  }
}

/** Contenedor de la grilla / estado vacío. */
export function gridListMotion(reduced) {
  if (reduced) {
    return {
      initial: false,
      animate: { opacity: 1, transition: { duration: 0 } },
      exit: stillExit,
    }
  }

  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: SPRINGS.panel },
    exit: { opacity: 0, transition: SPRINGS.exit },
  }
}

/** Página completa: salida y entrada coordinadas por `AnimatePresence mode="wait"`. */
export function pageMotion(reduced) {
  if (reduced) {
    return {
      initial: false,
      animate: { opacity: 1, transition: { duration: 0 } },
      exit: stillExit,
    }
  }

  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: SPRINGS.panel },
    exit: { opacity: 0, y: -10, transition: SPRINGS.exit },
  }
}

/** Comentario que entra en la lista. La altura la resuelve `layout="position"`. */
export function commentItemMotion(reduced) {
  if (reduced) {
    return {
      initial: false,
      animate: { opacity: 1, transition: { duration: 0 } },
      exit: stillExit,
    }
  }

  return {
    initial: { opacity: 0, y: -14 },
    animate: { opacity: 1, y: 0, transition: SPRINGS.comment },
    exit: { opacity: 0, transition: SPRINGS.exit },
  }
}

/** Error de validación bajo el campo. */
export function fieldErrorMotion(reduced) {
  if (reduced) {
    return {
      initial: false,
      animate: { opacity: 1, transition: { duration: 0 } },
      exit: stillExit,
    }
  }

  return {
    initial: { opacity: 0, y: -6 },
    animate: { opacity: 1, y: 0, transition: SPRINGS.comment },
    exit: { opacity: 0, transition: SPRINGS.exit },
  }
}

/** Status del formulario ("Comentario publicado"). */
export function statusMotion(reduced) {
  if (reduced) {
    return {
      initial: false,
      animate: { opacity: 1, transition: { duration: 0 } },
      exit: stillExit,
    }
  }

  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: SPRINGS.comment },
    exit: { opacity: 0, transition: SPRINGS.exit },
  }
}

/**
 * La tarjeta es un `<a>`: hover sólo con puntero fino, tap con spring rígido,
 * foco de teclado con el mismo levante para que se vea dónde está el foco.
 * @param {{ reduced?: boolean, finePointer?: boolean }} options
 */
export function cardMotion({ reduced = false, finePointer = false } = {}) {
  const hoverEnabled = !reduced && finePointer

  return {
    initial: 'rest',
    whileHover: hoverEnabled ? 'hover' : undefined,
    whileTap: reduced ? undefined : 'tap',
    whileFocus: reduced ? undefined : 'focus',
    variants: {
      rest: { y: 0, scale: 1, transition: SPRINGS.card },
      hover: { y: reduced ? 0 : -6, scale: 1, transition: SPRINGS.card },
      focus: { y: reduced ? 0 : -2, scale: 1, transition: SPRINGS.card },
      tap: { y: reduced ? 0 : -1, scale: reduced ? 1 : 0.985, transition: SPRINGS.tap },
    },
  }
}

/** Feedback de un botón: se hunde apenas, con el spring rígido del tap. */
export function pressMotion(reduced) {
  return {
    whileTap: reduced ? undefined : { scale: 0.97, transition: SPRINGS.tap },
  }
}

/** El poster escala dentro del recorte: transform puro, sin tocar el layout. */
export const POSTER_VARIANTS = {
  rest: { scale: 1, transition: SPRINGS.card },
  hover: { scale: 1.045, transition: SPRINGS.card },
  focus: { scale: 1.02, transition: SPRINGS.card },
  tap: { scale: 1.005, transition: SPRINGS.tap },
}

/** Halo de elevación: se anima su opacidad, nunca el `box-shadow`. */
export const CARD_LIFT_VARIANTS = {
  rest: { opacity: 0, transition: SPRINGS.card },
  hover: { opacity: 1, transition: SPRINGS.card },
  focus: { opacity: 0.55, transition: SPRINGS.card },
  tap: { opacity: 0.35, transition: SPRINGS.tap },
}

/* -------------------------------------------------------------------- hook --- */

const FINE_POINTER_QUERY = '(pointer: fine)'

function subscribePointerFine(onChange) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia(FINE_POINTER_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getPointerFine() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(FINE_POINTER_QUERY).matches
}

/**
 * `true` sólo con mouse/trackpad. En touch no se dispara hover.
 * @returns {boolean}
 */
export function useFinePointer() {
  return useSyncExternalStore(subscribePointerFine, getPointerFine, () => false)
}
