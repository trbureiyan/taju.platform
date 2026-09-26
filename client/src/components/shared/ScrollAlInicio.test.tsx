import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { ScrollAlInicio } from './ScrollAlInicio'

function Ir() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate('/b')}>ir</button>
      <button onClick={() => navigate(-1)}>atras</button>
    </>
  )
}

describe('ScrollAlInicio', () => {
  it('sube al navegar hacia adelante y respeta la posicion al volver atras', async () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo
    const { getByText } = render(
      <MemoryRouter initialEntries={['/a']}>
        <ScrollAlInicio />
        <Routes>
          <Route path="*" element={<Ir />} />
        </Routes>
      </MemoryRouter>,
    )
    scrollTo.mockClear()
    await userEvent.click(getByText('ir'))
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    scrollTo.mockClear()
    await userEvent.click(getByText('atras'))
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
