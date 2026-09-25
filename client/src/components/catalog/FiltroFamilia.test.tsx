import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FiltroFamilia } from './FiltroFamilia'
import { ETIQUETAS_FAMILIA, FAMILIAS } from '../../types'

describe('FiltroFamilia', () => {
  it('renderiza "Todos" mas las cuatro familias en ese orden', () => {
    render(<FiltroFamilia seleccionada={null} onChange={() => {}} />)
    const nombres = screen.getAllByRole('button').map((b) => b.textContent)
    expect(nombres).toEqual(['Todos', 'Toppers', 'Superficies', 'Señalética', 'Papelería'])
  })

  it.each(FAMILIAS)('click en %s llama a onChange con esa familia', async (familia) => {
    const onChange = vi.fn()
    render(<FiltroFamilia seleccionada={null} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: ETIQUETAS_FAMILIA[familia] }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(familia)
  })

  it('click en "Todos" llama a onChange(null)', async () => {
    const onChange = vi.fn()
    render(<FiltroFamilia seleccionada="toppers" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null)
  })

  it('aria-pressed marca solo la familia seleccionada', () => {
    render(<FiltroFamilia seleccionada="superficies" onChange={() => {}} />)
    for (const boton of screen.getAllByRole('button')) {
      const esperado = boton.textContent === 'Superficies' ? 'true' : 'false'
      expect(boton).toHaveAttribute('aria-pressed', esperado)
    }
  })

  it('aria-pressed marca "Todos" cuando no hay familia elegida', () => {
    render(<FiltroFamilia seleccionada={null} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Toppers' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('agrupa los botones en una navegacion con nombre accesible', () => {
    render(<FiltroFamilia seleccionada={null} onChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: 'Filtrar por familia' })).toBeInTheDocument()
  })
})
