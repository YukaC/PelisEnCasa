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
    setStatus('Reseña publicada. Ya aparece en la lista.')
    onSaved(result.store)
  }

  return (
    <motion.form
      className="mb-8 flex max-w-[34rem] flex-col gap-3"
      onSubmit={handleSubmit}
      noValidate
      ref={scope}
    >
      <h3 className="text-step-2">Dejá tu reseña</h3>
      <p className="-mt-2 text-step-n1 text-fg-mute">
        Reseñás como <strong className="text-fg">{author}</strong>. La demo guarda tu reseña en
        este navegador, no en un servidor.
      </p>

      <div className="flex min-w-0 flex-col gap-2">
        <label className="field-label" htmlFor={textId}>
          Tu reseña
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
            <motion.p
              className="text-step-n1 font-semibold text-danger"
              id={textErrorId}
              {...errorMotion}
            >
              {errors.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <motion.button className="btn self-start mt-1" type="submit" {...pressMotion(reduced)}>
        Publicar reseña
      </motion.button>

      <div
        className="min-h-[1.5em] text-step-n1 font-semibold text-accent-text"
        role="status"
        aria-live="polite"
      >
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
