import { HeroMesa } from '../components/vitrina/HeroMesa'
import { Cinta } from '../components/vitrina/Cinta'
import { EscenarioFamilias } from '../components/vitrina/EscenarioFamilias'
import { Manifiesto } from '../components/vitrina/Manifiesto'
import { FranjaVolumen } from '../components/vitrina/FranjaVolumen'
import { FrasesQueCompletan } from '../components/vitrina/FrasesQueCompletan'

// ningun bloque pide datos a la API: la Vitrina pinta completa mientras useDespertarServidor levanta a Render
export function VitrinaPage() {
  return (
    <>
      <HeroMesa />
      <Cinta />
      <EscenarioFamilias />
      <Manifiesto />
      <FranjaVolumen />
      <FrasesQueCompletan />
    </>
  )
}
