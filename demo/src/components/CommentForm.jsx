import { useId, useState } from 'react'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react'
import { addCommentToStore, getStorage } from '../lib/comments.js'
import { SHAKE_STEPS, SPRINGS, fieldErrorMotion, pressMotion, statusMotion } from '../lib/motion.js'

export default function CommentForm({ filmId, onSaved }) {
  const nameId = useId()
  const textId = useId()
  const nameErrorId = useId()
  const textErrorId = useId()

  const reduced = useReducedMotion()
  const [scope, animate] = useAnimate()

  const [name, setName] = useState('')
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

    const result = addCommentToStore(getStorage(), filmId, { name, text })

    if (!result.ok) {
      setErrors(result.errors)
      setStatus('')
      void shakeForm()
      return
    }

    setErrors({})
    setName('')
    setText('')
    setStatus('Comentario publicado. Ya aparece en la lista.')
    onSaved(result.store)
  }

  return (
    <motion.form className="form" onSubmit={handleSubmit} noValidate ref={scope}>
      <h3 className="form__title">Dejá tu comentario</h3>
      <p className="form__hint">Se guarda en este navegador, no se envía a ningún servidor.</p>

      <div className="form__row">
        <label className="field__label" htmlFor={nameId}>
          Tu nombre
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          autoComplete="name"
          maxLength={60}
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={errors.name ? nameErrorId : undefined}
          onChange={(event) => {
            setName(event.target.value)
            if (errors.name) setErrors((current) => ({ ...current, name: undefined }))
          }}
        />
        <AnimatePresence initial={false}>
          {errors.name && (
            <motion.p className="form__error" id={nameErrorId} {...errorMotion}>
              {errors.name}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="form__row">
        <label className="field__label" htmlFor={textId}>
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

      <motion.button className="button" type="submit" {...pressMotion(reduced)}>
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
