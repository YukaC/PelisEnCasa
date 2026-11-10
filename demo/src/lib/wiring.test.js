import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Guarda de cableado: los símbolos que este cambio agregó a `lib/` viajan a los
 * componentes, y el build no se queja si uno se usa sin importar (revienta recién
 * en el navegador). Sin entorno DOM, esto es lo que puede cubrir ese agujero.
 */
const LIB_SYMBOLS = [
  'imageUrl',
  'resolveSafeImageSrc',
  'prepareImage',
  'featuredOrder',
  'nextFeaturedIndex',
  'previousFeaturedIndex',
  'FEATURED_ROTATION_MS',
  'firstSentence',
  'dataUrlBytes',
  'imageFileError',
  'ACCEPTED_TYPES',
  'DEMO_ACCOUNTS',
]

const SRC = fileURLToPath(new URL('..', import.meta.url))

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return walk(path)
    return /\.(js|jsx)$/.test(entry) && !/\.test\.js$/.test(entry) ? [path] : []
  })
}

const isBound = (source, name) =>
  new RegExp(`import\\s+[^;]*\\b${name}\\b[^;]*from`).test(source) ||
  new RegExp(`(?:const|let|var|function|class)\\s+${name}\\b`).test(source) ||
  new RegExp(`export\\s+(?:const|function|class)\\s+${name}\\b`).test(source)

test('cada símbolo de lib que usa un archivo de src está importado ahí', () => {
  const offenders = []

  for (const file of walk(SRC)) {
    const source = readFileSync(file, 'utf8')
    for (const name of LIB_SYMBOLS) {
      if (!new RegExp(`\\b${name}\\b`).test(source)) continue
      if (!isBound(source, name)) offenders.push(`${file.replace(SRC, 'demo/src/')} usa ${name}`)
    }
  }

  assert.deepEqual(offenders, [])
})
