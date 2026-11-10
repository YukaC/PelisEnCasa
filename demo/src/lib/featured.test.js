import test from 'node:test'
import assert from 'node:assert/strict'

import { firstSentence, pickFeatured } from './featured.js'

const FILMS = [{ id: 1, name: 'Uno' }, { id: 2, name: 'Dos' }, { id: 3, name: 'Tres' }]

test('pickFeatured devuelve la película que marca el azar', () => {
  assert.equal(pickFeatured(FILMS, () => 0).id, 1)
  assert.equal(pickFeatured(FILMS, () => 0.5).id, 2)
  assert.equal(pickFeatured(FILMS, () => 0.999).id, 3)
})

test('pickFeatured no se sale de la lista ni con un azar raro', () => {
  assert.equal(pickFeatured(FILMS, () => 1).id, 3)
  assert.equal(pickFeatured(FILMS, () => -3).id, 1)
})

test('pickFeatured no destaca nada cuando no hay películas visibles', () => {
  assert.equal(pickFeatured([], () => 0.5), null)
  assert.equal(pickFeatured(null, () => 0.5), null)
})

test('firstSentence corta la sinopsis en la primera oración', () => {
  assert.equal(firstSentence('Una noche larga. Y después otra cosa.'), 'Una noche larga.')
  assert.equal(firstSentence('Sin punto final'), 'Sin punto final')
  assert.equal(firstSentence('   '), '')
  assert.equal(firstSentence(undefined), '')
})
