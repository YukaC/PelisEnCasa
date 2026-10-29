import test from 'node:test'
import assert from 'node:assert/strict'

import {
  STORAGE_PREFIX,
  STORAGE_KEY,
  validateComment,
  parseSeedDate,
  toLocalIsoDate,
  addCommentToStore,
  readStoredComments,
  commentsForFilm,
} from './comments.js'

function createStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    dump: () => Object.fromEntries(map),
  }
}

test('la clave de storage usa el prefijo de la demo', () => {
  assert.equal(STORAGE_PREFIX, 'pelis-demo:')
  assert.ok(STORAGE_KEY.startsWith(STORAGE_PREFIX))
})

test('validateComment rechaza nombre y texto vacíos o en blanco', () => {
  assert.deepEqual(validateComment({ name: '   ', text: 'Muy buena' }), {
    name: 'Poné tu nombre.',
  })
  assert.deepEqual(validateComment({ name: 'Ana', text: '  \n ' }), {
    text: 'Escribí un comentario.',
  })
  assert.deepEqual(validateComment({ name: '', text: '' }), {
    name: 'Poné tu nombre.',
    text: 'Escribí un comentario.',
  })
  assert.deepEqual(validateComment({ name: 'Ana', text: 'Me gustó' }), {})
})

test('addCommentToStore no guarda un comentario inválido', () => {
  const storage = createStorage()
  const result = addCommentToStore(storage, 2, { name: '  ', text: '' })

  assert.equal(result.ok, false)
  assert.deepEqual(result.errors, {
    name: 'Poné tu nombre.',
    text: 'Escribí un comentario.',
  })
  assert.deepEqual(storage.dump(), {})
})

test('addCommentToStore guarda el comentario con fecha y autor normalizados', () => {
  const storage = createStorage()
  const now = new Date('2026-10-29T18:30:00.000Z')
  const result = addCommentToStore(storage, 2, { name: ' Ana ', text: '  Muy buena  ' }, now)

  assert.equal(result.ok, true)
  assert.deepEqual(result.comment, {
    id: 'local-1793298600000',
    author: 'Ana',
    text: 'Muy buena',
    date: '2026-10-29',
  })

  const stored = JSON.parse(storage.getItem(STORAGE_KEY))
  assert.deepEqual(stored, { 2: [result.comment] })
})

test('addCommentToStore acumula comentarios de la misma película sin pisar otras', () => {
  const storage = createStorage()
  const first = addCommentToStore(storage, 2, { name: 'Ana', text: 'Primera' }, new Date('2026-01-01T10:00:00Z'))
  const second = addCommentToStore(storage, 2, { name: 'Beto', text: 'Segunda' }, new Date('2026-01-02T10:00:00Z'))
  addCommentToStore(storage, 5, { name: 'Caro', text: 'Otra peli' }, new Date('2026-01-03T10:00:00Z'))

  assert.equal(first.ok, true)
  assert.equal(second.ok, true)

  const stored = readStoredComments(storage)
  assert.deepEqual(stored[2].map((comment) => comment.text), ['Segunda', 'Primera'])
  assert.deepEqual(stored[5].map((comment) => comment.text), ['Otra peli'])
})

test('readStoredComments tolera storage vacío, JSON roto o datos con forma rara', () => {
  assert.deepEqual(readStoredComments(null), {})
  assert.deepEqual(readStoredComments(createStorage()), {})
  assert.deepEqual(readStoredComments(createStorage({ [STORAGE_KEY]: '{roto' })), {})
  assert.deepEqual(
    readStoredComments(createStorage({ [STORAGE_KEY]: '{"2":[{"bogus":true}],"3":"nope"}' })),
    {},
  )
})

test('toLocalIsoDate usa la fecha local, no la de UTC', () => {
  assert.equal(toLocalIsoDate(new Date(2026, 9, 29, 23, 30)), '2026-10-29')
  assert.equal(toLocalIsoDate(new Date(2026, 0, 1, 0, 5)), '2026-01-01')
})

test('parseSeedDate convierte dd/mm/yyyy en fecha ISO', () => {
  assert.equal(parseSeedDate('20/04/2022'), '2022-04-20')
  assert.equal(parseSeedDate('05/02/2022'), '2022-02-05')
  assert.equal(parseSeedDate('sin fecha'), null)
})

test('commentsForFilm mezcla semilla y guardados, del más nuevo al más viejo', () => {
  const seed = [
    { id: 'seed-1', author: 'Yuka', text: 'Entretenida', date: '2022-04-20' },
    { id: 'seed-3', author: 'Clainux', text: 'Le gustó a mi hijo', date: '2022-02-05' },
  ]
  const stored = [{ id: 'local-1', author: 'Ana', text: 'Recién vista', date: '2026-10-29' }]

  assert.deepEqual(
    commentsForFilm(seed, stored).map((comment) => comment.text),
    ['Recién vista', 'Entretenida', 'Le gustó a mi hijo'],
  )
  assert.deepEqual(commentsForFilm(seed, []).map((comment) => comment.id), ['seed-1', 'seed-3'])
  assert.deepEqual(commentsForFilm([], []), [])
})
