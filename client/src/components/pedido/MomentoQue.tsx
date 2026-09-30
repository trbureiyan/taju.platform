import { Input } from '../ui/Input'
import { TarjetaOpcion } from '../ui/TarjetaOpcion'
import { BotonWhatsApp } from '../shared/BotonWhatsApp'
import { AvisoErrores } from './AvisoErrores'
import { cantidadMinimaDe } from '../../lib/requisitos'
import { CLASE_TITULO, type PropsMomento } from './tipos'

export function MomentoQue({ producto, campos, errores, set, tituloRef }: PropsMomento) {
  const dimensiones = producto.categoria.dimensionesBase
  const personalizada = !campos.dimensionSeleccionada || campos.dimensionSeleccionada === 'personalizada'
  const minimo = cantidadMinimaDe(producto.precio)

  return (
    <div className="flex flex-col gap-6">
      <h2 ref={tituloRef} tabIndex={-1} className={CLASE_TITULO}>
        Qué necesitas
      </h2>
      <AvisoErrores errores={errores} />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-texto-principal">Medida</legend>
        {dimensiones.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {dimensiones.map((d) => (
              <TarjetaOpcion
                key={d.etiqueta}
                name="dimension"
                value={d.etiqueta}
                checked={campos.dimensionSeleccionada === d.etiqueta}
                onChange={(v) => set('dimensionSeleccionada', v)}
                titulo={d.etiqueta}
                descripcion={`${d.valor} ${d.unidad}`}
              />
            ))}
            <TarjetaOpcion
              name="dimension"
              value="personalizada"
              checked={campos.dimensionSeleccionada === 'personalizada'}
              onChange={(v) => set('dimensionSeleccionada', v)}
              titulo="Otra medida"
              descripcion="La escribes tú, en centímetros"
            />
          </div>
        )}
        {(personalizada || dimensiones.length === 0) && (
          <Input
            label="Valor en cm"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.5"
            placeholder="Ej: 25"
            value={campos.dimensionCustom}
            onChange={(e) => set('dimensionCustom', e.target.value)}
            error={errores.dimensionCustom}
            anunciarError={false}
          />
        )}
      </fieldset>

      <Input
        label="Cantidad"
        type="number"
        inputMode="numeric"
        min={minimo}
        step="1"
        hint={minimo > 1 ? `Este producto se pide desde ${minimo} unidades.` : undefined}
        value={campos.cantidad}
        onChange={(e) => set('cantidad', e.target.value)}
        error={errores.cantidad}
        anunciarError={false}
        className="tabular-nums"
      />
      <Input
        label="Colores"
        type="text"
        placeholder="Ej: dorado y blanco"
        hint="Indica los colores principales que quieres"
        value={campos.colores}
        onChange={(e) => set('colores', e.target.value)}
        error={errores.colores}
        anunciarError={false}
      />
      <Input
        label="Materiales"
        type="text"
        placeholder="Ej: acrílico 3mm, madera terciada"
        hint="Si no sabes qué material, describe el uso y te asesoramos"
        value={campos.materiales}
        onChange={(e) => set('materiales', e.target.value)}
        error={errores.materiales}
        anunciarError={false}
      />

      <BotonWhatsApp variante="linea" mensaje={`Hola, tengo una duda para pedir: ${producto.nombre}.`}>
        ¿Dudas? Escríbenos
      </BotonWhatsApp>
    </div>
  )
}
