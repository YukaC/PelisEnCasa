import LoginForm from './LoginForm.jsx'
import { navigate } from '../lib/route.js'
import { useSession } from '../lib/useSession.js'

/**
 * Página de ingreso. `next` es la ruta a la que se vuelve después de entrar;
 * `notice` explica por qué se pidió el ingreso cuando alguien llegó a una ruta protegida.
 */
export default function LoginPage({ next = '/', notice, stay = false }) {
  const session = useSession()

  return (
    <section className="max-w-[34rem]" aria-labelledby="auth-title">
      <h1 id="auth-title" className="mb-4 text-step-3">
        Iniciar sesión
      </h1>

      {session ? (
        <>
          <p className="mb-4 text-fg-dim">
            Ya iniciaste sesión como <strong>{session.user}</strong>.
          </p>
          <a className="btn" href="#/">
            Ir a la cartelera
          </a>
        </>
      ) : (
        <>
          <p className="mb-4 text-fg-dim">
            {notice ??
              'Con sesión iniciada podés ver el catálogo completo, comentar, y subir, editar o borrar películas.'}
          </p>
          <LoginForm onSuccess={() => !stay && navigate(next)} />
        </>
      )}
    </section>
  )
}
