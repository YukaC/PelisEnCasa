import db from './db.json'
import { parseSeedDate } from '../lib/comments.js'

const genreNames = new Map(db.generos.map((genre) => [genre.id, genre.nombre]))
const directorNames = new Map(db.directores.map((director) => [director.id, director.nombre]))

function resolveName(table, id) {
  if (id === null || id === undefined) return null
  return table.get(id) ?? null
}

/** Semilla del catálogo y tablas del TP, tal cual están en `db.json`. */
export const seedFilms = db.peliculas
export const genres = db.generos
export const directors = db.directores

/**
 * Película con los ids de género/director resueltos a nombres, como hace la API del TP.
 * @param {object} film registro con la forma de `db.json`
 */
export function resolveFilm(film) {
  return {
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
  }
}

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

export function posterUrl(filmId) {
  return `/films/${filmId}.jpg`
}

export function bannerUrl(filmId) {
  return `/films/${filmId}-banner.jpg`
}

export const fallbackImageUrl = '/films/fallback.jpg'
