import test from 'node:test'
import assert from 'node:assert/strict'

import { STORAGE_PREFIX } from './comments.js'
import { THEME_KEY, nextTheme, readStoredTheme, resolveTheme, storeTheme } from './theme.js'

function createStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    dump: () => Object.fromEntries(map),
  }
}

test('el tema vive bajo el prefijo de la demo', () => {
  assert.equal(THEME_KEY, `${STORAGE_PREFIX}theme`)
})

test('sin elección guardada, la primera visita sigue al sistema', () => {
  assert.equal(resolveTheme(null, true), 'dark')
  assert.equal(resolveTheme(null, false), 'light')
})

test('la elección guardada le gana al sistema', () => {
  assert.equal(resolveTheme('light', true), 'light')
  assert.equal(resolveTheme('dark', false), 'dark')
})

test('el switch alterna entre claro y oscuro', () => {
  assert.equal(nextTheme('dark'), 'light')
  assert.equal(nextTheme('light'), 'dark')
})

test('guardar el tema lo deja en el storage y se vuelve a leer', () => {
  const storage = createStorage()
  assert.equal(storeTheme(storage, 'light'), true)
  assert.deepEqual(storage.dump(), { [THEME_KEY]: 'light' })
  assert.equal(readStoredTheme(storage), 'light')
})

test('un tema desconocido no se guarda ni se lee', () => {
  const storage = createStorage({ [THEME_KEY]: 'dark' })
  assert.equal(storeTheme(storage, 'sepia'), false)
  assert.deepEqual(storage.dump(), { [THEME_KEY]: 'dark' })
  assert.equal(readStoredTheme(createStorage({ [THEME_KEY]: 'sepia' })), null)
})

test('sin storage disponible no hay elección guardada y guardar no rompe', () => {
  const broken = {
    getItem() {
      throw new Error('denied')
    },
    setItem() {
      throw new Error('denied')
    },
  }
  assert.equal(readStoredTheme(null), null)
  assert.equal(readStoredTheme(broken), null)
  assert.equal(storeTheme(null, 'light'), false)
  assert.equal(storeTheme(broken, 'light'), false)
})

test('el arranque de index.html usa la misma clave y los mismos colores que el módulo', async () => {
  const { readFileSync } = await import('node:fs')
  const { THEME_COLORS } = await import('./theme.js')
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
  assert.ok(html.includes(`localStorage.getItem('${THEME_KEY}')`))
  assert.ok(html.includes(`'${THEME_COLORS.dark}'`))
  assert.ok(html.includes(`'${THEME_COLORS.light}'`))
})
