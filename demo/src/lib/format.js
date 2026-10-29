const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatScore(value) {
  const score = Number.parseFloat(value)
  return Number.isFinite(score) ? score.toFixed(1) : '—'
}

/**
 * Fecha legible en es-AR: "29 de octubre de 2026".
 * @param {string|null|undefined} isoDate
 * @returns {string}
 */
export function formatDate(isoDate) {
  const match = String(isoDate ?? '').match(ISO_DATE)
  if (!match) return ''

  const [, year, month, day] = match
  const monthName = MONTHS[Number(month) - 1]
  if (!monthName) return ''

  return `${Number(day)} de ${monthName} de ${year}`
}
