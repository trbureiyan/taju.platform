# Vitrina (landing en `/`) | Diseño

- Fecha: 2026-09-26
- Estado: aprobado por secciones en brainstorming, pendiente de revisión final del documento
- Alcance: solo la Vitrina y los cambios transversales que necesita para funcionar. El rediseño de catálogo, detalle y mis pedidos es el spec siguiente.
- Fuentes normativas: `.docs/branding/01` a `04`, `AGENTS.md`

---

## 1. Contexto

Hoy `/` redirige a `/catalogo` (`client/src/App.tsx`). No existe landing. Esta spec define la Vitrina que reemplaza esa redirección.

Decisiones previas que este documento da por cerradas:

1. Vitrina y rediseño del catálogo son specs separados.
2. No hay fotografía real de producto todavía. La Vitrina se lanza sin depender de ella y se reemplaza después.
3. El hero no usa pose de mascota. Ninguna de las tres poses del inventario cerrado está asignada a landing (Pautas §4).
4. "Quiénes somos" queda fuera. Sigue bloqueado por falta de nombre de fundador/a y foto real.
5. Dos audiencias (identidad §3): el hero ofrece una ruta para cliente final y otra para cliente profesional.
6. Dirección de sistema: Material Design 3 Expressive más disciplina Swiss, por encima de la identidad de marca. La expresividad vive en forma (radios) y movimiento, nunca en color o tipografía nuevos.
7. No se usa fotografía de banco de imágenes (Pautas §5). Mientras no haya fotos, los espacios de imagen muestran la silueta de la pieza como ruta de corte.

## 2. Concepto rector: del trazo a la pieza

Identidad §2: el valor de TaJú es transformar un archivo digital en un objeto físico con precisión milimétrica. Todo efecto de la Vitrina debe representar esa transformación (una línea vectorial que se vuelve objeto) o una pieza sobre la mesa del taller. Si un efecto no se explica así, no entra.

Consecuencia práctica: los placeholders de hoy son el trazo, las fotos de mañana son la pieza. El reemplazo de uno por otro cuenta la historia del taller sin cambiar la estructura.

## 3. Referencias y qué se toma de cada una

| Referencia | Se toma | No se toma |
|---|---|---|
| Figma (hero) | Collage del trabajo alrededor de una tarjeta flotante con una sola acción | Carrusel automático del fondo |
| The1 | Color de fondo como identidad por familia | Tracking negativo extremo, interlineado 0.7, tarjetas sin radio |
| Shop | Constelación de producto flotante, como evolución del hero cuando haya fotos recortadas | Nada hoy, depende de fotografía |
| sweetgreen | Ritmo de bandas alternadas, enlace fantasma con flecha | Botones en píldora |
| Peak Design | Disciplina de grilla, bloque de manifiesto | Paneles negros alternados |
| Monte | Texto sobre trazado curvo (la cinta) | Blanco sobre color de marca |
| Sunloop | Escenario de una categoría a la vez, contador, franja de datos al pie | Flechas anterior/siguiente (se reemplazan por el índice) |
| Astra | Índice fijo de categorías; su estructura va al spec de detalle de producto | Texto rotado 90°, gris sobre negro sin contraste |

Criterios de interacción: Laws of UX aplicadas donde deciden algo (Hick en el índice de familias, Doherty en la espera, posición serial y peak-end en el cierre, Jakob en la navegación, Von Restorff en el único botón amarillo).

## 4. Cambios transversales

Estos cambios salen del alcance estricto de la Vitrina pero sin ellos no funciona.

1. **`?familia=` en el catálogo.** `CatalogoPage` hoy guarda la familia en `useState` local. Pasa a sincronizarse con `useSearchParams`: lee al cargar, escribe al cambiar el filtro. Un valor fuera del enum `Familia` se ignora y muestra "Todos".
2. **"Ingresar" pasa a acción secundaria en `Nav`.** Hoy usa `bg-accion` y compite con la acción primaria de cada pantalla pública. Pasa a `accion-sec`.
3. **`Layout` deja de imponer el contenedor.** El `main` ya no fuerza `max-w-contenedor px-4 py-8`. Cada página decide su ancho: la Vitrina usa bandas a sangre con el contenedor por dentro, el resto de páginas se envuelve en el contenedor actual para no cambiar su apariencia.
4. **Footer global.** Vive en `Layout`, se muestra en rutas públicas y se oculta en `/admin`, igual que el WhatsApp flotante. Identidad §1: la razón social va en el pie de página legal del sitio.
5. **Un solo WhatsApp en pantalla.** El footer no lleva la variante línea mientras el flotante esté visible; lleva el número como texto.
6. **Rutas de admin con `React.lazy`.** El panel de taller deja de descargarse en la primera carga de la Vitrina.
7. **Copy de `CatalogoPage`.** Se corrige el voseo ("Intentá") y el lenguaje de sistema ("conectar con el servidor") en las mismas líneas que toca la sección 9.
8. **`AGENTS.md`.** Se agrega `components/vitrina/` al mapa del repo y se documentan `lib/movimiento.ts` y el despertador del servidor, en el mismo commit que los introduce.

## 5. Estructura de la página

| # | Bloque | Fondo | Efecto principal |
|---|---|---|---|
| 0 | Nav | base | Text roll en enlaces (Skiper58, en CSS) |
| 1 | Hero "Mesa de trabajo" | hielo | Piezas que caen con spring (Bounce Cards) |
| 2 | Cinta | turquesa | Texto sobre trazado curvo en bucle (Text Loop) |
| 3 | Escenario de familias | color por familia | Tech Text en el nombre, revelado por clip-path |
| 4 | Manifiesto | crema | Revelado palabra por palabra (Skiper70) |
| 5 | Franja por volumen | turquesa | Ninguno, es informativa |
| 6 | Frases que se completan | base | Texto fijo con desenfoque (Skiper44) |
| 7 | Footer | tinta | Ninguno |

Ningún bloque pide datos a la API. La página pinta completa sin esperar al servidor.

Regla de acción primaria: hay dos botones amarillos "Ver el catálogo" (hero y cierre de frases) y nunca comparten viewport. Los demás CTA son `accion-sec` o enlace fantasma.

## 6. Bloques

### 6.1 Hero "Mesa de trabajo"

**Escritorio.** Fondo `superficie-fria` a sangre. Alto igual al de la ventana menos el nav, recortado a propósito para que la cinta asome abajo y no haya falso piso.

**Piezas.** Siete tarjetas de radio 12px (`tarjeta-radio`), en los bordes, inclinadas entre −8° y 8°, en posiciones fijas (sin azar: estabilidad de layout y tests deterministas). Cada una lleva el color de su familia y dentro la silueta de una pieza como ruta de corte en tinta punteada. Las siluetas se construyen con tipografía Poppins y geometría (un "15" en contorno para topper, círculo con anillos concéntricos para blonda, tarjeta con perforación para pase VIP, letras sueltas para señalética), con trazo de 2px coherente con Lucide. Una sola pieza lleva el rosa: es la única aparición afectiva de la pantalla. Las piezas son decorativas: `aria-hidden`, sin foco, sin enlace.

**Tarjeta central.** `superficie-elevada`, radio 20px (`radio-lg`), `sombra-md`. Contenido en orden:

1. `taju-imagotipo.svg` a ~180px de ancho.
2. H1: "Te ayudamos a pedir bien para que salga bien."
3. Apoyo: "Toppers, blondas, letreros y papelería cortados en láser en Neiva. Te guiamos con las medidas antes de producir."
4. Botón primario: "Ver el catálogo" → `/catalogo`.
5. Línea con enlace fantasma: "¿Compras para tu repostería o tu negocio? Ver precios por volumen →" → `#por-volumen`.

**Movimiento.** La tarjeta aparece primero (fundido + 8px, `duracion-normal`, `curva-entrada`). Las piezas caen después, escalonadas, con spring espacial expresivo. Todo termina en menos de 1 s. El H1 y el botón son usables desde el primer instante. Al hover, la pieza se endereza a 0° y se eleva; no empuja a sus vecinas. Nada se repite en bucle, no hace falta control de pausa. Con reduced-motion todo aparece en su posición final.

**Móvil.** Las piezas se reducen a una tira de cuatro sobre la tarjeta, cortadas por los bordes. La tarjeta ocupa el ancho completo. El H1 usa el token `h1`.

**Rendimiento.** Solo SVG y CSS. El LCP es el texto del H1.

### 6.2 Cinta

Banda `contexto-fondo` con una ondulación suave. Texto en tinta, Poppins 600, mayúsculas, separador de punto en tinta. Contenido: "cake toppers · blondas · letreros · invitaciones · llaveros". Se implementa con `motion` sobre un `textPath` de SVG.

Accesibilidad:

- Botón de pausa de 44px (íconos Pause/Play de Lucide) con etiqueta que alterna "Pausar la cinta" / "Reanudar la cinta". Requisito de WCAG 2.2.2: movimiento de más de 5 s necesita pausa operable con teclado y en táctil.
- La cinta también se detiene al pasar el cursor y cuando recibe foco algo dentro de ella.
- El texto en bucle es `aria-hidden`; el botón de pausa sí es accesible.
- Con reduced-motion la cinta es estática.

### 6.3 Escenario de familias

**Escritorio, tres columnas.**

- **Índice (izquierda).** Las 4 familias numeradas 01 a 04, cifras tabulares, texto horizontal. Es un `tablist` con `aria-orientation="vertical"`: las flechas del teclado mueven entre familias y el escenario es el `tabpanel`. La activa se marca con una línea corta de tinta y peso 600.
- **Centro.** Mancha orgánica en `superficie-base` y sobre ella la pieza (silueta hoy, foto después). Al cambiar de familia la pieza se revela con un clip-path que avanza en diagonal.
- **Derecha.** Contador "01 / 04", nombre de la familia a escala `display-2xl` en Tech Text, dos líneas de descripción, botón `accion-sec` "Ver los toppers" (y equivalentes) → `/catalogo?familia=<valor>`.

Sin flechas anterior/siguiente: el índice ya cumple esa función. Sin autoplay.

**Fondo por familia.** Transición de `background-color` con `duracion-lenta` y `curva-estandar`.

| Familia | Token nuevo | Primitiva |
|---|---|---|
| toppers | `--familia-toppers-fondo` | `--amarillo-300` |
| superficies | `--familia-superficies-fondo` | `--turquesa-300` |
| senaletica | `--familia-senaletica-fondo` | `--amarillo-100` |
| papeleria | `--familia-papeleria-fondo` | `--turquesa-100` |

Toda combinación con tinta supera AA; se verifica en los criterios de aceptación.

**Franja de datos al pie.** Tres datos por familia separados por punto. Ejemplo para superficies: "MDF grabado · de 15 a 40 cm · desde 12 unidades". No se publican tiempos de entrega hasta que exista la política de identidad §12. Los datos de cada familia están en la sección 13 como pendientes de validación.

**Tech Text.** Solo con `(pointer: fine)`. Las letras se vuelven trazo punteado cerca del cursor y se pueden arrastrar; vuelven con spring. Apagados: rótulos de medida, specks, barrido en reposo. El nombre accesible es la palabra completa; las letras sueltas son `aria-hidden`. Nunca se aplica al wordmark "TaJú" (Pautas §3.4).

**Glare.** Solo cuando la pieza es de acrílico y ya existe foto real. Sobre siluetas no se activa.

**Móvil.** El índice se convierte en una fila de chips (píldora, como todo filtro). El escenario se desliza con el dedo con snap. El nombre se dibuja como trazo una sola vez al entrar en pantalla y luego se rellena.

### 6.4 Manifiesto

Banda `superficie-calida`, padding vertical `space-24`. Etiqueta en mayúsculas "Nuestro taller". `h2` a escala `h1`: "Cortamos y grabamos cada pieza en nuestro taller, en Neiva."

Cada palabra pasa de `texto-tenue` a `texto-principal` según el progreso del scroll. El revelado termina cuando la sección está a mitad de pantalla, no al salir, para que nadie lea el texto a medio contraste. El texto completo existe siempre en el DOM. Sin resaltado de fondo. Con reduced-motion aparece entero en tinta.

### 6.5 Franja por volumen

`id="por-volumen"`, con `scroll-margin-top` igual al alto del nav. Fondo `contexto-fondo`, texto en tinta (7.5, AAA).

- Etiqueta: "Para reposterías, panaderías y eventos".
- Titular: "Si compras por volumen, el precio baja por escala."
- Tres datos, cada uno con una línea que explica por qué importa: mínimo de 12 unidades, precio por escala desde 12 y desde 100 unidades, precio de cada producto publicado en el catálogo.
- Tabla de medidas de blondas y bases, de 15 a 40 cm, cada una con su referencia de repostería ("22 cm, el tamaño de una torta de media libra"), cifras tabulares.
- Botón `accion-sec`: "Ver blondas y bases" → `/catalogo?familia=superficies`.

**Sin precios.** Las escalas viven por producto en `precio.escalas` (`server/src/models/Producto.ts`). Escribir cifras en la Vitrina duplicaría la fuente y quedaría desactualizada en el primer cambio desde el admin. La franja explica el modelo; el catálogo muestra la cifra.

No se promete "repetir pedido" porque la función no existe.

**Móvil.** La tabla pasa a lista apilada; los tres datos van uno debajo de otro.

### 6.6 Frases que se completan

Prefijo fijo a la izquierda: "Para que tu topper salga bien, necesitamos…". Completan, una a la vez con el scroll:

1. "el diámetro de tu torta, de borde a borde."
2. "la altura, desde la base hasta arriba."
3. "el nombre y la edad, tal como los quieres ver."
4. "la fecha de tu celebración."

Cierre: "Con eso, sale bien." y botón primario "Ver el catálogo".

Son los mismos datos del formulario de pedido (`diametro`, `altura`, `personalizacion`, `fechaEntrega`): la Vitrina enseña a pedir antes de pedir.

**Escritorio.** Sección de varias alturas de pantalla con contenido `sticky`. Cada frase entra con opacidad, escala de 0.96 a 1 y desenfoque que se aclara. Línea fina de progreso.

**Accesibilidad.** En el DOM es una `ul`. El efecto sticky es solo visual; sin `aria-live`. Con reduced-motion se ve la lista completa estática.

**Móvil.** Sin sticky. La misma lista, cada frase aparece al entrar en pantalla.

### 6.7 Footer

Global en `Layout`, oculto en `/admin`. Fondo `--superficie-invertida` (tinta-900), texto `--texto-invertido` (blanco, 14.17). Usa `taju-isotipo-monocromático.svg`.

Contenido: "TaJú · Papelería Creativa"; enlaces a Catálogo e Ingresar (o Mis pedidos con sesión de cliente); "Instagram @taju_neiva" como enlace de texto, sin logo (Lucide no incluye íconos de marca y no se mezclan sets); WhatsApp como texto "319 245 2842"; línea legal en caption "Tajú Neiva · Neiva, Huila" y el año. Sin rosa.

## 7. Sistema de movimiento

**Una sola dependencia de animación: `motion`.** No entran GSAP, Swiper ni Lenis. Los componentes de React Bits que usan GSAP (Text Loop, Bounce Cards) se reescriben con `motion`. Los de Skiper UI marcados Pro se reconstruyen desde el concepto; los gratuitos requieren atribución.

**CSS primero.** Transiciones de hover, aparición de la tarjeta del hero, text roll del Nav y cambio de fondo del escenario se hacen con CSS y las clases existentes (`duration-*`, `ease-*`, `scale-97`). `motion` solo para springs, efectos atados al scroll y gestos de arrastre. Se carga con `LazyMotion` y el set mínimo de funciones.

**`lib/movimiento.ts` es el único lugar con parámetros de animación en JS.** Lee curvas y duraciones de las variables CSS de `tokens.css` (fuente única). Define los springs, que no existen en CSS:

- Spring espacial (con rebote leve) en tres velocidades: rápida, normal, lenta. Para lo que se desplaza: piezas del hero, letras de Tech Text, snap del escenario en móvil.
- Spring de efectos (sin rebote) en tres velocidades. Para opacidad, color y desenfoque.

Los valores parten del esquema de movimiento de M3 Expressive. Se verifican contra la documentación oficial durante la implementación y se registran en el doc 04; no se fijan de memoria en este spec.

**Reduced-motion.** `MotionConfig reducedMotion="user"` en la raíz, la regla global de CSS existente y `useReducedMotion` en los efectos de scroll, que pasan directo a su estado final.

**Propiedades animables.** `transform`, `opacity` y desenfoque acotado. Única excepción: el clip-path de la pieza del escenario (un solo elemento).

**Lenis descartado para esta versión.** No suaviza táctil por defecto y el público llega sobre todo desde Instagram en el teléfono. Los efectos de scroll funcionan con scroll nativo vía `useScroll`. Se reevalúa si en escritorio el scroll se siente rígido.

## 8. Enmiendas a tokens y pautas

Autorización: el usuario (TaJú) aprobó en esta sesión ajustar las Pautas de tracking y ampliar los tokens. `client/src/styles/tokens.css` y `client/tailwind.config.js` cambian en el repo. `.docs/` está en `.gitignore` y no se versiona, así que las enmiendas a `02-pautas-de-marca.md` y `04-tokens-de-diseno.md` se entregan en `docs/superpowers/specs/2026-09-26-vitrina-enmiendas-branding.md` para aplicarlas en la copia local. Tokens y documentos deben coincidir.

| Grupo | Token | Valor | Motivo |
|---|---|---|---|
| Tipografía | `--texto-display-xl` | 3.815rem (61px) | Siguiente paso de la escala 1.25. H1 del hero |
| Tipografía | `--texto-display-2xl` | 4.768rem (76px) | Paso siguiente. Nombre de familia |
| Tipografía | `--tracking-display` | −0.02em | Corrección óptica solo a partir de 61px |
| Tipografía | `--interlineado-display` | 1.0 | Solo a partir de 61px. Nunca menos: las tildes y la virgulilla de mayúsculas chocan con los descendentes de la línea anterior |
| Color | `--familia-*-fondo` (4) | ver 6.3 | Fondo del escenario |
| Color | `--superficie-invertida` | `var(--tinta-900)` | Footer |
| Color | `--texto-invertido` | `var(--tinta-000)` | Footer |
| Movimiento | springs espacial y de efectos, 3 velocidades | ver sección 7 | M3 Expressive |

Enmienda textual a Pautas §2.3: el texto de interfaz y el texto corrido mantienen espaciado entre letras 0. Los titulares de 61px o más admiten hasta −0.02em como corrección óptica.

Sin cambios: botones con radio 8px; la píldora queda solo para chips y filtros. Curvas y duraciones actuales se mantienen.

## 9. Despertar del servidor y espera

**`useDespertarServidor()`.** Se llama una vez en `Layout`, así corre en cualquier ruta de entrada (Vitrina, enlace directo a `/catalogo`, recarga, bookmark), no solo en `/`. Una bandera a nivel de módulo evita el doble disparo del modo estricto en desarrollo. Una sola petición `GET` sin esperar respuesta, sin reintento, con corte a 60 s, sin UI, silenciosa si falla.

El destino es `origen(VITE_API_URL) + '/health'`: `/health` cuelga de la raíz del servidor (`server/src/app.ts`) y `VITE_API_URL` termina en `/api`. Concatenar a ciegas daría `/api/health` y un 404 que no despierta nada.

Comentario obligatorio en el código:

```ts
// [DECISION] ping desde el cliente ademas de keep-alive.yml - el workflow es el mecanismo principal pero falla en silencio: GitHub desactiva crons tras 60 dias sin push, el cron es best-effort y puede saltarse, y puede apagarse para ahorrar horas de Render. Este ping es la red de seguridad; no borrar sin reemplazo.
```

**`EsperaTaller`.** Componente de espera para `CatalogoPage` (y cualquier vista que espere la API):

| Tiempo | Qué se ve |
|---|---|
| 0 a 400 ms | Nada. Evita el parpadeo en respuestas rápidas (umbral de Doherty) |
| Desde 400 ms | Skeleton con la forma de las tarjetas |
| Desde ~3 s | El isotipo monocromático se traza como ruta de corte en bucle, con "Estamos preparando el catálogo" |
| Desde 15 s | El texto cambia a "La primera visita del día tarda un poco más mientras el taller arranca. Ya casi." |

SVG con `stroke-dashoffset`, sin librerías. Con reduced-motion el isotipo aparece completo. El texto vive en `role="status"` y se anuncia al cambiar, no en cada ciclo.

**Errores.** La Vitrina no pide datos y no tiene estados de error. Un `?familia=` inválido cae a "Todos". Los enlaces de la Vitrina se generan desde el mapa de familias y no pueden producir valores inválidos.

## 10. Archivos

Nuevos:

- `client/src/pages/VitrinaPage.tsx`: solo ordena los bloques.
- `client/src/components/vitrina/`: `HeroMesa.tsx`, `PiezaSilueta.tsx`, `Cinta.tsx`, `EscenarioFamilias.tsx`, `TechText.tsx`, `Manifiesto.tsx`, `FranjaVolumen.tsx`, `FrasesQueCompletan.tsx`, `contenido.ts`.
- `client/src/components/shared/Footer.tsx`, `client/src/components/shared/EsperaTaller.tsx`.
- `client/src/lib/movimiento.ts`.
- `client/src/hooks/useDespertarServidor.ts`.

`contenido.ts` es la única fuente del texto por familia (descripción, datos de la franja, texto del CTA, token de fondo, silueta) y se tipa sobre `Familia` partiendo de `ETIQUETAS_FAMILIA`, así el compilador obliga a cubrir las cuatro familias y no existe una segunda lista escrita a mano.

Modificados: `App.tsx` (ruta `/` a `VitrinaPage`, admin con `React.lazy`), `Layout.tsx`, `Nav.tsx`, `CatalogoPage.tsx`, `tokens.css`, `tailwind.config.js`, `AGENTS.md`. Fuera del repo (copia local de `.docs/`): `02-pautas` y `04-tokens`, con el texto de `2026-09-26-vitrina-enmiendas-branding.md`.

## 11. Pruebas

TDD con Vitest y Testing Library, escritas antes del código:

1. Cada CTA del escenario apunta a `/catalogo?familia=<valor>` para los cuatro valores del enum.
2. `CatalogoPage` lee `?familia=` al cargar, escribe la URL al cambiar el filtro, e ignora valores inválidos.
3. En el índice del escenario, las flechas del teclado mueven la selección con `aria-selected` correcto.
4. El botón de pausa de la cinta detiene la animación y alterna su etiqueta.
5. Con reduced-motion simulado, manifiesto y frases se ven completos.
6. `useDespertarServidor` apunta a `origen + '/health'`, no a `/api/health`, y dispara una sola vez por carga en cualquier ruta.
7. `EsperaTaller` respeta los tres tiempos (timers falsos).
8. Footer y WhatsApp flotante no aparecen en `/admin`.
9. El hero contiene exactamente un botón de acción primaria.

Criterios de aceptación manuales:

- El LCP es el texto del H1.
- Ningún movimiento de más de 5 s sin control de pausa.
- La página completa se recorre con teclado con foco visible en todo elemento interactivo.
- A 360px de ancho no hay scroll horizontal.
- Contraste verificado de tinta sobre los cuatro fondos de familia, turquesa y crema.
- Validación completa antes de declarar terminado: `pnpm typecheck`, `pnpm lint`, `pnpm --filter taju-client test`, `pnpm build:client`.

## 12. Dependencias y acciones manuales

```text
MANUAL ACTION REQUIRED:
1. Run: pnpm --filter taju-client add motion@<versión exacta>
2. Verify: package.json sin ^ ni ~, pnpm-lock.yaml actualizado
3. Confirm before I continue with the next step
```

## 13. Datos pendientes de validar con TaJú

Marcados `[?]` en `contenido.ts` hasta confirmarse:

- Datos de la franja de cada familia (materiales, rango de medidas, mínimos).
- Tabla de medidas de blondas: los documentos solo fijan 15 cm (octavo de libra), 22 cm (media libra) y 40 cm (dos libras).
- Política de tiempos de entrega por familia (identidad §12). Hasta entonces no se publica ningún plazo.
- Originales de las fotos de producción publicadas en Instagram, como fotografía interina.

## 14. Deuda registrada para otros specs

- **Catálogo y detalle:** estructura de Astra para la página de producto (nombre grande, precio junto a la acción, riel de familia) y la franja de especificaciones de Sunloop. Carrusel coverflow (Skiper47) evaluado para productos, no para familias.
- **Formulario de pedido:** Rubber Segment para material; Scrub Field solo como complemento del teclado. Slide Commit descartado (falla WCAG 2.5.1 y no hay cobro en línea).
- **Mis pedidos:** "repetir pedido" para el cliente profesional (identidad §3).
- **Admin:** Swipe Row descartado para escritorio; reevaluar si el panel se usa en móvil.
- **Hero v2:** constelación estilo Shop cuando existan fotos recortadas.
