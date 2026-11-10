import test from 'node:test'
import assert from 'node:assert/strict'

import { STORAGE_PREFIX } from './comments.js'
import {
  DEMO_ACCOUNT,
  DEMO_ACCOUNTS,
  SESSION_KEY,
  validateLogin,
  readSession,
  signIn,
  signOut,
  getSession,
  subscribe,
} from './session.js'

function createStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    dump: () => Object.fromEntries(map),
  }
}

test('la sesión vive bajo el prefijo de la demo', () => {
  assert.ok(SESSION_KEY.startsWith(STORAGE_PREFIX))
})

test('validateLogin pide usuario y contraseña', () => {
  assert.deepEqual(validateLogin({ user: '  ', password: '' }), {
    user: 'Poné tu usuario.',
    password: 'Poné tu contraseña.',
  })
})

test('validateLogin rechaza credenciales que no son las de ninguna de las dos cuentas', () => {
  assert.deepEqual(validateLogin({ user: DEMO_ACCOUNT.user, password: 'otra' }), {
    form: 'Usuario o contraseña incorrectos. Usá una de las cuentas de ejemplo.',
  })
  assert.deepEqual(validateLogin({ user: ` ${DEMO_ACCOUNT.user} `, password: DEMO_ACCOUNT.password }), {})
})

test('signIn con credenciales inválidas no abre sesión ni toca el storage', () => {
  const storage = createStorage()
  const result = signIn(storage, { user: 'alguien', password: 'mal' })

  assert.equal(result.ok, false)
  assert.equal(result.errors.form, 'Usuario o contraseña incorrectos. Usá una de las cuentas de ejemplo.')
  assert.deepEqual(storage.dump(), {})
  assert.equal(readSession(storage), null)
  assert.equal(getSession(), null)
})

test('signIn guarda la sesión y avisa a quien esté suscripto', () => {
  const storage = createStorage()
  let calls = 0
  const unsubscribe = subscribe(() => {
    calls += 1
  })

  const result = signIn(storage, DEMO_ACCOUNT)

  assert.equal(result.ok, true)
  assert.deepEqual(result.session, { user: DEMO_ACCOUNT.user })
  assert.deepEqual(readSession(storage), { user: DEMO_ACCOUNT.user })
  assert.deepEqual(getSession(), { user: DEMO_ACCOUNT.user })
  assert.equal(calls, 1)

  unsubscribe()
  signOut(storage)
  assert.equal(calls, 1)
})

test('signOut cierra la sesión y borra la clave', () => {
  const storage = createStorage()
  signIn(storage, DEMO_ACCOUNT)
  signOut(storage)

  assert.deepEqual(storage.dump(), {})
  assert.equal(readSession(storage), null)
  assert.equal(getSession(), null)
})

test('readSession descarta contenido que no tiene forma de sesión', () => {
  assert.equal(readSession(createStorage({ [SESSION_KEY]: 'no es json' })), null)
  assert.equal(readSession(createStorage({ [SESSION_KEY]: '{"user":""}' })), null)
  assert.equal(readSession(createStorage({ [SESSION_KEY]: '[]' })), null)
  assert.equal(readSession(null), null)
})

test('sin storage disponible la sesión funciona en memoria', () => {
  const result = signIn(null, DEMO_ACCOUNT)
  assert.equal(result.ok, true)
  assert.deepEqual(getSession(), { user: DEMO_ACCOUNT.user })
  signOut(null)
  assert.equal(getSession(), null)
})

test('las dos cuentas del TP están en un solo lugar y se pueden recorrer', () => {
  assert.deepEqual(DEMO_ACCOUNTS.map((account) => account.user), ['Ana', 'Bruno'])
})

test('validateLogin acepta cada una de las dos cuentas del TP', () => {
  for (const account of DEMO_ACCOUNTS) {
    assert.deepEqual(validateLogin({ user: account.user, password: account.password }), {}, account.user)
  }
})

test('validateLogin no acepta el usuario de una cuenta con la contraseña de la otra', () => {
  const [first, second] = DEMO_ACCOUNTS
  assert.deepEqual(validateLogin({ user: first.user, password: second.password }), {
    form: 'Usuario o contraseña incorrectos. Usá una de las cuentas de ejemplo.',
  })
})

test('signIn guarda el nombre de la cuenta con la que se entró', () => {
  const storage = createStorage()
  const account = DEMO_ACCOUNTS[1]
  const result = signIn(storage, { user: account.user, password: account.password })

  assert.equal(result.ok, true)
  assert.deepEqual(result.session, { user: 'Bruno' })
  assert.deepEqual(readSession(storage), { user: 'Bruno' })
})
