// puente entre los tokens CSS (.docs/branding/04-tokens-de-diseno.md) y las clases de tailwind.
// todo aqui apunta a un var(--...) semantico - los componentes nunca deberian tocar la paleta cruda
export default {
  theme: {
    extend: {
      colors: {
        superficie: {
          base: 'var(--superficie-base)',
          calida: 'var(--superficie-calida)',
          fria: 'var(--superficie-fria)',
          elevada: 'var(--superficie-elevada)',
          hundida: 'var(--superficie-hundida)',
        },
        texto: {
          principal: 'var(--texto-principal)',
          secundario: 'var(--texto-secundario)',
          tenue: 'var(--texto-tenue)',
          acento: 'var(--texto-sobre-acento)',
          deshabilitado: 'var(--texto-deshabilitado)',
        },
        accion: {
          DEFAULT: 'var(--accion-fondo)',
          hover: 'var(--accion-fondo-hover)',
          activo: 'var(--accion-fondo-hover)',
          texto: 'var(--accion-texto)',
        },
        'accion-sec': {
          fondo: 'var(--accion-sec-fondo)',
          borde: 'var(--accion-sec-borde)',
          texto: 'var(--accion-sec-texto)',
        },
        contexto: {
          DEFAULT: 'var(--contexto-fondo)',
          suave: 'var(--contexto-fondo-suave)',
          texto: 'var(--contexto-texto)',
        },
        acento: 'var(--acento-fondo)',
        borde: {
          sutil: 'var(--borde-sutil)',
          medio: 'var(--borde-medio)',
          fuerte: 'var(--borde-fuerte)',
          defecto: 'var(--campo-borde)',
          activo: 'var(--campo-borde-foco)',
        },
        campo: {
          fondo: 'var(--campo-fondo)',
          borde: 'var(--campo-borde)',
          texto: 'var(--campo-texto)',
          marcador: 'var(--campo-marcador)',
          etiqueta: 'var(--campo-etiqueta)',
          ayuda: 'var(--campo-ayuda)',
        },
        exito: {
          fondo: 'var(--estado-exito-fondo)',
          texto: 'var(--estado-exito-texto)',
          borde: 'var(--estado-exito-texto)', // reutiliza el tono oscuro del grupo para el borde
        },
        error: {
          fondo: 'var(--estado-error-fondo)',
          texto: 'var(--estado-error-texto)',
          borde: 'var(--campo-borde-error)',
        },
        aviso: {
          fondo: 'var(--estado-aviso-fondo)',
          texto: 'var(--estado-aviso-texto)',
          borde: 'var(--estado-aviso-texto)',
        },
        info: {
          fondo: 'var(--estado-info-fondo)',
          texto: 'var(--estado-info-texto)',
          borde: 'var(--estado-info-texto)',
        },
        pedido: {
          recibido: {
            fondo: 'var(--pedido-recibido-fondo)',
            texto: 'var(--pedido-recibido-texto)',
          },
          revision: {
            fondo: 'var(--pedido-revision-fondo)',
            texto: 'var(--pedido-revision-texto)',
          },
          confirmado: {
            fondo: 'var(--pedido-confirmado-fondo)',
            texto: 'var(--pedido-confirmado-texto)',
          },
          produccion: {
            fondo: 'var(--pedido-produccion-fondo)',
            texto: 'var(--pedido-produccion-texto)',
          },
          listo: {
            fondo: 'var(--pedido-listo-fondo)',
            texto: 'var(--pedido-listo-texto)',
          },
          entregado: {
            fondo: 'var(--pedido-entregado-fondo)',
            texto: 'var(--pedido-entregado-texto)',
          },
        },
      },
      fontFamily: {
        // var() funciona aqui porque no es una @media condition — Tailwind emite font-family: var(--fuente-base)
        sans: ['var(--fuente-base)'],
        mono: ['var(--fuente-mono)'],
      },
      fontSize: {
        xs:      ['var(--texto-xs)',      { lineHeight: 'var(--interlineado-interfaz)' }],
        sm:      ['var(--texto-sm)',      { lineHeight: 'var(--interlineado-interfaz)' }],
        base:    ['var(--texto-base)',    { lineHeight: 'var(--interlineado-texto)'    }],
        lg:      ['var(--texto-lg)',      { lineHeight: 'var(--interlineado-texto)'    }],
        h3:      ['var(--texto-h3)',      { lineHeight: 'var(--interlineado-apretado)' }],
        h2:      ['var(--texto-h2)',      { lineHeight: 'var(--interlineado-apretado)' }],
        h1:      ['var(--texto-h1)',      { lineHeight: 'var(--interlineado-apretado)' }],
        display: ['var(--texto-display)', { lineHeight: 'var(--interlineado-apretado)' }],
      },
      // escala base 4 nada mas - si falta un numero es a proposito, no se agregan valores arbitrarios
      spacing: {
        1: 'var(--space-1)', 2: 'var(--space-2)', 3: 'var(--space-3)',
        4: 'var(--space-4)', 6: 'var(--space-6)', 8: 'var(--space-8)',
        12: 'var(--space-12)', 16: 'var(--space-16)', 24: 'var(--space-24)',
      },
      height: {
        boton: 'var(--boton-alto)',
      },
      minHeight: {
        boton: 'var(--boton-alto)',
      },
      padding: {
        'boton-x': 'var(--boton-padding-x)',
      },
      borderRadius: {
        sm: 'var(--radio-sm)',
        md: 'var(--radio-md)',
        lg: 'var(--radio-lg)',
        full: 'var(--radio-full)',
        campo: 'var(--radio-sm)',
        boton: 'var(--radio-sm)',
        tarjeta: 'var(--radio-md)',
      },
      boxShadow: {
        sm: 'var(--sombra-sm)',
        md: 'var(--sombra-md)',
        lg: 'var(--sombra-lg)',
        foco: 'var(--sombra-foco)',
        tarjeta: 'var(--sombra-sm)',
        'tarjeta-hover': 'var(--sombra-md)',
      },
      maxWidth: { prosa: 'var(--medida-linea)', contenedor: 'var(--ancho-maximo)' },
      transitionDuration: {
        rapida: 'var(--duracion-rapida)',
        normal: 'var(--duracion-normal)',
        lenta: 'var(--duracion-lenta)',
      },
      // [DECISION] los breakpoints quedan como numeros literales, no var(--bp-*): una @media condition se evalua
      // antes de que el CSS custom property exista, asi que Tailwind no puede leer el token aqui. Si cambia
      // --bp-* en tokens.css hay que cambiar este bloque a mano - son los mismos 4 valores en los dos archivos.
      screens: {
        sm: '480px', md: '768px', lg: '1024px', xl: '1280px',
      },
      // z-index si acepta var() porque no participa de un @media - referencia el token en vez de duplicar el numero
      zIndex: {
        base: 'var(--z-base)',
        elevado: 'var(--z-elevado)',
        encabezado: 'var(--z-encabezado)',
        superposicion: 'var(--z-superposicion)',
        modal: 'var(--z-modal)',
        aviso: 'var(--z-aviso)',
      },
    },
  },
  plugins: [],
}
