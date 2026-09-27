import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// sin globals de vitest, RTL no registra su cleanup automatico - el DOM de un test se filtraria al siguiente
afterEach(() => {
  cleanup()
})

// jsdom no trae matchMedia ni IntersectionObserver; motion y los hooks de medios los necesitan.
// Por defecto ninguna media query coincide: cada test que necesite una (reduced-motion, pointer fine) la fuerza.
export function simularMedios(coinciden: string[] = []) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: coinciden.includes(query),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
simularMedios()

class IntersectionObserverSimulado {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
  root = null
  rootMargin = ''
  thresholds = []
}
Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: IntersectionObserverSimulado })
