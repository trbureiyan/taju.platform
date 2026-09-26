# Enmiendas a los documentos de marca | Vitrina

`.docs/` no se versiona. Este archivo contiene el texto a aplicar en la copia local de `.docs/branding/` para que coincida con `client/src/styles/tokens.css`. Autorizado por TaJú en la sesión de diseño de la Vitrina (2026-09-26).

## 02-pautas-de-marca.md

**§2.3, reemplazar la oración "No se aplica espaciado entre letras negativo en ningún caso." por:**

> El texto de interfaz y el texto corrido mantienen espaciado entre letras 0. Los titulares de 61 píxeles o más admiten hasta −0.02em como corrección óptica, porque Poppins se ve suelta a esa escala. Su interlineado nunca baja de 1.0: en español las tildes y la virgulilla de las mayúsculas chocan con los descendentes de la línea anterior.

**§2.4, agregar a la tabla de escala después de `display`:**

| Token | Tamaño | Uso |
|---|---|---|
| `display-xl` | 61px / 3.815rem | Titular del hero de la Vitrina |
| `display-2xl` | 76px / 4.768rem | Nombre de familia en el escenario de la Vitrina |

**§9, agregar fila de versión:**

| 1.2 | 2026-09-26 | Corrección óptica de tracking e interlineado para titulares de 61px o más. Pasos `display-xl` y `display-2xl` de la escala. |

## 04-tokens-de-diseno.md

**§1.3, agregar al bloque de tipografía:**

```css
  --texto-display-xl: 3.815rem;   /* 61px */
  --texto-display-2xl: 4.768rem;  /* 76px */
  --interlineado-display: 1.0;    /* solo desde display-xl */
  --tracking-display: -0.02em;    /* solo desde display-xl */
```

**§2, agregar a la capa semántica:**

```css
  --superficie-invertida: var(--tinta-900);
  --texto-invertido: var(--tinta-000);
```

**Nueva sección §3.1 Fondos por familia:**

```css
:root {
  --familia-toppers-fondo: var(--amarillo-300);
  --familia-superficies-fondo: var(--turquesa-300);
  --familia-senaletica-fondo: var(--amarillo-100);
  --familia-papeleria-fondo: var(--turquesa-100);
}
```

Se usan solo como fondo del escenario de familias de la Vitrina, siempre con texto en tinta. El rosa no participa porque no puede ser estructural.

**§1.6 Movimiento, agregar:**

```css
  --duracion-trazo: 1600ms; /* bucles de espera (corte del isotipo), no es transicion de interfaz */
```

**§1.6 Movimiento, springs:** pendiente de la fase 2. Los valores de los springs espacial y de efectos de M3 Expressive se agregan aquí cuando se verifiquen contra la documentación oficial.

**§10, agregar fila de versión:**

| 1.1 | 2026-09-26 | Tokens de display grande, tracking e interlineado de display, superficie y texto invertidos, fondos por familia, duración de bucle de espera. |
