import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACCEPTED_TYPES,
  BANNER_BOX,
  FALLBACK_IMAGE,
  IMAGE_MESSAGES,
  JPEG_QUALITY,
  MAX_SOURCE_BYTES,
  POSTER_BOX,
  dataUrlBytes,
  fitWithin,
  imageFileError,
  imageUrl,
  resolveSafeImageSrc,
} from './image.js'

const file = (type, size) => ({ type, size })

test('imageFileError acepta los tres formatos de imagen que ofrece el formulario', () => {
  for (const type of ACCEPTED_TYPES) {
    assert.equal(imageFileError(file(type, 1024)), null, type)
  }
})

test('imageFileError rechaza cualquier archivo que no sea imagen de los tres formatos', () => {
  assert.equal(imageFileError(file('application/pdf', 1024)), IMAGE_MESSAGES.type)
  assert.equal(imageFileError(file('image/gif', 1024)), IMAGE_MESSAGES.type)
  assert.equal(imageFileError(file('', 1024)), IMAGE_MESSAGES.type)
})

test('imageFileError rechaza una imagen que supera los 8 MB y acepta justo el límite', () => {
  assert.equal(MAX_SOURCE_BYTES, 8 * 1024 * 1024)
  assert.equal(imageFileError(file('image/jpeg', MAX_SOURCE_BYTES)), null)
  assert.equal(imageFileError(file('image/jpeg', MAX_SOURCE_BYTES + 1)), IMAGE_MESSAGES.size)
})

test('imageFileError no se queja cuando todavía no se eligió ningún archivo', () => {
  assert.equal(imageFileError(null), null)
  assert.equal(imageFileError(undefined), null)
})

test('fitWithin achica el póster al tamaño de la caja conservando la proporción', () => {
  assert.deepEqual(fitWithin({ width: 1200, height: 1800 }, POSTER_BOX), { width: 600, height: 900 })
})

test('fitWithin achica un banner apaisado por el ancho de su caja', () => {
  assert.deepEqual(fitWithin({ width: 3200, height: 900 }, BANNER_BOX), { width: 1600, height: 450 })
})

test('fitWithin nunca agranda una imagen más chica que la caja', () => {
  assert.deepEqual(fitWithin({ width: 300, height: 450 }, POSTER_BOX), { width: 300, height: 450 })
  assert.deepEqual(fitWithin({ width: 200, height: 120 }, BANNER_BOX), { width: 200, height: 120 })
})

test('fitWithin redondea a píxeles enteros sin salirse de la caja', () => {
  const fitted = fitWithin({ width: 1333, height: 2000 }, POSTER_BOX)
  assert.equal(Number.isInteger(fitted.width), true)
  assert.equal(Number.isInteger(fitted.height), true)
  assert.equal(fitted.height, POSTER_BOX.height)
  assert.equal(fitted.width <= POSTER_BOX.width, true)
})

test('dataUrlBytes cuenta los bytes reales de la imagen y no el texto base64', () => {
  assert.equal(dataUrlBytes('data:image/jpeg;base64,AAAA'), 3)
  assert.equal(dataUrlBytes('data:image/png;base64,'), 0)
  assert.equal(dataUrlBytes(''), 0)
})

test('imageUrl usa la imagen guardada por la película y si no la estática del TP', () => {
  assert.equal(imageUrl({ id: 7, poster: 'data:image/jpeg;base64,AA' }, 'poster'), 'data:image/jpeg;base64,AA')
  assert.equal(imageUrl({ id: 7 }, 'poster'), '/films/7.jpg')
  assert.equal(imageUrl({ id: 7, banner: 'data:image/jpeg;base64,BB' }, 'banner'), 'data:image/jpeg;base64,BB')
  assert.equal(imageUrl({ id: 7 }, 'banner'), '/films/7-banner.jpg')
})

test('imageUrl no cruza el póster con el banner', () => {
  const film = { id: 3, poster: 'data:image/jpeg;base64,AA' }
  assert.equal(imageUrl(film, 'banner'), '/films/3-banner.jpg')
})

test('la calidad de compresión de la demo queda fija en 0.82', () => {
  assert.equal(JPEG_QUALITY, 0.82)
})

test('resolveSafeImageSrc cae al respaldo sólo para la imagen que falló', () => {
  assert.equal(resolveSafeImageSrc('/films/12.jpg', null), '/films/12.jpg')

  const failed = '/films/12.jpg'
  assert.equal(resolveSafeImageSrc('/films/12.jpg', failed), FALLBACK_IMAGE)
  assert.equal(resolveSafeImageSrc('/films/3.jpg', failed), '/films/3.jpg')
})
