/**
 * Elige la película destacada de la portada, como el `/random` del TP.
 * `random` se inyecta para poder testear la elección sin depender del azar.
 * @param {object[]} films películas que quien navega puede ver
 * @param {() => number} [random]
 * @returns {object | null}
 */
export function pickFeatured(films, random = Math.random) {
  if (!Array.isArray(films) || films.length === 0) return null
  const index = Math.min(films.length - 1, Math.max(0, Math.floor(random() * films.length)))
  return films[index]
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
