import test from 'node:test'
import assert from 'node:assert/strict'

import {
  firstSentence,
  featuredOrder,
  nextFeaturedIndex,
  previousFeaturedIndex,
} from './featured.js'

const FILMS = [{ id: 1, name: 'Uno' }, { id: 2, name: 'Dos' }, { id: 3, name: 'Tres' }]

test('featuredOrder incluye todas las películas visibles, una vez cada una', () => {
  const order = featuredOrder(FILMS, () => 0.5)
  assert.equal(order.length, FILMS.length)
  assert.deepEqual(order.map((film) => film.id).sort(), [1, 2, 3])
})

test('featuredOrder mezcla según el azar y no toca la lista original', () => {
  assert.deepEqual(featuredOrder(FILMS, () => 0).map((film) => film.id), [2, 3, 1])
  assert.deepEqual(featuredOrder(FILMS, () => 0.999).map((film) => film.id), [1, 2, 3])
  assert.deepEqual(FILMS.map((film) => film.id), [1, 2, 3])
})

test('featuredOrder no destaca nada cuando no hay películas visibles', () => {
  assert.deepEqual(featuredOrder([], () => 0.5), [])
  assert.deepEqual(featuredOrder(null, () => 0.5), [])
})

test('nextFeaturedIndex recorre toda la lista y vuelve a empezar', () => {
  assert.equal(nextFeaturedIndex(0, 3), 1)
  assert.equal(nextFeaturedIndex(1, 3), 2)
  assert.equal(nextFeaturedIndex(2, 3), 0)
})

test('nextFeaturedIndex se queda en 0 con una sola película o ninguna', () => {
  assert.equal(nextFeaturedIndex(0, 1), 0)
  assert.equal(nextFeaturedIndex(4, 0), 0)
  assert.equal(nextFeaturedIndex(7, 3), 2)
})

test('previousFeaturedIndex retrocede y del principio salta al final', () => {
  assert.equal(previousFeaturedIndex(2, 3), 1)
  assert.equal(previousFeaturedIndex(1, 3), 0)
  assert.equal(previousFeaturedIndex(0, 3), 2)
})

test('previousFeaturedIndex se queda en 0 con una sola película o ninguna', () => {
  assert.equal(previousFeaturedIndex(0, 1), 0)
  assert.equal(previousFeaturedIndex(4, 0), 0)
  assert.equal(previousFeaturedIndex(7, 3), 0)
})

test('firstSentence corta la sinopsis en la primera oración', () => {
  assert.equal(firstSentence('Una noche larga. Y después otra cosa.'), 'Una noche larga.')
  assert.equal(firstSentence('Sin punto final'), 'Sin punto final')
  assert.equal(firstSentence('   '), '')
  assert.equal(firstSentence(undefined), '')
})
