import { Eye, EyeOff } from 'lucide-react'

/**
 * Alterna la contraseña entre oculta y visible. Se pasa como `accion` del `Input`.
 * @prop visible - Si la contraseña se está mostrando; define el nombre accesible ("Mostrar" u "Ocultar contraseña").
 * @prop alAlternar - Se llama al pulsar el botón; quien lo usa cambia el tipo del campo.
 */
export function BotonVerContrasena({ visible, alAlternar }: { visible: boolean; alAlternar: () => void }) {
  return (
    <button
      type="button"
      onClick={alAlternar}
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      className="inline-flex aspect-square min-h-boton min-w-boton items-center justify-center rounded-campo text-texto-secundario outline-none transition-transform duration-normal ease-estandar hover:text-texto-principal focus-visible:shadow-foco active:scale-97"
    >
      {visible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
    </button>
  )
}
