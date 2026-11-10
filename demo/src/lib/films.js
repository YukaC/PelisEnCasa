import { STORAGE_PREFIX } from './comments.js'

/** Clave donde vive el catálogo una vez que alguien sube, edita o borra una película. */
export const FILMS_KEY = `${STORAGE_PREFIX}films`

/** Sin sesión, la API del TP sólo devuelve las últimas 10 películas (`db['peliculas'][-10:]`). */
export const GUEST_LIMIT = 10

const MESSAGES = {
  addUnauthorized: 'Tenés que iniciar sesión para subir una película.',
  editUnauthorized: 'Tenés que iniciar sesión para editar una película.',
  deleteUnauthorized: 'Tenés que iniciar sesión para eliminar una película.',
  duplicate: 'Ese nombre ya existe.',
  notFound: 'Esa película no existe.',
  hasComments: 'No se puede eliminar una película con comentarios.',
  storageFull: 'No hay lugar en este navegador para guardar la imagen. Probá con una más chica.',
}

const YEAR = /^\d{4}$/

function text(value) {
  return String(value ?? '').trim()
}

function toId(value) {
  const id = Number.parseInt(text(value), 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

function isRawFilm(value) {
  return (
    value &&
    typeof value === 'object' &&
    Number.isInteger(value.id) &&
    typeof value.nombre === 'string' &&
    typeof value.sinopsis === 'string' &&
    Number.isInteger(value.genero) &&
    Number.isInteger(value.director)
  )
}

/**
 * Valida el formulario de película con los mismos obligatorios que el del TP:
 * todo menos el segundo director.
 * @param {object} input campos del formulario, como texto
 * @returns {Record<string, string>} errores por campo, vacío si está ok
 */
export function validateFilm(input) {
  /** @type {Record<string, string>} */
  const errors = {}
  if (!text(input?.nombre)) errors.nombre = 'Poné el nombre de la película.'
  if (!text(input?.sinopsis)) errors.sinopsis = 'Escribí la sinopsis.'
  if (!toId(input?.genero)) errors.genero = 'Elegí el primer género.'
  if (!toId(input?.genero2)) errors.genero2 = 'Elegí el segundo género.'
  if (!toId(input?.director)) errors.director = 'Elegí el primer director.'
  if (!text(input?.duracion)) errors.duracion = 'Poné la duración.'
  if (!YEAR.test(text(input?.year))) errors.year = 'Poné un año de cuatro cifras.'

  const score = Number(text(input?.score).replace(',', '.'))
  if (!text(input?.score) || !Number.isFinite(score) || score < 0 || score > 10) {
    errors.score = 'Poné una puntuación entre 0 y 10.'
  }
  return errors
}

/**
 * Imagen que queda en el registro: `undefined` conserva la que estaba, `null` la borra
 * y un `data:` URL la reemplaza.
 * @param {unknown} next
 * @param {string | undefined} current
 * @returns {string | null}
 */
function pickImage(next, current) {
  if (next === undefined) return current ?? null
  if (next === null) return null
  return text(next) || null
}

/**
 * Arma el registro con la forma de `db.json`: ids numéricos, año y score como texto.
 * Las imágenes sólo aparecen cuando la película tiene una subida en esta demo, así que
 * una película cualquiera sigue teniendo exactamente la forma del TP.
 */
function toRawFilm(id, input, previous = null) {
  const film = {
    id,
    nombre: text(input.nombre),
    sinopsis: text(input.sinopsis),
    genero: toId(input.genero),
    genero2: toId(input.genero2),
    director: toId(input.director),
    director2: toId(input.director2),
    duracion: text(input.duracion),
    year: text(input.year),
    score: text(input.score).replace(',', '.'),
  }

  const poster = pickImage(input.poster, previous?.poster)
  if (poster) film.poster = poster
  const banner = pickImage(input.banner, previous?.banner)
  if (banner) film.banner = banner

  return film
}

function nameTaken(films, nombre, exceptId = null) {
  const wanted = text(nombre).toLowerCase()
  return films.some((film) => film.id !== exceptId && film.nombre.trim().toLowerCase() === wanted)
}

/**
 * Guarda el catálogo. Devuelve `false` cuando el navegador no tiene más lugar, así la
 * pantalla puede avisar en vez de mostrar como guardado algo que nunca se guardó.
 * @param {Storage|null} storage
 * @param {object[]} films
 * @returns {boolean}
 */
function writeFilms(storage, films) {
  if (!storage) return true
  try {
    storage.setItem(FILMS_KEY, JSON.stringify(films))
    return true
  } catch {
    // sin storage disponible: el cambio dura lo que dure la pestaña
    return false
  }
}

/**
 * Catálogo vigente: el guardado en el navegador si existe y es válido, si no la semilla del TP.
 * @param {Storage|null} storage
 * @param {object[]} seed películas de `db.json`
 * @returns {object[]}
 */
export function readFilms(storage, seed) {
  if (!storage) return seed
  try {
    const raw = storage.getItem(FILMS_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.every(isRawFilm) ? parsed : seed
  } catch {
    return seed
  }
}

/**
 * Películas que ve quien navega: todas con sesión, las últimas 10 sin sesión.
 * @param {object[]} films
 * @param {object|null} session
 * @returns {object[]}
 */
export function visibleFilms(films, session) {
  return session ? films : films.slice(-GUEST_LIMIT)
}

/**
 * Sube una película. Sin sesión, con datos inválidos o con un nombre repetido no guarda nada.
 * @param {Storage|null} storage
 * @param {object[]} films catálogo vigente
 * @param {object|null} session
 * @param {object} input
 */
export function addFilm(storage, films, session, input) {
  if (!session) return { ok: false, status: 'unauthorized', message: MESSAGES.addUnauthorized }

  const errors = validateFilm(input)
  if (Object.keys(errors).length > 0) return { ok: false, status: 'invalid', errors }
  if (nameTaken(films, input.nombre)) {
    return { ok: false, status: 'conflict', errors: { nombre: MESSAGES.duplicate } }
  }

  // El TP usaba `len + 1`, que repite ids después de un borrado: acá sigue al mayor.
  const nextId = films.reduce((max, film) => Math.max(max, film.id), 0) + 1
  const film = toRawFilm(nextId, input)
  const next = [...films, film]
  if (!writeFilms(storage, next)) return { ok: false, status: 'storage-full', message: MESSAGES.storageFull }
  return { ok: true, film, films: next }
}

/**
 * Edita una película existente conservando su id.
 * @param {Storage|null} storage
 * @param {object[]} films
 * @param {object|null} session
 * @param {number} id
 * @param {object} input
 */
export function editFilm(storage, films, session, id, input) {
  if (!session) return { ok: false, status: 'unauthorized', message: MESSAGES.editUnauthorized }
  const previous = films.find((film) => film.id === id)
  if (!previous) {
    return { ok: false, status: 'not-found', message: MESSAGES.notFound }
  }

  const errors = validateFilm(input)
  if (Object.keys(errors).length > 0) return { ok: false, status: 'invalid', errors }
  if (nameTaken(films, input.nombre, id)) {
    return { ok: false, status: 'conflict', errors: { nombre: MESSAGES.duplicate } }
  }

  const film = toRawFilm(id, input, previous)
  const next = films.map((current) => (current.id === id ? film : current))
  if (!writeFilms(storage, next)) return { ok: false, status: 'storage-full', message: MESSAGES.storageFull }
  return { ok: true, film, films: next }
}

/**
 * Elimina una película. Como en el TP, una película con comentarios no se puede eliminar.
 * @param {Storage|null} storage
 * @param {object[]} films
 * @param {object|null} session
 * @param {number} id
 * @param {number} commentCount comentarios que tiene la película
 */
export function deleteFilm(storage, films, session, id, commentCount) {
  if (!session) return { ok: false, status: 'unauthorized', message: MESSAGES.deleteUnauthorized }
  if (!films.some((film) => film.id === id)) {
    return { ok: false, status: 'not-found', message: MESSAGES.notFound }
  }
  if (commentCount > 0) return { ok: false, status: 'conflict', message: MESSAGES.hasComments }

  const next = films.filter((film) => film.id !== id)
  writeFilms(storage, next)
  return { ok: true, films: next }
}
