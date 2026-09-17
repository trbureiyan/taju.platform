---
documento: Tokens de Diseño
marca: TaJú
version: 1.0
estado: listo para implementación
fecha: 2026-09-17
autor: Equipo Proyecto Integrador II, Universidad Surcolombiana
alcance: Traducción ejecutable del sistema visual. Deriva de 02-pautas-de-marca.md.
implementacion: CSS custom properties como fuente única. Tailwind consume las variables, no las duplica.
documentos_relacionados:
  - 01-identidad-de-marca.md
  - 02-pautas-de-marca.md
  - 03-voz-de-marca.md
---

# Tokens de Diseño — TaJú

## 0. Arquitectura del sistema

El sistema opera en dos capas y esa separación es la decisión técnica más importante de este documento.

La **capa primitiva** contiene los valores crudos. Son los colores de la marca, los números de la escala de espaciado, los tamaños de fuente. No tienen significado, solo valor. Se nombran por lo que son: `--color-amarillo-500`, `--space-4`.

La **capa semántica** contiene los roles. Son referencias a primitivas, nombradas por su función en la interfaz: `--color-accion-fondo`, `--color-texto-principal`. Nunca contienen un valor literal, siempre apuntan a una primitiva.

La razón de esta separación es que los componentes consumen exclusivamente la capa semántica. Un botón nunca dice "usa amarillo", dice "usa el color de acción". Eso permite que un cambio de marca, un modo oscuro o un ajuste de accesibilidad se resuelvan reasignando referencias en un solo archivo, sin tocar un solo componente. Si un componente consume una primitiva directamente, el sistema está roto en ese punto.

**Regla de oro.** Ningún valor literal aparece en el código de un componente. Ni un hex, ni un píxel de espaciado, ni un tamaño de fuente. Si necesitas un valor que no existe como token, el problema no es el token que falta, es la decisión de diseño que se salió del sistema.

---

## 1. Capa primitiva

### 1.1 Color de marca

```css
:root {
  /* Amarillo TaJú */
  --amarillo-100: #FDF8E7;
  --amarillo-300: #FAE79E;
  --amarillo-500: #F5D447;  /* Primario de marca */
  --amarillo-700: #BD9E27;  /* Oro, sombra del primario */
  --amarillo-900: #A7912F;  /* Oro profundo */

  /* Turquesa TaJú */
  --turquesa-100: #EAF7F8;
  --turquesa-300: #B8E2E5;
  --turquesa-500: #7CC9CF;  /* Soporte de marca */
  --turquesa-700: #4A9AA1;
  --turquesa-900: #2E6B70;

  /* Rosa TaJú */
  --rosa-300: #F9C9DD;
  --rosa-500: #F195BD;      /* Acento, uso mínimo */

  /* Tinta */
  --tinta-900: #2B2B2A;     /* Texto principal, contorno de marca */
  --tinta-700: #5C5C5A;
  --tinta-500: #8A8A87;
  --tinta-300: #C7C7C4;
  --tinta-100: #EDEDEB;
  --tinta-000: #FFFFFF;
}
```

Los pasos 100, 300, 700 y 900 son derivaciones de luminosidad calculadas a partir de los valores autoritativos del archivo vectorial. Los pasos 500 del amarillo, el turquesa y el rosa, junto al 700 y 900 del amarillo, son los valores de marca y no pueden alterarse.

### 1.2 Color de estado

Los colores de estado no pertenecen a la paleta de marca y esa exclusión es deliberada. Un error en amarillo de marca sería semánticamente ambiguo, y un mensaje de éxito en turquesa competiría con el color de contexto. El sistema de estados necesita vocabulario propio, sin solapamiento con la identidad.

```css
:root {
  --exito-500: #2F7A52;
  --exito-100: #E6F4EC;

  --error-500: #C0392B;
  --error-100: #FBEAE7;

  --aviso-500: #A34E0C;
  --aviso-100: #FDF0E3;

  --info-500: #2B6CB0;
  --info-100: #E8F0FA;
}
```

El color de advertencia se define en naranja y no en amarillo, precisamente para no colisionar con el primario de marca. El color informativo se define en azul y no en turquesa, por la misma razón.

Todos los pasos 500 cumplen AA sobre blanco y sobre su propio paso 100. Los ratios verificados son: éxito 5.22 y 4.60, error 5.44 y 4.67, advertencia 5.75 y 5.13, información 5.42 y 4.72.

### 1.3 Tipografía

```css
:root {
  --fuente-base: 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --fuente-mono: 'JetBrains Mono', ui-monospace, 'Courier New', monospace;

  --peso-regular: 400;
  --peso-medio: 500;
  --peso-semi: 600;

  --texto-display: 3rem;      /* 48px */
  --texto-h1: 2.441rem;       /* 39px */
  --texto-h2: 1.953rem;       /* 31px */
  --texto-h3: 1.563rem;       /* 25px */
  --texto-lg: 1.25rem;        /* 20px */
  --texto-base: 1rem;         /* 16px */
  --texto-sm: 0.875rem;       /* 14px */
  --texto-xs: 0.75rem;        /* 12px */

  --interlineado-apretado: 1.2;
  --interlineado-interfaz: 1.4;
  --interlineado-texto: 1.6;

  --medida-linea: 68ch;
}
```

Verona no aparece en el sistema de tokens. El wordmark existe como trazado vectorial y la fuente es comercial, por lo que no se carga ni se declara. Componer texto vivo en Verona está prohibido según las Pautas.

El interlineado de texto corrido es 1.6 y no 1.5. Es una compensación deliberada por la geometría circular de Poppins, que se compacta visualmente con interlineados estándar.

### 1.4 Espaciado

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px */
}
```

Escala de base 4. No existen valores intermedios y no se crean. Un espaciado de 10 o 18 píxeles es siempre síntoma de una decisión tomada por fuera del sistema.

### 1.5 Radio y elevación

```css
:root {
  --radio-sm: 0.5rem;     /* 8px — campos, botones */
  --radio-md: 0.75rem;    /* 12px — tarjetas, contenedores */
  --radio-lg: 1.25rem;    /* 20px — modales, paneles */
  --radio-full: 9999px;   /* píldoras, etiquetas de estado */

  --sombra-sm: 0 1px 2px rgba(43, 43, 42, 0.06);
  --sombra-md: 0 4px 12px rgba(43, 43, 42, 0.08);
  --sombra-lg: 0 12px 32px rgba(43, 43, 42, 0.12);
  --sombra-foco: 0 0 0 3px rgba(245, 212, 71, 0.55);
}
```

Las sombras se construyen sobre el Negro TaJú con transparencia, nunca sobre negro puro. La sombra de foco usa el amarillo de marca porque el anillo de foco es el único lugar donde un color de marca cumple función de estado sin ambigüedad.

### 1.6 Movimiento

```css
:root {
  --duracion-rapida: 120ms;
  --duracion-normal: 200ms;
  --duracion-lenta: 320ms;
  --curva-estandar: cubic-bezier(0.2, 0, 0, 1);
  --curva-entrada: cubic-bezier(0, 0, 0, 1);
}
```

Toda animación debe respetar `prefers-reduced-motion`. En ese caso las duraciones se reducen a cero, no se acortan.

### 1.7 Puntos de quiebre y capas

```css
:root {
  --bp-sm: 480px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;

  --z-base: 0;
  --z-elevado: 10;
  --z-encabezado: 100;
  --z-superposicion: 200;
  --z-modal: 300;
  --z-aviso: 400;
}
```

La escala de capas está fijada. No se escriben valores arbitrarios de `z-index` en componentes, porque es la vía más rápida hacia una guerra de superposiciones imposible de depurar.

---

## 2. Capa semántica

```css
:root {
  /* Superficies */
  --superficie-base: var(--tinta-000);
  --superficie-calida: var(--amarillo-100);
  --superficie-fria: var(--turquesa-100);
  --superficie-elevada: var(--tinta-000);
  --superficie-hundida: var(--tinta-100);

  /* Texto */
  --texto-principal: var(--tinta-900);
  --texto-secundario: var(--tinta-700);
  --texto-tenue: var(--tinta-500);
  --texto-sobre-acento: var(--tinta-900);
  --texto-deshabilitado: var(--tinta-300);

  /* Bordes */
  --borde-sutil: var(--tinta-100);
  --borde-medio: var(--tinta-300);
  --borde-fuerte: var(--tinta-900);

  /* Acción primaria */
  --accion-fondo: var(--amarillo-500);
  --accion-fondo-hover: var(--amarillo-700);
  --accion-texto: var(--tinta-900);

  /* Acción secundaria */
  --accion-sec-fondo: transparent;
  --accion-sec-borde: var(--tinta-900);
  --accion-sec-texto: var(--tinta-900);

  /* Contexto y orientación */
  --contexto-fondo: var(--turquesa-500);
  --contexto-fondo-suave: var(--turquesa-100);
  --contexto-texto: var(--tinta-900);

  /* Acento afectivo, uso mínimo */
  --acento-fondo: var(--rosa-500);
  --acento-texto: var(--tinta-900);

  /* Estados de sistema */
  --estado-exito-texto: var(--exito-500);
  --estado-exito-fondo: var(--exito-100);
  --estado-error-texto: var(--error-500);
  --estado-error-fondo: var(--error-100);
  --estado-aviso-texto: var(--aviso-500);
  --estado-aviso-fondo: var(--aviso-100);
  --estado-info-texto: var(--info-500);
  --estado-info-fondo: var(--info-100);

  /* Formulario */
  --campo-fondo: var(--tinta-000);
  --campo-borde: var(--tinta-300);
  --campo-borde-foco: var(--amarillo-700);
  --campo-borde-error: var(--error-500);
  --campo-texto: var(--tinta-900);
  --campo-marcador: var(--tinta-500);
  --campo-etiqueta: var(--tinta-900);
  --campo-ayuda: var(--tinta-700);
}
```

Obsérvese que `--texto-sobre-acento` apunta a `--tinta-900` y no al blanco. Es la regla cromática fundamental de las Pautas codificada como token: sobre cualquier color de marca el texto va en tinta. Al existir como token, la regla deja de depender de que alguien la recuerde.

---

## 3. Tokens de estado de pedido

Los seis estados definidos en el documento de Voz requieren tratamiento cromático propio, porque no son estados de sistema sino etapas de un proceso. La progresión de color debe leerse como avance.

```css
:root {
  --pedido-recibido-fondo: var(--tinta-100);
  --pedido-recibido-texto: var(--tinta-700);

  --pedido-revision-fondo: var(--info-100);
  --pedido-revision-texto: var(--info-500);

  --pedido-confirmado-fondo: var(--turquesa-100);
  --pedido-confirmado-texto: var(--turquesa-900);

  --pedido-produccion-fondo: var(--amarillo-100);
  --pedido-produccion-texto: var(--amarillo-900);

  --pedido-listo-fondo: var(--exito-100);
  --pedido-listo-texto: var(--exito-500);

  --pedido-entregado-fondo: var(--exito-500);
  --pedido-entregado-texto: var(--tinta-000);
}
```

La progresión va de neutro a color pleno. Entregado es el único estado con fondo saturado, porque es el cierre del ciclo y debe distinguirse de un vistazo en una lista larga del panel de taller.

---

## 4. Tokens de componente

Se definen únicamente para componentes cuya composición se repite. Consumen la capa semántica, nunca la primitiva.

```css
:root {
  /* Botón */
  --boton-alto: 2.75rem;          /* 44px, mínimo táctil accesible */
  --boton-padding-x: var(--space-6);
  --boton-radio: var(--radio-sm);
  --boton-peso: var(--peso-medio);

  /* Campo de formulario */
  --campo-alto: 2.75rem;
  --campo-padding-x: var(--space-4);
  --campo-radio: var(--radio-sm);
  --campo-borde-ancho: 1px;
  --campo-etiqueta-peso: var(--peso-medio);
  --campo-etiqueta-tamano: var(--texto-sm);

  /* Tarjeta de producto */
  --tarjeta-radio: var(--radio-md);
  --tarjeta-padding: var(--space-4);
  --tarjeta-sombra: var(--sombra-sm);
  --tarjeta-sombra-hover: var(--sombra-md);

  /* Etiqueta de estado */
  --etiqueta-radio: var(--radio-full);
  --etiqueta-padding-x: var(--space-3);
  --etiqueta-padding-y: var(--space-1);
  --etiqueta-tamano: var(--texto-xs);
  --etiqueta-peso: var(--peso-medio);
}
```

La altura de 44 píxeles en botones y campos no es estética. Es el objetivo táctil mínimo recomendado para uso en móvil, y dado que buena parte de los clientes de TaJú llegarán desde Instagram en el teléfono, es un requisito funcional.

---

## 5. Implementación en Tailwind

La configuración no duplica valores. Consume las variables CSS, de modo que exista una sola fuente de verdad.

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        superficie: {
          base: 'var(--superficie-base)',
          calida: 'var(--superficie-calida)',
          fria: 'var(--superficie-fria)',
          hundida: 'var(--superficie-hundida)',
        },
        texto: {
          principal: 'var(--texto-principal)',
          secundario: 'var(--texto-secundario)',
          tenue: 'var(--texto-tenue)',
          acento: 'var(--texto-sobre-acento)',
        },
        accion: {
          DEFAULT: 'var(--accion-fondo)',
          hover: 'var(--accion-fondo-hover)',
          texto: 'var(--accion-texto)',
        },
        contexto: {
          DEFAULT: 'var(--contexto-fondo)',
          suave: 'var(--contexto-fondo-suave)',
        },
        acento: 'var(--acento-fondo)',
        exito: { DEFAULT: 'var(--exito-500)', suave: 'var(--exito-100)' },
        error: { DEFAULT: 'var(--error-500)', suave: 'var(--error-100)' },
        aviso: { DEFAULT: 'var(--aviso-500)', suave: 'var(--aviso-100)' },
        info:  { DEFAULT: 'var(--info-500)',  suave: 'var(--info-100)'  },
        borde: {
          sutil: 'var(--borde-sutil)',
          medio: 'var(--borde-medio)',
          fuerte: 'var(--borde-fuerte)',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['var(--texto-xs)', { lineHeight: 'var(--interlineado-interfaz)' }],
        sm: ['var(--texto-sm)', { lineHeight: 'var(--interlineado-interfaz)' }],
        base: ['var(--texto-base)', { lineHeight: 'var(--interlineado-texto)' }],
        lg: ['var(--texto-lg)', { lineHeight: 'var(--interlineado-texto)' }],
        h3: ['var(--texto-h3)', { lineHeight: 'var(--interlineado-apretado)' }],
        h2: ['var(--texto-h2)', { lineHeight: 'var(--interlineado-apretado)' }],
        h1: ['var(--texto-h1)', { lineHeight: 'var(--interlineado-apretado)' }],
        display: ['var(--texto-display)', { lineHeight: 'var(--interlineado-apretado)' }],
      },
      spacing: {
        1: 'var(--space-1)', 2: 'var(--space-2)', 3: 'var(--space-3)',
        4: 'var(--space-4)', 6: 'var(--space-6)', 8: 'var(--space-8)',
        12: 'var(--space-12)', 16: 'var(--space-16)', 24: 'var(--space-24)',
      },
      borderRadius: {
        sm: 'var(--radio-sm)',
        md: 'var(--radio-md)',
        lg: 'var(--radio-lg)',
        full: 'var(--radio-full)',
      },
      boxShadow: {
        sm: 'var(--sombra-sm)',
        md: 'var(--sombra-md)',
        lg: 'var(--sombra-lg)',
        foco: 'var(--sombra-foco)',
      },
      maxWidth: { prosa: 'var(--medida-linea)' },
      transitionDuration: {
        rapida: 'var(--duracion-rapida)',
        normal: 'var(--duracion-normal)',
        lenta: 'var(--duracion-lenta)',
      },
      screens: {
        sm: '480px', md: '768px', lg: '1024px', xl: '1280px',
      },
      zIndex: {
        base: '0', elevado: '10', encabezado: '100',
        superposicion: '200', modal: '300', aviso: '400',
      },
    },
  },
  plugins: [],
}
```

Nótese que la paleta cruda de Tailwind queda fuera. Las clases `bg-yellow-400` o `text-gray-600` no deben existir en este proyecto. Si aparecen en el código, significa que alguien se salió del sistema.

---

## 6. Carga de fuentes

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Se cargan tres pesos de Poppins y dos de JetBrains Mono. No se cargan cursivas ni pesos adicionales: cada peso es una petición y un costo de renderizado, y el sistema no los usa. El parámetro `display=swap` evita el texto invisible durante la carga, lo cual importa en conexiones móviles lentas.

---

## 7. Restablecimiento base

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--fuente-base);
  font-size: var(--texto-base);
  font-weight: var(--peso-regular);
  line-height: var(--interlineado-texto);
  color: var(--texto-principal);
  background: var(--superficie-base);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-weight: var(--peso-semi);
  line-height: var(--interlineado-apretado);
  margin: 0;
}

p { max-width: var(--medida-linea); margin: 0; }

/* Cifras tabulares donde el dato importa */
.cifra, td, .precio, .medida {
  font-variant-numeric: tabular-nums;
}

/* Foco visible y consistente en todo el sistema */
:focus-visible {
  outline: none;
  box-shadow: var(--sombra-foco);
  border-radius: var(--radio-sm);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

El bloque de foco visible merece atención. Es el token que más se omite y el que más impacto tiene en accesibilidad real: sin él, quien navega con teclado no sabe dónde está parado. Al definirlo globalmente sobre `:focus-visible`, se resuelve una sola vez para toda la aplicación.

---

## 8. Reglas de uso

Un componente consume solo tokens semánticos. Si necesita una primitiva, falta un token semántico y hay que crearlo.

Solo una acción primaria por pantalla. El amarillo de acción pierde su función de dirigir la atención si se reparte entre varios botones.

El turquesa no se usa para acciones. Es color de contexto y orientación. Un botón turquesa compite con el botón amarillo y rompe la jerarquía.

El rosa aparece como máximo una vez por pantalla y solo en momentos de carga afectiva, nunca en elementos estructurales ni de sistema.

Los colores de estado no se usan decorativamente. Un borde verde que no signifique éxito envenena el vocabulario del sistema completo.

En el panel de taller no se usan `--acento-fondo` ni la mascota. El criterio ahí es legibilidad operativa, según lo definido en los documentos de Identidad y Voz.

---

## 9. Verificación antes de implementar

Ejecutar esta lista al cerrar cada componente.

Ningún valor hexadecimal literal en el código. Ninguna clase de la paleta cruda de Tailwind. Todo texto sobre color de marca en tinta y nunca en blanco. Todo objetivo táctil de al menos 44 píxeles. Foco visible en todo elemento interactivo. Todo espaciado tomado de la escala de base 4. Precios y medidas con cifras tabulares activadas.

---

## 10. Control de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-09-17 | Versión inicial. Arquitectura de dos capas, primitivas derivadas de los valores autoritativos del vector, sistema de estados con contraste verificado, tokens de estado de pedido, configuración de Tailwind por referencia y restablecimiento base. |
