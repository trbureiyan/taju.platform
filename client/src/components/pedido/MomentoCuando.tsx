import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { TarjetaOpcion } from '../ui/TarjetaOpcion'
import { BotonWhatsApp } from '../shared/BotonWhatsApp'
import { AvisoErrores } from './AvisoErrores'
import { TiraDias } from './TiraDias'
import { horaEnPalabras, horasDeEntrega } from '../../lib/horario'
import { CLASE_TITULO, type PropsMomento } from './tipos'

export function MomentoCuando({ producto, campos, errores, set, tituloRef, intento }: PropsMomento) {
  // las horas son las del dia elegido; sin un dia con servicio no hay horas que ofrecer
  const horas = horasDeEntrega(campos.fechaDeseada)
  // si el dia cambia y la hora ya no existe (el sabado cierra antes), el select vuelve a "Elige una hora"
  const horaVigente = horas.includes(Number(campos.horaDeseada.slice(0, 2))) ? campos.horaDeseada : ''

  // una hora guardada que el nuevo dia no ofrece se borra: el select, la hoja de resumen y la validacion deben coincidir
  function cambiarDia(fecha: string) {
    set('fechaDeseada', fecha)
    if (campos.horaDeseada && !horasDeEntrega(fecha).includes(Number(campos.horaDeseada.slice(0, 2)))) {
      set('horaDeseada', '')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 ref={tituloRef} tabIndex={-1} className={CLASE_TITULO}>
        Cuándo y dónde
      </h2>
      <AvisoErrores key={intento} errores={errores} />

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-texto-principal">Cómo recibes tu pedido</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TarjetaOpcion
            name="entrega"
            value="recoger"
            checked={campos.entregaMetodo === 'recoger'}
            onChange={(v) => set('entregaMetodo', v)}
            titulo="Lo recojo en el taller"
          />
          <TarjetaOpcion
            name="entrega"
            value="domicilio"
            checked={campos.entregaMetodo === 'domicilio'}
            onChange={(v) => set('entregaMetodo', v)}
            titulo="A domicilio"
          />
        </div>
        {campos.entregaMetodo === 'domicilio' && (
          <Input
            label="Ciudad, barrio o dirección"
            type="text"
            autoComplete="street-address"
            maxLength={200}
            hint="Si es fuera de Neiva, escribe también la ciudad. Puedes dejarlo para después: la dirección exacta y el valor del domicilio los confirmamos contigo antes de fijar la fecha."
            value={campos.entregaDetalle}
            onChange={(e) => set('entregaDetalle', e.target.value)}
            anunciarError={false}
          />
        )}
      </fieldset>

      <TiraDias valor={campos.fechaDeseada} onCambio={cambiarDia} error={errores.fechaDeseada} />

      <Select
        label="Hora en que la necesitas"
        value={horaVigente}
        onChange={(e) => set('horaDeseada', e.target.value)}
        disabled={horas.length === 0}
        hint={horas.length === 0 ? 'Elige primero el día y aquí verás las horas disponibles.' : undefined}
        error={errores.horaDeseada}
        anunciarError={false}
      >
        <option value="">Elige una hora</option>
        {horas.map((h) => (
          <option key={h} value={`${String(h).padStart(2, '0')}:00`}>
            {horaEnPalabras(h)}
          </option>
        ))}
      </Select>

      <Input
        label="Tu celular"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="Ej: 319 245 2842"
        hint="Es el número por el que te escribimos para confirmar precio, fecha y anticipo."
        value={campos.telefono}
        onChange={(e) => set('telefono', e.target.value)}
        error={errores.telefono}
        anunciarError={false}
      />

      <BotonWhatsApp variante="linea" mensaje={`Hola, tengo una duda sobre la entrega de: ${producto.nombre}.`}>
        ¿Dudas? Escríbenos
      </BotonWhatsApp>
    </div>
  )
}
