import db from './db.json'
import { collectOptions } from '../lib/search.js'
import { parseSeedDate } from '../lib/comments.js'

const genreNames = new Map(db.generos.map((genre) => [genre.id, genre.nombre]))
const directorNames = new Map(db.directores.map((director) => [director.id, director.nombre]))

function resolveName(table, id) {
  if (id === null || id === undefined) return null
  return table.get(id) ?? null
}

/**
 * Películas del TP con los ids de género/director ya resueltos a nombres.
 * Nada acá se inventa: todo sale de `db.json`.
 */
export const films = db.peliculas.map((film) => ({
  id: film.id,
  name: film.nombre,
  year: Number.parseInt(film.year, 10),
  duration: film.duracion,
  score: Number.parseFloat(film.score),
  synopsis: film.sinopsis,
  genres: [
    resolveName(genreNames, film.genero),
    resolveName(genreNames, film.genero2),
  ].filter(Boolean),
  directors: [
    resolveName(directorNames, film.director),
    resolveName(directorNames, film.director2),
  ].filter(Boolean),
}))

export const genreOptions = collectOptions(films, 'genres')
export const directorOptions = collectOptions(films, 'directors')

/** Comentarios semilla del TP, agrupados por película. */
export const seedCommentsByFilm = db.comentarios.reduce((grouped, comment) => {
  const filmId = String(comment.pelicula)
  const normalized = {
    id: `seed-${comment.id}`,
    author: comment.usuario,
    text: comment.texto,
    date: parseSeedDate(comment.hora) ?? '',
  }
  grouped[filmId] = [...(grouped[filmId] ?? []), normalized]
  return grouped
}, {})

export function getFilm(id) {
  return films.find((film) => film.id === Number(id)) ?? null
}

export function posterUrl(filmId) {
  return `/films/${filmId}.jpg`
}

export function bannerUrl(filmId) {
  return `/films/${filmId}-banner.jpg`
}

export const fallbackImageUrl = '/films/fallback.jpg'
