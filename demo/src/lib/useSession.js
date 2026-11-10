import { useSyncExternalStore } from 'react'
import { getStorage } from './comments.js'
import { SESSION_KEY, getSession, subscribe, syncSession } from './session.js'

function subscribeWithStorage(listener) {
  const unsubscribe = subscribe(listener)
  const onStorage = (event) => {
    if (event.key === null || event.key === SESSION_KEY) syncSession(getStorage())
  }
  window.addEventListener('storage', onStorage)
  return () => {
    unsubscribe()
    window.removeEventListener('storage', onStorage)
  }
}

const getSnapshot = () => getSession(getStorage())

/**
 * Sesión simulada de la demo. Header y ficha leen la misma, y se enteran juntos
 * cuando se abre o se cierra, también desde otra pestaña.
 * @returns {{ user: string } | null}
 */
export function useSession() {
  return useSyncExternalStore(subscribeWithStorage, getSnapshot, () => null)
}
