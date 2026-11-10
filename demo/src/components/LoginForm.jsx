import { useId, useState } from 'react'
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react'
import { getStorage } from '../lib/comments.js'
import { DEMO_ACCOUNT, DEMO_ACCOUNTS, signIn } from '../lib/session.js'
import { SHAKE_STEPS, SPRINGS, fieldErrorMotion, pressMotion } from '../lib/motion.js'

/**
 * Ingreso simulado: no hay backend. La primera cuenta del TP viene cargada para que
 * quien mira la demo entre con un clic, y se puede editar para ver el rechazo.
 */
export default function LoginForm({ onSuccess }) {
  const userId = useId()
  const passwordId = useId()
  const userErrorId = useId()
  const passwordErrorId = useId()
  const formErrorId = useId()

  const reduced = useReducedMotion()
  const [scope, animate] = useAnimate()

  const [user, setUser] = useState(DEMO_ACCOUNT.user)
  const [password, setPassword] = useState(DEMO_ACCOUNT.password)
  const [errors, setErrors] = useState({})

  const errorMotion = fieldErrorMotion(reduced)

  async function shakeForm() {
    if (reduced || !scope.current) return
    try {
      for (const x of SHAKE_STEPS) {
        await animate(scope.current, { x }, SPRINGS.shake)
      }
      await animate(scope.current, { x: 0 }, { duration: 0 })
    } catch {
      // el formulario se desmontó a mitad del shake: no hay nada que corregir
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = signIn(getStorage(), { user, password })
    if (result.ok) {
      onSuccess?.(result.session)
      return
    }

    setErrors(result.errors)
    void shakeForm()
  }

  function clearError(field) {
    if (errors[field] || errors.form) {
      setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
    }
  }

  return (
    <motion.form className="form" onSubmit={handleSubmit} noValidate ref={scope}>
      <p className="form__hint">
        Ingreso simulado, sin backend: vienen las dos cuentas del TP ({DEMO_ACCOUNT.user}/{DEMO_ACCOUNT.password} y{' '}
        {DEMO_ACCOUNTS[1].user}/{DEMO_ACCOUNTS[1].password}). Nada sale de este navegador.
      </p>

      <div className="form__row">
        <label className="field-label" htmlFor={userId}>
          Usuario
        </label>
        <input
          id={userId}
          type="text"
          value={user}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={60}
          aria-invalid={errors.user || errors.form ? 'true' : undefined}
          aria-describedby={errors.user ? userErrorId : errors.form ? formErrorId : undefined}
          onChange={(event) => {
            setUser(event.target.value)
            clearError('user')
          }}
        />
        <AnimatePresence initial={false}>
          {errors.user && (
            <motion.p className="form__error" id={userErrorId} {...errorMotion}>
              {errors.user}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="form__row">
        <label className="field-label" htmlFor={passwordId}>
          Contraseña
        </label>
        <input
          id={passwordId}
          type="password"
          value={password}
          autoComplete="current-password"
          maxLength={60}
          aria-invalid={errors.password || errors.form ? 'true' : undefined}
          aria-describedby={
            errors.password ? passwordErrorId : errors.form ? formErrorId : undefined
          }
          onChange={(event) => {
            setPassword(event.target.value)
            clearError('password')
          }}
        />
        <AnimatePresence initial={false}>
          {errors.password && (
            <motion.p className="form__error" id={passwordErrorId} {...errorMotion}>
              {errors.password}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <motion.button className="btn" type="submit" {...pressMotion(reduced)}>
        Iniciar sesión
      </motion.button>

      <div className="form__status form__status--error" role="alert">
        <AnimatePresence initial={false}>
          {errors.form && (
            <motion.span id={formErrorId} {...errorMotion}>
              {errors.form}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.form>
  )
}
