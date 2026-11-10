import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import LoginPage from './LoginPage.jsx'
import NotFoundPage from './NotFoundPage.jsx'
import { directors, genres } from '../data/catalog.js'
import { getStorage } from '../lib/comments.js'
import { addFilm, editFilm } from '../lib/films.js'
import { ACCEPTED_TYPES, dataUrlBytes, imageUrl } from '../lib/image.js'
import { prepareImage } from '../lib/imageFile.js'
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

const IMAGE_FIELDS = [
  { kind: 'poster', label: 'Póster (opcional)' },
  { kind: 'banner', label: 'Banner de la película (opcional)' },
]

/** Proporción de cada vista previa: el póster es 2:3 y el banner 16:9. */
const PREVIEW_SHAPE = {
  poster: 'aspect-2/3 w-22',
  banner: 'aspect-video w-44',
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
    <div className="flex min-w-0 flex-col gap-2">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            className="text-step-n1 font-semibold text-danger"
            id={errorId}
            {...fieldErrorMotion(reduced)}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Selector de imagen con vista previa. `picked` es `undefined` cuando no se tocó nada,
 * un `data:` URL cuando se eligió un archivo y `null` cuando se pidió volver a la estática.
 */
function ImageField({ label, kind, picked, stored, error, busy, reduced, onPick, onClear }) {
  const preview = typeof picked === 'string' ? picked : picked === null ? null : stored
  const canClear = typeof picked === 'string' || (picked === undefined && Boolean(stored))
  const meta =
    typeof picked === 'string' ? `${Math.max(1, Math.round(dataUrlBytes(picked) / 1024))} KB` : 'Guardada en este navegador'

  return (
    <Field label={label} error={error} reduced={reduced}>
      {(a11y) => (
        <div className="flex flex-col gap-3">
          <input
            className="w-full cursor-pointer rounded-md border border-dashed border-line-strong bg-surface px-[0.7rem] py-[0.55rem] text-step-n1 text-fg-dim hover:border-accent focus-visible:border-accent focus-visible:shadow-focus focus-visible:outline-none"
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            disabled={busy}
            onChange={(event) => onPick(event.target.files?.[0] ?? null)}
            {...a11y}
          />

          {preview && (
            <figure className="m-0 flex items-end gap-3">
              <img
                className={`block rounded-md border border-line-strong object-cover ${PREVIEW_SHAPE[kind]}`}
                src={preview}
                alt={`Vista previa de ${kind === 'poster' ? 'el póster' : 'el banner'}`}
              />
              <figcaption className="flex flex-col gap-1 text-step-n1 text-fg-mute">
                <span>{meta}</span>
                {canClear && (
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent p-0 text-left text-accent-text underline [font:inherit] focus-visible:shadow-focus focus-visible:outline-none"
                    onClick={onClear}
                  >
                    Volver a la imagen por defecto
                  </button>
                )}
              </figcaption>
            </figure>
          )}
        </div>
      )}
    </Field>
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
    return <NotFoundPage message="No hay ninguna película con ese id en el sitio." />
  }

  return <FilmForm key={filmId ?? 'new'} film={film} rawFilms={rawFilms} session={session} />
}

function FilmForm({ film, rawFilms, session }) {
  const reduced = useReducedMotion()
  const [values, setValues] = useState(() => (film ? toFormValues(film) : EMPTY))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [images, setImages] = useState({})
  const [imageErrors, setImageErrors] = useState({})
  const [busy, setBusy] = useState(false)

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
    const input = { ...values, poster: images.poster, banner: images.banner }
    const result = film
      ? editFilm(storage, rawFilms, session, film.id, input)
      : addFilm(storage, rawFilms, session, input)

    if (!result.ok) {
      setErrors(result.errors ?? {})
      setFormError(result.message ?? 'Revisá los campos marcados.')
      return
    }

    commitFilms(result.films)
    navigate(`/film/${result.film.id}`)
  }

  async function handlePick(kind, file) {
    if (!file) return
    setBusy(true)
    setImageErrors((current) => ({ ...current, [kind]: undefined }))
    setFormError('')

    const result = await prepareImage(file, kind)
    setBusy(false)
    if (!result.ok) {
      setImageErrors((current) => ({ ...current, [kind]: result.error }))
      return
    }
    setImages((current) => ({ ...current, [kind]: result.dataUrl }))
  }

  function handleClear(kind) {
    setImageErrors((current) => ({ ...current, [kind]: undefined }))
    setImages((current) => ({ ...current, [kind]: null }))
  }

  return (
    <section aria-labelledby="editor-title">
      <a
        className="mb-4 inline-block text-step-n1 font-semibold tracking-[0.04em] text-fg-dim no-underline hover:text-accent-text"
        href={backHref}
      >
        <span aria-hidden="true">← </span>
        {film ? 'Volver a la película' : 'Volver a las películas'}
      </a>

      <h1 id="editor-title" className="mb-4 text-step-3">
        {film ? 'Editar película' : 'Subir película'}
      </h1>

      <form
        className="mb-8 flex max-w-[40rem] flex-col gap-3"
        onSubmit={handleSubmit}
        noValidate
      >
        <p className="-mt-2 text-step-n1 text-fg-mute">
          Se guarda en este navegador, sin servidor. La imagen que elijas se achica antes de guardarse y queda
          con la película.
        </p>

        <Field label="Nombre de la película" error={errors.nombre} reduced={reduced}>
          {(a11y) => <input type="text" maxLength={120} {...a11y} {...bind('nombre')} />}
        </Field>

        <Field label="Sinopsis" error={errors.sinopsis} reduced={reduced}>
          {(a11y) => <textarea rows={4} maxLength={900} {...a11y} {...bind('sinopsis')} />}
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
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

        <div className="grid gap-3 sm:grid-cols-2">
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

        <div className="grid gap-3 sm:grid-cols-2">
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

        {IMAGE_FIELDS.map(({ kind, label }) => (
          <ImageField
            key={kind}
            kind={kind}
            label={label}
            picked={images[kind]}
            stored={film ? imageUrl(film, kind) : null}
            error={imageErrors[kind]}
            busy={busy}
            reduced={reduced}
            onPick={(file) => handlePick(kind, file)}
            onClear={() => handleClear(kind)}
          />
        ))}

        <motion.button
          className="btn self-start mt-1"
          type="submit"
          disabled={busy}
          {...pressMotion(reduced)}
        >
          {film ? 'Guardar cambios' : 'Subir película'}
        </motion.button>

        <div className="min-h-[1.5em] text-step-n1 font-semibold text-danger" role="alert">
          {formError}
        </div>
      </form>
    </section>
  )
}
