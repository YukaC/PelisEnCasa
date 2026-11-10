import test from 'node:test'
import assert from 'node:assert/strict'

import { STORAGE_PREFIX } from './comments.js'
import {
  FILMS_KEY,
  GUEST_LIMIT,
  validateFilm,
  readFilms,
  visibleFilms,
  addFilm,
  editFilm,
  deleteFilm,
} from './films.js'

function createStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    dump: () => Object.fromEntries(map),
  }
}

const raw = (id, nombre) => ({
  id,
  nombre,
  year: '2020',
  duracion: '2h 0m',
  genero: 1,
  genero2: 2,
  director: 1,
  director2: null,
  score: '8.0',
  sinopsis: 'Sinopsis',
})

const SEED = Array.from({ length: 11 }, (_, index) => raw(index + 1, `Peli ${index + 1}`))
const SESSION = { user: 'demo' }
const INPUT = {
  nombre: ' Nueva ',
  sinopsis: ' Una sinopsis ',
  genero: '3',
  genero2: '4',
  director: '5',
  director2: '',
  duracion: '1h 50m',
  year: '2024',
  score: '7.5',
}

test('las películas editadas viven bajo el prefijo de la demo', () => {
  assert.ok(FILMS_KEY.startsWith(STORAGE_PREFIX))
})

test('visibleFilms muestra sólo las últimas 10 sin sesión y todas con sesión', () => {
  assert.equal(GUEST_LIMIT, 10)
  assert.deepEqual(
    visibleFilms(SEED, null).map((film) => film.id),
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  )
  assert.equal(visibleFilms(SEED, SESSION).length, 11)
})

test('validateFilm exige los campos obligatorios del formulario original', () => {
  assert.deepEqual(validateFilm({}), {
    nombre: 'Poné el nombre de la película.',
    sinopsis: 'Escribí la sinopsis.',
    genero: 'Elegí el primer género.',
    genero2: 'Elegí el segundo género.',
    director: 'Elegí el primer director.',
    duracion: 'Poné la duración.',
    year: 'Poné un año de cuatro cifras.',
    score: 'Poné una puntuación entre 0 y 10.',
  })
  assert.deepEqual(validateFilm(INPUT), {})
})

test('validateFilm rechaza año y puntuación fuera de rango', () => {
  assert.equal(validateFilm({ ...INPUT, year: '24' }).year, 'Poné un año de cuatro cifras.')
  assert.equal(validateFilm({ ...INPUT, score: '11' }).score, 'Poné una puntuación entre 0 y 10.')
  assert.equal(validateFilm({ ...INPUT, score: 'ocho' }).score, 'Poné una puntuación entre 0 y 10.')
})

test('addFilm sin sesión no guarda nada', () => {
  const storage = createStorage()
  const result = addFilm(storage, SEED, null, INPUT)

  assert.equal(result.ok, false)
  assert.equal(result.status, 'unauthorized')
  assert.deepEqual(storage.dump(), {})
})

test('addFilm guarda la película con el formato del TP y el id siguiente', () => {
  const storage = createStorage()
  const result = addFilm(storage, SEED, SESSION, INPUT)

  assert.equal(result.ok, true)
  assert.deepEqual(result.film, {
    id: 12,
    nombre: 'Nueva',
    sinopsis: 'Una sinopsis',
    genero: 3,
    genero2: 4,
    director: 5,
    director2: null,
    duracion: '1h 50m',
    year: '2024',
    score: '7.5',
  })
  assert.equal(result.films.length, 12)
  assert.deepEqual(readFilms(storage, SEED), result.films)
})

test('addFilm rechaza un nombre que ya existe', () => {
  const storage = createStorage()
  const result = addFilm(storage, SEED, SESSION, { ...INPUT, nombre: 'peli 3' })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'conflict')
  assert.deepEqual(result.errors, { nombre: 'Ese nombre ya existe.' })
  assert.deepEqual(storage.dump(), {})
})

test('addFilm con datos inválidos devuelve los errores y no guarda', () => {
  const storage = createStorage()
  const result = addFilm(storage, SEED, SESSION, { ...INPUT, sinopsis: ' ' })

  assert.equal(result.ok, false)
  assert.equal(result.status, 'invalid')
  assert.deepEqual(result.errors, { sinopsis: 'Escribí la sinopsis.' })
  assert.deepEqual(storage.dump(), {})
})

test('editFilm sin sesión no cambia la película', () => {
  const storage = createStorage()
  const result = editFilm(storage, SEED, null, 3, INPUT)

  assert.equal(result.ok, false)
  assert.equal(result.status, 'unauthorized')
  assert.deepEqual(storage.dump(), {})
})

test('editFilm reemplaza los datos y conserva el id', () => {
  const storage = createStorage()
  const result = editFilm(storage, SEED, SESSION, 3, { ...INPUT, director2: '6' })

  assert.equal(result.ok, true)
  assert.equal(result.film.id, 3)
  assert.equal(result.film.nombre, 'Nueva')
  assert.equal(result.film.director2, 6)
  assert.equal(result.films.length, 11)
  assert.equal(readFilms(storage, SEED).find((film) => film.id === 3).nombre, 'Nueva')
})

test('editFilm permite conservar el nombre propio pero no tomar el de otra', () => {
  const storage = createStorage()
  assert.equal(editFilm(storage, SEED, SESSION, 3, { ...INPUT, nombre: 'Peli 3' }).ok, true)
  assert.equal(editFilm(storage, SEED, SESSION, 3, { ...INPUT, nombre: 'Peli 4' }).status, 'conflict')
})

test('editFilm avisa cuando la película no existe', () => {
  const result = editFilm(createStorage(), SEED, SESSION, 99, INPUT)
  assert.equal(result.status, 'not-found')
})

test('deleteFilm sin sesión no borra', () => {
  const storage = createStorage()
  const result = deleteFilm(storage, SEED, null, 3, 0)

  assert.equal(result.ok, false)
  assert.equal(result.status, 'unauthorized')
  assert.deepEqual(storage.dump(), {})
})

test('deleteFilm no borra una película con comentarios', () => {
  const storage = createStorage()
  const result = deleteFilm(storage, SEED, SESSION, 3, 2)

  assert.equal(result.ok, false)
  assert.equal(result.status, 'conflict')
  assert.equal(result.message, 'No se puede eliminar una película con comentarios.')
  assert.deepEqual(storage.dump(), {})
})

test('deleteFilm borra la película y el id siguiente no se reutiliza mal', () => {
  const storage = createStorage()
  const removed = deleteFilm(storage, SEED, SESSION, 3, 0)

  assert.equal(removed.ok, true)
  assert.equal(removed.films.some((film) => film.id === 3), false)
  assert.equal(readFilms(storage, SEED).length, 10)
  assert.equal(addFilm(storage, removed.films, SESSION, INPUT).film.id, 12)
})

test('deleteFilm avisa cuando la película no existe', () => {
  assert.equal(deleteFilm(createStorage(), SEED, SESSION, 99, 0).status, 'not-found')
})

test('readFilms vuelve a la semilla si lo guardado no tiene forma válida', () => {
  assert.deepEqual(readFilms(createStorage({ [FILMS_KEY]: 'no es json' }), SEED), SEED)
  assert.deepEqual(readFilms(createStorage({ [FILMS_KEY]: '{"a":1}' }), SEED), SEED)
  assert.deepEqual(readFilms(createStorage({ [FILMS_KEY]: '[{"id":"x"}]' }), SEED), SEED)
  assert.deepEqual(readFilms(null, SEED), SEED)
})
