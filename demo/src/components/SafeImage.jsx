import { useState } from 'react'

/**
 * Imagen con fallback local: si el archivo no existe, cae en `films/fallback.jpg`.
 */
export default function SafeImage({ src, alt, className, ...rest }) {
  const [failed, setFailed] = useState(false)
  const resolved = failed ? '/films/fallback.jpg' : src

  return (
    <img
      {...rest}
      className={className}
      src={resolved}
      alt={alt}
      onError={() => setFailed(true)}
    />
  )
}
