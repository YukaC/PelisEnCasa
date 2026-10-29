import test from 'node:test'
import assert from 'node:assert/strict'

import { formatScore, formatDate } from './format.js'

test('formatScore muestra el puntaje con un decimal', () => {
  assert.equal(formatScore(9), '9.0')
  assert.equal(formatScore(9.1), '9.1')
  assert.equal(formatScore('8.4'), '8.4')
  assert.equal(formatScore(null), '—')
  assert.equal(formatScore('sin dato'), '—')
})

test('formatDate muestra una fecha legible en es-AR', () => {
  assert.equal(formatDate('2022-04-20'), '20 de abril de 2022')
  assert.equal(formatDate('2026-10-29'), '29 de octubre de 2026')
  assert.equal(formatDate(null), '')
  assert.equal(formatDate('no-es-fecha'), '')
})
