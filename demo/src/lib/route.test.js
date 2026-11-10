import test from 'node:test'
import assert from 'node:assert/strict'

import { parseHash } from './route.js'

test('parseHash resuelve el catálogo', () => {
  assert.deepEqual(parseHash('#/'), { name: 'catalog' })
  assert.deepEqual(parseHash(''), { name: 'catalog' })
  assert.deepEqual(parseHash('#'), { name: 'catalog' })
  assert.deepEqual(parseHash(null), { name: 'catalog' })
})

test('parseHash resuelve una ficha por id numérico', () => {
  assert.deepEqual(parseHash('#/film/2'), { name: 'film', filmId: 2 })
  assert.deepEqual(parseHash('#/film/11'), { name: 'film', filmId: 11 })
})

test('parseHash ignora query y barras finales', () => {
  assert.deepEqual(parseHash('#/film/5?origen=grilla'), { name: 'film', filmId: 5 })
  assert.deepEqual(parseHash('#/film/5/'), { name: 'film', filmId: 5 })
})

test('parseHash marca rutas inválidas como not-found', () => {
  assert.equal(parseHash('#/film/abc').name, 'not-found')
  assert.equal(parseHash('#/film').name, 'not-found')
  assert.equal(parseHash('#/otra-cosa').name, 'not-found')
})

test('parseHash resuelve el login y su destino de vuelta', () => {
  assert.deepEqual(parseHash('#/login'), { name: 'login', next: '/' })
  assert.deepEqual(parseHash('#/login?next=/film/2'), { name: 'login', next: '/film/2' })
  assert.deepEqual(parseHash('#/login?next=https://otro.sitio'), { name: 'login', next: '/' })
})

test('parseHash resuelve subir y editar película', () => {
  assert.deepEqual(parseHash('#/subir'), { name: 'film-new' })
  assert.deepEqual(parseHash('#/film/4/editar'), { name: 'film-edit', filmId: 4 })
  assert.equal(parseHash('#/film/abc/editar').name, 'not-found')
})
