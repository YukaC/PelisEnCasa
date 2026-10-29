export default function NotFoundPage({ message }) {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <p className="kicker">Fuera de cartel</p>
      <h1 id="not-found-title">No encontramos esa página</h1>
      <p className="not-found__text">{message}</p>
      <a className="button" href="#/">
        Ir a la cartelera
      </a>
    </section>
  )
}
