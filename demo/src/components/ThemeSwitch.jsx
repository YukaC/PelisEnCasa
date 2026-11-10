import { motion, useReducedMotion } from 'motion/react'
import { SPRINGS } from '../lib/motion.js'
import { useTheme } from '../lib/useTheme.js'

/** Recorrido de la perilla dentro de la pista (px). */
const KNOB_TRAVEL = 24

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
      <path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a.5.5 0 0 0-.7-.6 6.5 6.5 0 1 0 9 9 .5.5 0 0 0-.6-.7Z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="2.6" fill="currentColor" stroke="none" />
      <path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1" />
    </svg>
  )
}

/** Switch de tema de la marquesina: encendido es oscuro, apagado es claro. */
export default function ThemeSwitch() {
  const reduced = useReducedMotion()
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Tema oscuro"
      title={dark ? 'Pasar a tema claro' : 'Pasar a tema oscuro'}
      onClick={toggleTheme}
      className="relative inline-flex h-7 w-12 flex-none cursor-pointer items-center rounded-full border border-line-strong bg-raised hover:border-accent"
    >
      <motion.span
        className="absolute left-0.5 grid size-5 place-items-center rounded-full bg-accent text-on-accent"
        initial={false}
        animate={{ x: dark ? KNOB_TRAVEL : 0 }}
        transition={reduced ? { duration: 0 } : SPRINGS.tap}
      >
        {dark ? <MoonIcon /> : <SunIcon />}
      </motion.span>
    </button>
  )
}
