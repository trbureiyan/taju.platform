import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// sin globals de vitest, RTL no registra su cleanup automatico - el DOM de un test se filtraria al siguiente
afterEach(() => {
  cleanup()
})
