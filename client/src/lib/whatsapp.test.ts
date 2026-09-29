import { describe, it, expect } from 'vitest'
import { enlaceWhatsAppA } from './whatsapp'

describe('enlaceWhatsAppA', () => {
  it('apunta al celular del cliente con el indicativo de Colombia y el mensaje codificado', () => {
    expect(enlaceWhatsAppA('3192452842', 'Hola & adiós')).toBe('https://wa.me/573192452842?text=Hola%20%26%20adi%C3%B3s')
  })
})
