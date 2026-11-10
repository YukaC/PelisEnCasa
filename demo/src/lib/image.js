/**
 * Reglas de las imágenes que sube la demo: qué archivo se acepta, a qué tamaño se
 * achica y cómo se resuelve la imagen de una película.
 *
 * Todo acá es puro (sin DOM) para poder testearlo con `node --test`. El recorte y la
 * compresión viven en `imageFile.js`, que sí necesita canvas.
 */

/** Formatos que el formulario acepta. */
export const ACCEPTED_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])

/** Techo del archivo que se elige: más que esto no entra en el storage del navegador. */
export const MAX_SOURCE_BYTES = 8 * 1024 * 1024

/** Caja del póster: 2:3, el mismo recorte que las imágenes del TP. */
export const POSTER_BOX = Object.freeze({ width: 600, height: 900 })

/** Caja del banner de la ficha: apaisado, como `<id>-banner.jpg`. */
export const BANNER_BOX = Object.freeze({ width: 1600, height: 900 })

/** Calidad de JPEG al recomprimir: se nota poco y pesa un tercio. */
export const JPEG_QUALITY = 0.82

/** Textos que ve quien usa el formulario. */
export const IMAGE_MESSAGES = Object.freeze({
  type: 'Elegí una imagen JPG, PNG o WebP.',
  size: 'La imagen pesa más de 8 MB. Achicala antes de subirla.',
  read: 'No pudimos leer esa imagen. Probá con otra.',
})

/**
 * Dice si el archivo elegido sirve. `null` significa que está bien.
 * @param {{ type?: string, size?: number } | null | undefined} file
 * @returns {string | null} mensaje de error, o `null`
 */
export function imageFileError(file) {
  if (!file) return null
  if (!ACCEPTED_TYPES.includes(String(file.type))) return IMAGE_MESSAGES.type
  if (Number(file.size) > MAX_SOURCE_BYTES) return IMAGE_MESSAGES.size
  return null
}

/**
 * Achica una imagen hasta que entre en la caja, sin deformarla y sin agrandarla nunca.
 * @param {{ width: number, height: number }} source
 * @param {{ width: number, height: number }} box
 * @returns {{ width: number, height: number }}
 */
export function fitWithin(source, box) {
  const width = Math.max(1, Number(source?.width) || 0)
  const height = Math.max(1, Number(source?.height) || 0)
  const scale = Math.min(1, box.width / width, box.height / height)
  if (scale === 1) return { width, height }

  return {
    width: Math.min(box.width, Math.round(width * scale)),
    height: Math.min(box.height, Math.round(height * scale)),
  }
}

/**
 * Bytes que ocupa una imagen ya convertida a `data:` URL: cuenta el binario, no el base64.
 * @param {string} dataUrl
 * @returns {number}
 */
export function dataUrlBytes(dataUrl) {
  const raw = String(dataUrl ?? '')
  const comma = raw.indexOf(',')
  const payload = comma === -1 ? '' : raw.slice(comma + 1)
  if (!payload) return 0

  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
  return Math.floor((payload.length * 3) / 4) - padding
}

/**
 * Imagen de una película: la que subió alguien en esta demo, o la estática del TP.
 * @param {{ id?: number, poster?: string, banner?: string }} film
 * @param {'poster' | 'banner'} kind
 * @returns {string}
 */
export function imageUrl(film, kind) {
  const stored = kind === 'banner' ? film?.banner : film?.poster
  if (typeof stored === 'string' && stored.trim() !== '') return stored
  return kind === 'banner' ? `/films/${film?.id}-banner.jpg` : `/films/${film?.id}.jpg`
}

/** Respaldo cuando el archivo no existe: película nueva sin imagen, o un id inventado. */
export const FALLBACK_IMAGE = '/films/fallback.jpg'

/**
 * Fuente que termina mostrando la `<img>`: la original, salvo que esa misma `src`
 * ya haya fallado, en cuyo caso cae al respaldo. Depende de la `src` y no de un flag
 * suelto, así una imagen nueva se vuelve a intentar y una rota no entra en loop.
 * @param {string} src
 * @param {string | null} failedSrc
 * @returns {string}
 */
export function resolveSafeImageSrc(src, failedSrc) {
  return src === failedSrc ? FALLBACK_IMAGE : src
}
