import { Check } from 'lucide-react'
import type { Familia } from '../../types'
import { contenidoDe } from '../vitrina/contenido'

/**
 * Lo que vamos a pedir en el formulario para esta familia: enseñar antes de vender, justo antes del pedido.
 * @prop familia - Familia del producto.
 */
export function AntesDePedir({ familia }: { familia: Familia }) {
  return (
    <section aria-label="Antes de pedir" className="rounded-tarjeta bg-contexto-suave text-contexto-texto p-6 flex flex-col gap-3">
      <h2 className="font-semibold">Antes de pedir, ten a mano</h2>
      <ul className="flex flex-col gap-2">
        {contenidoDe(familia).necesitamos.map((dato) => (
          <li key={dato} className="flex items-start gap-2 text-sm">
            <Check aria-hidden="true" size={18} className="shrink-0" />
            {dato}
          </li>
        ))}
      </ul>
    </section>
  )
}
