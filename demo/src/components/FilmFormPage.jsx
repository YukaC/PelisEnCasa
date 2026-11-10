import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import LoginPage from './LoginPage.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import { directors, genres } from '../data/catalog.js'
import { getStorage } from '../lib/comments.js'
import { addFilm, editFilm } from '../lib/films.js'
import { fieldErrorMotion, pressMotion } from '../lib/motion.js'
import { navigate } from '../lib/route.js'
import { commitFilms, useCatalog } from '../lib/useCatalog.js'
import { useSession } from '../lib/useSession.js'

const EMPTY = {
  nombre: '',
  sinopsis: '',
  genero: '',
  genero2: '',
  director: '',
  director2: '',
  duracion: '',
  year: '',
  score: '',
}

function toFormValues(film) {
  return {
    nombre: film.nombre,
    sinopsis: film.sinopsis,
    genero: String(film.genero ?? ''),
    genero2: String(film.genero2 ?? ''),
    director: String(film.director ?? ''),
    director2: String(film.director2 ?? ''),
    duracion: film.duracion ?? '',
    year: String(film.year ?? ''),
    score: String(film.score ?? ''),
  }
}

/** Campo con etiqueta y error. `children` recibe los atributos que lo conectan con ambos. */
function Field({ label, error, reduced, children }) {
  const id = useId()
  const errorId = useId()

  return (
    <div className="form__row">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p className="form__error" id={errorId} {...fieldErrorMotion(reduced)}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Subir o editar una película: los mismos campos que el formulario del TP.
 * Sin sesión muestra el ingreso, igual que la API devolvía 401.
 */
export default function FilmFormPage({ filmId }) {
  const session = useSession()
  const { rawFilms, getRawFilm } = useCatalog()
  const isEdit = filmId !== undefined
  const film = isEdit ? getRawFilm(filmId) : null

  if (!session) {
    return (
      <LoginPage
        stay
        notice={
          isEdit
            ? 'Tenés que iniciar sesión para editar una película.'
            : 'Tenés que iniciar sesión para subir una película.'
        }
      />
    )
  }
  if (isEdit && !film) {
    return <NotFoundPage message="No hay ninguna película con ese id en la cartelera." />
  }

  return <FilmForm key={filmId ?? 'new'} film={film} rawFilms={rawFilms} session={session} />
}

function FilmForm({ film, rawFilms, session }) {
  const reduced = useReducedMotion()
  const [values, setValues] = useState(() => (film ? toFormValues(film) : EMPTY))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  const backHref = film ? `#/film/${film.id}` : '#/'

  function bind(name) {
    return {
      value: values[name],
      onChange: (event) => {
        setValues((current) => ({ ...current, [name]: event.target.value }))
        if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
      },
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const storage = getStorage()
    const result = film
      ? editFilm(storage, rawFilms, session, film.id, values)
      : addFilm(storage, rawFilms, session, values)

    if (!result.ok) {
      setErrors(result.errors ?? {})
      setFormError(result.message ?? 'Revisá los campos marcados.')
      return
    }

    commitFilms(result.films)
    navigate(`/film/${result.film.id}`)
  }

  return (
    <section className="editor" aria-labelledby="editor-title">
      <a className="backlink" href={backHref}>
        <span aria-hidden="true">← </span>
        {film ? 'Volver a la ficha' : 'Volver a la cartelera'}
      </a>

      <h1 id="editor-title">{film ? 'Editar película' : 'Subir película'}</h1>

      <form className="form form--film" onSubmit={handleSubmit} noValidate>
        <p className="form__hint">
          Se guarda en este navegador. La portada usa la imagen por defecto, como en el TP.
        </p>

        <Field label="Nombre de la película" error={errors.nombre} reduced={reduced}>
          {(a11y) => <input type="text" maxLength={120} {...a11y} {...bind('nombre')} />}
        </Field>

        <Field label="Sinopsis" error={errors.sinopsis} reduced={reduced}>
          {(a11y) => <textarea rows={4} maxLength={900} {...a11y} {...bind('sinopsis')} />}
        </Field>

        <div className="form__pair">
          <Field label="Primer género" error={errors.genero} reduced={reduced}>
            {(a11y) => (
              <select {...a11y} {...bind('genero')}>
                <option value="">Elegí un género</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.nombre}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Segundo género" error={errors.genero2} reduced={reduced}>
            {(a11y) => (
              <select {...a11y} {...bind('genero2')}>
                <option value="">Elegí un género</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.nombre}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <div className="form__pair">
          <Field label="Primer director" error={errors.director} reduced={reduced}>
            {(a11y) => (
              <select {...a11y} {...bind('director')}>
                <option value="">Elegí un director</option>
                {directors.map((director) => (
                  <option key={director.id} value={director.id}>
                    {director.nombre}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Segundo director (opcional)" error={errors.director2} reduced={reduced}>
            {(a11y) => (
              <select {...a11y} {...bind('director2')}>
                <option value="">Ninguno</option>
                {directors.map((director) => (
                  <option key={director.id} value={director.id}>
                    {director.nombre}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <div className="form__pair">
          <Field label="Duración" error={errors.duracion} reduced={reduced}>
            {(a11y) => (
              <input type="text" placeholder="2h 11m" maxLength={20} {...a11y} {...bind('duracion')} />
            )}
          </Field>

          <Field label="Año" error={errors.year} reduced={reduced}>
            {(a11y) => (
              <input type="text" inputMode="numeric" maxLength={4} {...a11y} {...bind('year')} />
            )}
          </Field>
        </div>

        <Field label="Puntuación (0 a 10)" error={errors.score} reduced={reduced}>
          {(a11y) => (
            <input type="text" inputMode="decimal" maxLength={4} {...a11y} {...bind('score')} />
          )}
        </Field>

        <motion.button className="button" type="submit" {...pressMotion(reduced)}>
          {film ? 'Guardar cambios' : 'Subir película'}
        </motion.button>

        <div className="form__status form__status--error" role="alert">
          {formError}
        </div>
      </form>
    </section>
  )
}
