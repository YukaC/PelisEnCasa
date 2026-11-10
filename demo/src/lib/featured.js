/** Milisegundos que cada película destacada queda en la portada. */
export const FEATURED_ROTATION_MS = 7000

/**
 * Orden de la rotación de la portada: todas las películas visibles, mezcladas,
 * una vez cada una. `random` se inyecta para testear la mezcla sin depender del azar.
 * @param {object[]} films películas que quien navega puede ver
 * @param {() => number} [random]
 * @returns {object[]} copia mezclada; la lista original no se toca
 */
export function featuredOrder(films, random = Math.random) {
  if (!Array.isArray(films)) return []
  const order = [...films]
  for (let last = order.length - 1; last > 0; last -= 1) {
    const pick = Math.min(last, Math.max(0, Math.floor(random() * (last + 1))))
    ;[order[last], order[pick]] = [order[pick], order[last]]
  }
  return order
}

/**
 * Posición siguiente de la rotación: al llegar al final vuelve a empezar.
 * @param {number} index
 * @param {number} length
 * @returns {number}
 */
export function nextFeaturedIndex(index, length) {
  if (!(length > 1)) return 0
  return (index + 1) % length
}

/**
 * Posición anterior de la rotación: del principio salta al final.
 * @param {number} index
 * @param {number} length
 * @returns {number}
 */
export function previousFeaturedIndex(index, length) {
  if (!(length > 1)) return 0
  return ((index % length) - 1 + length) % length
}

/**
 * Primer tramo de la sinopsis: la portada no repite la ficha entera.
 * @param {string} [text]
 * @returns {string}
 */
export function firstSentence(text = '') {
  const clean = String(text ?? '').trim()
  if (!clean) return ''
  const end = clean.indexOf('. ')
  return end === -1 ? clean : clean.slice(0, end + 1)
}
