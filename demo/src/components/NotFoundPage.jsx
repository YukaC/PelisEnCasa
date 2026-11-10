export default function NotFoundPage({ message }) {
  return (
    <section
      className="flex max-w-[34rem] flex-col items-start gap-4 py-8"
      aria-labelledby="not-found-title"
    >
      <p className="kicker">Fuera de cartel</p>
      <h1 id="not-found-title" className="text-step-3">
        No encontramos esa página
      </h1>
      <p className="text-fg-dim">{message}</p>
      <a className="btn" href="#/">
        Ir a la cartelera
      </a>
    </section>
  )
}
