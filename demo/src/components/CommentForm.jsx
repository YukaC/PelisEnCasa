import { useId, useState } from 'react'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react'
import { addCommentToStore, getStorage } from '../lib/comments.js'
import { SHAKE_STEPS, SPRINGS, fieldErrorMotion, pressMotion, statusMotion } from '../lib/motion.js'

/**
 * Formulario de reseña. Sólo se monta con sesión abierta: el autor es el usuario
 * de la sesión, no un campo libre.
 */
export default function CommentForm({ filmId, author, onSaved }) {
  const textId = useId()
  const textErrorId = useId()

  const reduced = useReducedMotion()
  const [scope, animate] = useAnimate()

  const [text, setText] = useState('')
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')

  const errorMotion = fieldErrorMotion(reduced)

  /** Shake corto: una pasada de springs, sin loop infinito. */
  async function shakeForm() {
    if (reduced || !scope.current) return
    try {
      for (const x of SHAKE_STEPS) {
        await animate(scope.current, { x }, SPRINGS.shake)
      }
      // Un spring frena asintóticamente: este paso deja el transform en `none`.
      await animate(scope.current, { x: 0 }, { duration: 0 })
    } catch {
      // el formulario se desmontó a mitad del shake: no hay nada que corregir
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const result = addCommentToStore(getStorage(), filmId, { name: author, text })

    if (!result.ok) {
      setErrors(result.errors)
      setStatus('')
      void shakeForm()
      return
    }

    setErrors({})
    setText('')
    setStatus('Comentario publicado. Ya aparece en la lista.')
    onSaved(result.store)
  }

  return (
    <motion.form className="form" onSubmit={handleSubmit} noValidate ref={scope}>
      <h3 className="form__title">Dejá tu comentario</h3>
      <p className="form__hint">
        Comentás como <strong>{author}</strong>. Se guarda en este navegador, no se envía a ningún
        servidor.
      </p>

      <div className="form__row">
        <label className="field-label" htmlFor={textId}>
          Comentario
        </label>
        <textarea
          id={textId}
          rows={3}
          value={text}
          maxLength={600}
          aria-invalid={errors.text ? 'true' : undefined}
          aria-describedby={errors.text ? textErrorId : undefined}
          onChange={(event) => {
            setText(event.target.value)
            if (errors.text) setErrors((current) => ({ ...current, text: undefined }))
          }}
        />
        <AnimatePresence initial={false}>
          {errors.text && (
            <motion.p className="form__error" id={textErrorId} {...errorMotion}>
              {errors.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <motion.button className="btn" type="submit" {...pressMotion(reduced)}>
        Publicar comentario
      </motion.button>

      <div className="form__status" role="status" aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          {status && (
            <motion.span key={status} {...statusMotion(reduced)}>
              {status}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.form>
  )
}
