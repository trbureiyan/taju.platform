import { Check } from 'lucide-react'

/**
 * Opcion seleccionable en forma de tarjeta, para elegir entre pocas alternativas (entrega, medidas sugeridas).
 * Por debajo es un radio real: teclado, foco y lectores de pantalla funcionan como en cualquier grupo de radios.
 * @prop name - Nombre del grupo de radios.
 * @prop value - Valor que se reporta al elegirla.
 * @prop checked - Si es la opcion elegida (componente controlado).
 * @prop onChange - Recibe `value` al elegirla.
 * @prop titulo - Texto principal; es el nombre accesible del radio.
 * @prop descripcion - Texto de apoyo opcional bajo el titulo.
 */
interface TarjetaOpcionProps {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  titulo: string
  descripcion?: string
  disabled?: boolean
}

export function TarjetaOpcion({ name, value, checked, onChange, titulo, descripcion, disabled }: TarjetaOpcionProps) {
  return (
    <label className={['relative block', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'].join(' ')}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <span
        className={[
          'flex min-h-boton items-center gap-3 rounded-lg border-2 p-4',
          'transition-[border-color,background-color,transform] duration-normal ease-estandar active:scale-97',
          'peer-focus-visible:shadow-foco',
          checked ? 'border-accion bg-superficie-calida' : 'border-borde-medio bg-campo-fondo hover:border-borde-fuerte',
        ].join(' ')}
      >
        <span className="flex-1">
          <span className="block text-base font-medium text-texto-principal">{titulo}</span>
          {descripcion && <span className="block text-sm text-texto-secundario">{descripcion}</span>}
        </span>
        {/* la marca es un icono, no solo el color del borde */}
        <span
          aria-hidden="true"
          className={[
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
            checked ? 'bg-accion text-accion-texto' : 'border-2 border-borde-medio',
          ].join(' ')}
        >
          {checked && <Check size={16} />}
        </span>
      </span>
    </label>
  )
}
