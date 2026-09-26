import { useSyncExternalStore } from 'react'

/**
 * Suscribe un componente a una media query.
 * @param query - Media query CSS, ej. '(pointer: fine)'.
 * @returns true mientras la query coincida.
 */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const lista = window.matchMedia(query)
      lista.addEventListener('change', avisar)
      return () => lista.removeEventListener('change', avisar)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
