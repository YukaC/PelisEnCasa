const DIACRITICS = /[\u0300-\u036f]/g
const collator = new Intl.Collator('es', { sensitivity: 'base' })

/**
 * Normaliza texto para búsquedas: sin acentos, minúsculas y sin espacios de borde.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .trim()
}

/**
 * @param {{ score?: string|number }} film
 * @returns {number}
 */
export function scoreValue(film) {
  const score = Number.parseFloat(film?.score)
  return Number.isFinite(score) ? score : 0
}

/**
 * Busca en nombre, sinopsis, géneros y directores, sin distinguir caso ni acentos.
 * @param {object} film
 * @param {string} query
 * @returns {boolean}
 */
export function filmMatchesQuery(film, query) {
  const needle = normalizeText(query)
  if (!needle) return true

  const haystack = [
    film.name,
    film.synopsis,
    ...(film.genres ?? []),
    ...(film.directors ?? []),
  ]

  return haystack.some((value) => normalizeText(value).includes(needle))
}

/**
 * Aplica búsqueda + filtros de género/director. Funciones puras, sin DOM ni storage.
 * @param {object[]} films
 * @param {{ query?: string, genre?: string, director?: string }} criteria
 * @returns {object[]}
 */
export function filterFilms(films, { query = '', genre = '', director = '' } = {}) {
  return films.filter((film) => {
    if (!filmMatchesQuery(film, query)) return false
    if (genre && !(film.genres ?? []).includes(genre)) return false
    if (director && !(film.directors ?? []).includes(director)) return false
    return true
  })
}

/**
 * Ordena una copia de la lista: mejor score, más nueva o A-Z.
 * @param {object[]} films
 * @param {'score'|'year'|'az'|string} sortKey
 * @returns {object[]}
 */
export function sortFilms(films, sortKey) {
  const sorted = [...films]

  switch (sortKey) {
    case 'score':
      return sorted.sort(
        (a, b) =>
          scoreValue(b) - scoreValue(a) ||
          Number(b.year) - Number(a.year) ||
          collator.compare(a.name, b.name),
      )
    case 'year':
      return sorted.sort(
        (a, b) =>
          Number(b.year) - Number(a.year) ||
          scoreValue(b) - scoreValue(a) ||
          collator.compare(a.name, b.name),
      )
    case 'az':
      return sorted.sort((a, b) => collator.compare(a.name, b.name))
    default:
      return sorted
  }
}

/**
 * Opciones únicas de un campo de lista (géneros o directores), ordenadas A-Z.
 * @param {object[]} films
 * @param {'genres'|'directors'} key
 * @returns {string[]}
 */
export function collectOptions(films, key) {
  const values = new Set()
  for (const film of films) {
    for (const value of film[key] ?? []) {
      values.add(value)
    }
  }
  return [...values].sort((a, b) => collator.compare(a, b))
}
