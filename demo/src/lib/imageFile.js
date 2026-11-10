import { BANNER_BOX, IMAGE_MESSAGES, JPEG_QUALITY, POSTER_BOX, fitWithin, imageFileError } from './image.js'

/** Caja a la que se recorta cada imagen del formulario. */
const BOXES = { poster: POSTER_BOX, banner: BANNER_BOX }

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable image'))
    }
    image.src = url
  })
}

/**
 * Convierte el archivo elegido en un `data:` URL que entra en el storage del navegador:
 * lo achica a la caja que le corresponde y lo recomprime como JPEG.
 * @param {File} file
 * @param {'poster' | 'banner'} kind
 * @returns {Promise<{ ok: true, dataUrl: string, width: number, height: number } | { ok: false, error: string }>}
 */
export async function prepareImage(file, kind) {
  const rejected = imageFileError(file)
  if (rejected) return { ok: false, error: rejected }

  const box = BOXES[kind]
  if (!box) return { ok: false, error: IMAGE_MESSAGES.read }

  try {
    const image = await loadImage(file)
    const fitted = fitWithin({ width: image.naturalWidth, height: image.naturalHeight }, box)

    const canvas = document.createElement('canvas')
    canvas.width = fitted.width
    canvas.height = fitted.height
    canvas.getContext('2d').drawImage(image, 0, 0, fitted.width, fitted.height)

    return { ok: true, dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), ...fitted }
  } catch {
    return { ok: false, error: IMAGE_MESSAGES.read }
  }
}
