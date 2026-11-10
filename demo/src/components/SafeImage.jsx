import { resolveSafeImageSrc } from '../lib/image.js'
import { useState } from 'react'

/**
 * Imagen con fallback local: si el archivo no existe, cae en `films/fallback.jpg`.
 * El fallback se decide por la `src` actual, así que cuando la película cambia de
 * imagen (por ejemplo, después de subir un póster) se vuelve a intentar sola y no
 * queda un ciclo de reintentos si la imagen tampoco existe.
 */
export default function SafeImage({ src, alt, className, ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null)

  return (
    <img
      {...rest}
      className={className}
      src={resolveSafeImageSrc(src, failedSrc)}
      alt={alt}
      onError={() => setFailedSrc(src)}
    />
  )
}
