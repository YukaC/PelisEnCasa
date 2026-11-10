import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeText,
  filmMatchesQuery,
  filterFilms,
  sortFilms,
  collectOptions,
} from './search.js'

const films = [
  {
    id: 1,
    name: 'Jhon Wick 3 - Parabellum',
    year: 2019,
    score: 9.1,
    synopsis: 'John Wick regresa con una recompensa sobre su cabeza.',
    genres: ['Accion', 'Suspenso'],
    directors: ['Chad Stahelski'],
  },
  {
    id: 2,
    name: 'Spider-Man: Sin Camino a Casa',
    year: 2021,
    score: 9.7,
    synopsis: 'Peter Parker le pide ayuda al Doctor Strange.',
    genres: ['Accion', 'Aventura'],
    directors: ['Jon Watts'],
  },
  {
    id: 3,
    name: 'Dune',
    year: 2021,
    score: 8.4,
    synopsis: 'Paul Atreides llega a Arrakis.',
    genres: ['Ciencia Ficcion', 'Aventura'],
    directors: ['Denis Villeneuve'],
  },
  {
    id: 6,
    name: 'Encanto',
    year: 2021,
    score: 8.9,
    synopsis: 'Una familia con magia en la montaña.',
    genres: ['Musical', 'Comedia'],
    directors: ['Byron Howard', 'Jared Bush'],
  },
]

test('normalizeText quita acentos, mayúsculas y espacios de borde', () => {
  assert.equal(normalizeText('Acción'), 'accion')
  assert.equal(normalizeText('  DUNE  '), 'dune')
  assert.equal(normalizeText('ÁÉÍÓÚ Ñandú'), 'aeiou nandu')
  assert.equal(normalizeText(null), '')
})

test('filmMatchesQuery busca por nombre, director y sinopsis sin distinguir caso ni acentos', () => {
  assert.equal(filmMatchesQuery(films[0], 'WICK'), true)
  assert.equal(filmMatchesQuery(films[0], 'stahelski'), true)
  assert.equal(filmMatchesQuery(films[0], 'RECOMPENSA'), true)
  assert.equal(filmMatchesQuery(films[2], 'atreides'), true)
  assert.equal(filmMatchesQuery(films[1], 'camino a casa'), true)
  assert.equal(filmMatchesQuery(films[1], 'dune'), false)
  assert.equal(filmMatchesQuery(films[1], '   '), true)
})

test('filmMatchesQuery ignora acentos en la consulta', () => {
  const accentedFilm = { ...films[0], synopsis: 'Acción y suspenso.' }
  assert.equal(filmMatchesQuery(accentedFilm, 'accion'), true)
})

test('filterFilms combina búsqueda, género y director', () => {
  assert.deepEqual(
    filterFilms(films, { query: '', genre: '', director: '' }).map((film) => film.id),
    [1, 2, 3, 6],
  )
  assert.deepEqual(
    filterFilms(films, { query: '', genre: 'Aventura' }).map((film) => film.id),
    [2, 3],
  )
  assert.deepEqual(
    filterFilms(films, { query: '', director: 'Jared Bush' }).map((film) => film.id),
    [6],
  )
  assert.deepEqual(
    filterFilms(films, { query: '', genre: 'Aventura', director: 'Jon Watts' }).map((film) => film.id),
    [2],
  )
  assert.deepEqual(
    filterFilms(films, { query: 'dune', genre: 'Aventura', director: '' }).map((film) => film.id),
    [3],
  )
  assert.deepEqual(filterFilms(films, { query: 'nada que ver' }), [])
})

test('filterFilms no muta la lista original', () => {
  const snapshot = films.map((film) => film.id)
  filterFilms(films, { query: 'dune' })
  assert.deepEqual(films.map((film) => film.id), snapshot)
})

test('sortFilms ordena por score, por año y A-Z', () => {
  assert.deepEqual(sortFilms(films, 'score').map((film) => film.id), [2, 1, 6, 3])
  assert.deepEqual(sortFilms(films, 'year').map((film) => film.id), [2, 6, 3, 1])
  assert.deepEqual(sortFilms(films, 'az').map((film) => film.id), [3, 6, 1, 2])
})

test('sortFilms ordena A-Z con acentos y mayúsculas como espera un humano', () => {
  const list = [
    { ...films[0], id: 10, name: 'ángel' },
    { ...films[0], id: 11, name: 'Zorro' },
    { ...films[0], id: 12, name: 'Ñandú' },
  ]
  assert.deepEqual(sortFilms(list, 'az').map((film) => film.name), ['ángel', 'Ñandú', 'Zorro'])
})

test('sortFilms con una clave desconocida conserva el orden recibido', () => {
  const fallback = sortFilms(films, 'no-existe')
  assert.deepEqual(fallback.map((film) => film.id), [1, 2, 3, 6])
  assert.notEqual(fallback, films)
})

test('collectOptions devuelve valores únicos y ordenados alfabéticamente', () => {
  assert.deepEqual(collectOptions(films, 'genres'), [
    'Accion',
    'Aventura',
    'Ciencia Ficcion',
    'Comedia',
    'Musical',
    'Suspenso',
  ])
  assert.deepEqual(collectOptions(films, 'directors'), [
    'Byron Howard',
    'Chad Stahelski',
    'Denis Villeneuve',
    'Jared Bush',
    'Jon Watts',
  ])
  assert.deepEqual(collectOptions([], 'genres'), [])
})
