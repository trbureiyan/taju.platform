# Plan de rediseño de la Vitrina (`/`)

Estado: aprobado por TaJú el 2026-11-04 con los cambios de la sección 7. Nada está implementado todavía.
Rama: `claude/determined-galileo-oz8e84`, creada desde `origin/dev` (`e60f184`).
Fecha de la auditoría: 2026-11-03.

## 0. Cómo se auditó

Lectura del código de `client/src/pages/VitrinaPage.tsx`, `client/src/components/vitrina/*`,
`client/src/components/shared/{Layout,Footer,BotonWhatsApp,Nav}.tsx`, `client/src/styles/*`,
`client/tailwind.config.js`, `client/index.html`, `client/vercel.json` y del formulario de pedido
(`client/src/components/pedido/*`). Contraste con los cuatro documentos de `.docs/branding/` (versiones
que TaJú adjuntó en la conversación) y con `AGENTS.md`.

La Vitrina se levantó con `vite` en local y se midió con Playwright en tres contextos: escritorio
1440 x 900, iPhone 13 (390 x 664) y escritorio con `prefers-reduced-motion: reduce`. El servidor no
estaba corriendo (no hace falta: la Vitrina no pide datos a la API) y la red del contenedor bloquea
Google Maps, Vercel Analytics y la demo de Gladlet, así que ninguna de las tres se pudo ver aquí.
Gladlet se tomó solo desde la captura que TaJú adjuntó.

## 1. Hallazgos validados

Severidad: alta (rompe la lectura o la confianza), media (degrada), baja (pulido).

### 1.1 Los seis puntos del diagnóstico previo

| # | Diagnóstico | Veredicto | Causa raíz | Severidad |
|---|---|---|---|---|
| 1 | Bloque en blanco antes del footer | **Confirmado en parte.** No es un fallo de render | `FrasesQueCompletan.tsx:34` fija la sección en `COMPLETAN.length * 100vh` (3600 px en escritorio) y el contenido es `sticky top-0 h-screen` (`:39`). Al hacer scroll se ve bien, pero son tres pantallas de recorrido para cambiar una línea; en toda captura de página completa, impresión o salto con la tecla Fin quedan unos 3000 px en blanco. En móvil y con movimiento reducido no se fija (735 px y 500 px), así que el defecto es solo de escritorio con movimiento | Alta |
| 2 | "Nuestro taller" en gris, animación que no terminó | **Refutado como fallo, confirmado como contraste.** Sí respeta `prefers-reduced-motion` | `Manifiesto.tsx:11` anima la opacidad de cada palabra de 0.25 a 1 atada al scroll (`useScroll`, `:20`). Con movimiento reducido pinta la frase completa (verificado: sin `span` por palabra). En reposo la frase está a 0.25 de opacidad sobre crema, por debajo de 3:1; se completa solo cuando la sección llega a la mitad de la pantalla. Es un `h2` que nunca se lee entero en una captura ni para quien pasa rápido | Media |
| 3a | Círculo montado sobre la primera palabra de la cinta | **Confirmado** | `Cinta.tsx:53`: el botón de pausa es `absolute left-4`, 44 px, fondo blanco con borde, encima de la pista que sigue corriendo por debajo. Medido: botón en x 16..60, "cake toppers" pasando por x -61..85 | Media |
| 3b | WhatsApp flotante choca con la cinta | **Confirmado, transitorio** | `BotonWhatsApp.tsx:145` es `fixed bottom-6 right-6`. En 1440 x 900 sin scroll el botón (y 812..876) queda sobre la cinta (y 756..837). En móvil tapa además el párrafo del hero (ver 1.2) | Baja |
| 4 | Mapa del footer vacío | **No reproducible como defecto de código; confirmado como falta de respaldo** | `Footer.tsx:90` incrusta Google Maps con `loading="lazy"`. La CSP (`vercel.json`) permite `frame-src https://www.google.com` y está en `Report-Only`, así que no lo bloquea. La causa más probable del recuadro vacío en la captura es que la herramienta de página completa no dispara la carga diferida del iframe. Aun así, si Google no carga (bloqueador de rastreo, red lenta, sin conexión) queda un recuadro con borde y nada adentro | Baja |
| 5 | Hero encajonado, una familia a la vez, sin testimonios, paleta sin reglas | **Mixto** | Hero: confirmado, tarjeta blanca con `PiezaSilueta` (siluetas punteadas, no producto). En móvil el imagotipo se repite (nav y tarjeta) y el botón "Ver el catálogo" queda fuera de la primera pantalla. Familias: confirmado, `EscenarioFamilias` es un patrón de pestañas con una familia visible. Testimonios: confirmado que no hay, y es correcto no tenerlos sin material real. Paleta "sin reglas": **refutado**. Las reglas existen y son estrictas (`tokens.css` en dos capas, Pautas §1 y §7, fondos por familia en tokens §2.1); el desorden visual viene de que cada sección cambia de fondo (hielo, turquesa, amarillo, crema, turquesa, blanco, tinta) sin un ritmo decidido, no de que falten reglas | Media |
| 6 | Tipografía única geométrica | **Refutado como defecto.** Es una decisión normativa | Pautas §2.2 v1.1 retiró a propósito la propuesta de cambiar Poppins, y `AGENTS.md` lo repite. La falta de carácter se compensa con escala (`display-xl`, `display-2xl`), peso y el motivo de corte, no con otra familia | No aplica |

### 1.2 Defectos nuevos

| # | Hallazgo | Archivo | Severidad |
|---|---|---|---|
| N1 | En móvil la primera pantalla es nav con imagotipo, cuatro piezas, otra vez el imagotipo y el titular. El botón primario no aparece sin hacer scroll y el WhatsApp flotante tapa el párrafo de apoyo | `HeroMesa.tsx:51-77` | Alta |
| N2 | Sin JavaScript la página queda vacía: es una SPA con `<div id="root">` y ningún `<noscript>`. Ni dirección, ni WhatsApp, ni teléfono | `client/index.html:17` | Media |
| N3 | El pie dice "Facebook TaJú Estudio Creativo". Identidad §1 retira "Estudio Creativo" en todo activo nuevo | `Footer.tsx:75` | Baja |
| N4 | La tabla de medidas tiene 3 de las 8 referencias. La lista de precios de blondas que TaJú publicó (adjunta) trae las 8: personal 12, octavo 15, cuarto 20, media 22, media+ 26, libra 30, libra y media 36, dos libras 40. Además el seed de desarrollo dice "Libra 26 cm", que contradice la lista (ahí 26 es media libra +) | `FranjaVolumen.tsx:11-15`, `tools/seed-dev/datos.ts:26` | Media |
| N5 | La Vitrina no muestra ni un producto real. Las siete siluetas son marcadores; identidad §7 pide "mostrar el trabajo real" | `PiezaSilueta.tsx:3` (lo dice el comentario: "hoy es el placeholder, mañana la foto") | Alta, bloqueado por material |
| N6 | Dos acciones amarillas en la misma página ("Ver el catálogo" en el hero y al final). No están en la misma pantalla, así que cumple la regla por pantalla, pero repetir la misma acción al cierre es una oportunidad perdida | `FrasesQueCompletan.tsx:79` | Baja |
| N7 | Los SVG de marca pesan 88 KB (imagotipo) y 45 KB (isotipo) para una imagen de 44 x 16 rem. Se cachean, pero en 3G son el recurso más pesado de la primera pantalla después de las fuentes. Re-exportarlos es trabajo de marca (AGENTS: no editar `public/brand/`) | `public/brand/` | Baja, fuera de alcance |
| N8 | `TechText` en táctil arranca con las letras transparentes hasta entrar en pantalla (`useInView`, `amount 0.6`). Si el observador no dispara, el nombre de la familia queda solo en trazo. Riesgo bajo, mismo patrón que N1 del Manifiesto | `TechText.tsx:36,94` | Baja |

Verificado sin problema: sin scroll horizontal en 390 px; foco visible global (`index.css`);
`alt` correcto en logos (decorativos con `alt=""`, el del hero con "TaJú"); Poppins 400/500/600 cargan;
la cinta cumple WCAG 2.2.2 con el botón de pausa y se detiene con movimiento reducido; el escenario
de familias implementa el patrón de pestañas WAI-ARIA completo; texto secundario sobre blanco y crema
por encima de 4.5:1.

## 2. Decisiones

Criterio, en este orden: promesa de marca ("te ayudamos a pedir bien"), lo que dicen los documentos
normativos, impacto en las dos audiencias, riesgo de regresión y tamaño de un proyecto académico con
fecha. La encuesta (n = 32) se usa para priorizar claridad de medidas y un flujo estructurado: 72 %
quiere un formulario web para especificar y 62 % siente que tiene que escribir por WhatsApp antes de
pedir. Solo 19 % dice tener dificultad para explicar por escrito, así que el argumento no es "los
clientes piden mal", es "les falta una referencia a la vista".

| Hipótesis | Decisión | Razón |
|---|---|---|
| a) Corregir primero lo roto | **Aceptada** | Barato, sin riesgo de marca y es lo que más se nota |
| b1) Tokens CSS en `:root` | **Ya existe.** No se toca | `tokens.css` tiene primitivas y semánticas; el trabajo es aplicar mejor, no definir |
| b2) Display con más carácter (Bricolage Grotesque) y una manuscrita de acento | **Descartada** | Contradice Pautas §2.2 v1.1 y la restricción de esta tarea. Además una manuscrita introduce un tercer registro que la marca nunca usó. El carácter se gana con escala y con el motivo de corte |
| b3) Ritmo de color por sección | **Aceptada como regla escrita, sin tokens nuevos** | Ver 2.1. Las reglas existen; falta decidir qué fondo va dónde |
| b4) Línea de corte láser como componente | **Aceptada** | Ya existe dispersa (`TRAZO` en `PiezaSilueta`, `ESTILO_TRAZO` en `TechText`, `animate-revelar`). Se extrae a `RutaCorte` y se reutiliza. Con movimiento reducido se pinta completa y quieta |
| c) Configurador que termina en WhatsApp | **Aceptada con dos cambios** | 1) Se llama "probador de tamaño" y no reemplaza al formulario: es la versión visible de "Antes de pedir". Su salida primaria lleva al catálogo de toppers, donde está el formulario real (`/pedido/:productoId`, el registro canónico según AGENTS). WhatsApp queda como salida secundaria con el mensaje armado, para el 62 % que quiere hablar antes. Terminar solo en WhatsApp saca el pedido de la plataforma, que es justo lo que el proyecto existe para evitar. 2) No inventa reglas de producción: no hay en el repo ninguna relación entre ancho del topper y diámetro de la torta. Las reglas viven en una constante marcada `[?]` y la vista previa lo dice en pantalla mientras estén pendientes |
| d1) Bento de familias | **Aceptada, fase 2** | Cuatro familias no justifican esconder tres detrás de pestañas; ver todo de un vistazo ayuda más al cliente profesional. Se hace bien solo con fotos (N5); con siluetas sería otra rejilla de marcadores |
| d2) Cinta más grande con separadores propios | **Aceptada en parte** | Se corrige el botón (fase 1) y el separador pasa a ser un tramo corto de `RutaCorte`. Más grande no: es ritmo, no información (comentario en `Cinta.tsx:19`) |
| d3) Footer con wordmark y gato | **Wordmark sí, gato no** | El isotipo ya está. AGENTS registra que la mascota queda fuera de esta versión (decisión de TaJú, 2026-09-27) y no hay ningún archivo de pose en `public/brand/`. Ver pregunta abierta 1 |
| d4) Foto o video del taller | **Aceptada, bloqueada por material** | Es el mejor argumento del Artesano. Ver "Material que necesito" |
| e) Testimonios | **Fuera** | No hay material real con consentimiento. Queda documentado el espacio (entre el probador y el pie) y la condición: texto literal, nombre o iniciales con permiso escrito, fecha |

Ideas propias que se suman:

- **Mapa con fachada.** En vez de cargar Google al entrar, el pie muestra un recuadro con la dirección
  y un botón "Ver el mapa" que carga el iframe al tocarlo. Resuelve el recuadro vacío y, de paso,
  Google no recibe la IP de nadie que no lo pidió, que encaja mejor con lo que `/datos` promete.
  No toca la CSP ni el texto de `/datos` (el proveedor sigue siendo el mismo).
- **`<noscript>` con lo esencial** en `index.html`: nombre, dirección, WhatsApp y correo, en HTML
  plano. Es lo único que puede funcionar sin JS en una SPA sin prerender, y cuesta diez líneas.
- **La tabla de medidas como columna vertebral.** La misma lista de ocho referencias (N4) alimenta la
  franja de volumen y el probador. Una sola fuente en `client/src/lib/medidasTorta.ts`.

### 2.1 Ritmo de color de la Vitrina

Una sola regla: fondo frío para orientar, cálido para el oficio, blanco para decidir, tinta para cerrar.

| Sección | Fondo | Token |
|---|---|---|
| Hero | Hielo | `bg-superficie-fria` (sin cambio) |
| Cinta | Turquesa | `bg-contexto` (sin cambio) |
| Familias | Fondo por familia | `bg-familia-*` (sin cambio) |
| Manifiesto | Crema | `bg-superficie-calida` (sin cambio) |
| Probador | Blanco | `bg-superficie-base` |
| Volumen | Turquesa | `bg-contexto` (sin cambio) |
| Pie | Tinta | `bg-superficie-invertida` (sin cambio) |

El rosa sigue siendo una sola pieza en el hero. En el probador no aparece.

## 3. Tareas

Ordenadas por dependencia. Cada una es un commit (o dos, test y código, si el test lo amerita),
con el formato `<type>: <qué cambió>` y cuerpo con el porqué, como pide AGENTS.

### Fase 1, lo roto (sin dependencias entre sí)

| # | Tarea | Archivos | Criterio de aceptación | Esfuerzo |
|---|---|---|---|---|
| T1 | Botón de pausa fuera de la pista: la cinta deja un espacio fijo a la izquierda (o el botón pasa a un borde con fondo de la cinta) para que ninguna palabra corra por debajo | `vitrina/Cinta.tsx`, `Cinta.test.tsx` | En 390 y 1440 px ninguna palabra queda bajo el botón; el botón sigue siendo de 44 px, con foco visible y oculto con movimiento reducido | 1 h |
| T2 | WhatsApp flotante: `bottom` con margen de área segura y sin tapar texto del hero en móvil (se esconde mientras el hero está en pantalla, o sube por encima del pliegue de la cinta) | `shared/BotonWhatsApp.tsx`, `shared/Layout.tsx`, tests | En iPhone 13 la primera pantalla no tiene texto tapado; el botón sigue en el resto de páginas donde hoy aparece | 1,5 h |
| T3 | Manifiesto sin opacidad atada al scroll: la frase se pinta completa; el gesto pasa a una línea de `RutaCorte` que se dibuja bajo la frase al entrar en pantalla | `vitrina/Manifiesto.tsx`, `animaciones.test.tsx` | El `h2` tiene contraste AAA en todo momento; con movimiento reducido la línea aparece completa y quieta. Depende de T6 (se puede hacer primero sin la línea) | 1 h |
| T4 | Hero en móvil: sin imagotipo duplicado dentro de la tarjeta en móvil, piezas más bajas, botón "Ver el catálogo" dentro de la primera pantalla de 390 x 664 | `vitrina/HeroMesa.tsx`, `VitrinaPage.test.tsx` | Medido con Playwright: el botón primario termina por encima de 664 px | 1,5 h |
| T5 | Pie: fachada de mapa, "Facebook TaJú" sin el descriptor retirado, `<noscript>` con lo esencial | `shared/Footer.tsx`, `Footer.test.tsx`, `client/index.html` | Sin tocar el botón no hay petición a google.com; al tocarlo el iframe carga y recibe el foco; con JS apagado se ven dirección, WhatsApp y correo | 2 h |

### Fase 2, sistema mínimo

| # | Tarea | Archivos | Criterio de aceptación | Esfuerzo |
|---|---|---|---|---|
| T6 | `RutaCorte`: componente SVG de trazo punteado de 2 px (`currentColor`), con dibujo al entrar en pantalla. El dibujo usa una máscara con `pathLength` de `motion` y `resorte('efectosLento')` sobre el trazo punteado, así conserva el patrón de guiones. Con movimiento reducido se pinta completo. `PiezaSilueta` pasa a usar su `TRAZO` | `components/ui/RutaCorte.tsx` (+ test), `vitrina/PiezaSilueta.tsx` | Sin hex ni px literales; test que verifica el estado final con `prefers-reduced-motion`; `PiezaSilueta` se ve igual que antes | 3 h |
| T7 | `lib/medidasTorta.ts`: las ocho referencias de la lista de blondas (nombre, cm). `FranjaVolumen` muestra las ocho | `lib/medidasTorta.ts` (+ test), `vitrina/FranjaVolumen.tsx` | Una sola lista en el cliente; la tabla usa cifras tabulares; sin precios (se mantiene el `[DECISION]` de `FranjaVolumen`). Pendiente de confirmación de TaJú (ítem 3 del material) | 1 h |

### Fase 3, probador de tamaño (reemplaza `FrasesQueCompletan`)

| # | Tarea | Archivos | Criterio de aceptación | Esfuerzo |
|---|---|---|---|---|
| T8 | Reglas de proporción como datos: ancho útil del topper por diámetro, largo máximo de texto, alto mínimo de letra. Todas marcadas `[?]` y en un solo lugar. Función pura `cabeTexto(texto, diametroCm, material)` que mide con un `canvas` en Poppins 600 y devuelve si cabe y con qué margen | `lib/proporcionTopper.ts` (+ test primero) | Tests con nombres cortos, largos, con tilde y con emoji; el material no cambia el cálculo hasta que TaJú diga que sí | 3 h |
| T9 | `ProbadorTopper`: campos nombre, edad (opcional), material (MDF, acrílico) y diámetro (las ocho medidas como `TarjetaOpcion`); vista previa en SVG con la torta vista de frente a escala y el topper encima; aviso sin culpa si no cabe ("Para 15 cm ese nombre queda con letras de X cm; en 20 cm se lee mejor"); aviso fijo mientras las reglas sean `[?]` | `vitrina/ProbadorTopper.tsx` (+ test), `pages/VitrinaPage.tsx`, borrar `FrasesQueCompletan.tsx` | Funciona con teclado y lector de pantalla (la vista previa tiene descripción en texto); en 390 px la vista previa queda junto a los campos; con movimiento reducido no hay transiciones; los datos que pide son los de `contenido.ts` (toppers.necesitamos) | 6 h |
| T10 | Salidas del probador: primaria "Elegir mi topper" a `/catalogo?familia=toppers`; secundaria por WhatsApp con el resumen armado, reutilizando `enlaceWhatsApp` y el estilo de `lib/mensajePedido.ts` | `vitrina/ProbadorTopper.tsx`, `lib/mensajePedido.ts` si hace falta | Una sola acción amarilla en pantalla; el mensaje de WhatsApp lleva nombre, edad, material y diámetro con su referencia ("22 cm, media libra") | 1,5 h |

Decisión pendiente para T10 (no bloquea): llevar lo escrito en el probador al formulario. Hoy el
estado del formulario vive en memoria en `useSolicitud` y AGENTS no permite pasar datos por
`location.state`. Si TaJú lo quiere, la vía es un parámetro de búsqueda en la ruta del pedido, y eso
toca `useSolicitud` y `PedidoFormPage`: es un PR aparte.

### Fase 2b, producto real (antes del probador; ver sección 7)

| # | Tarea | Archivos | Criterio de aceptación | Esfuerzo |
|---|---|---|---|---|
| T12 | Hero en dos columnas con fotos reales (sección 7.2) | `vitrina/HeroMesa.tsx` y su test, fotos en `client/public` o `public/vitrina/` | Sin tarjeta blanca; en 390 x 664 titular, párrafo y los dos botones visibles; fotos con `alt` real, `width`/`height` y `loading` correctos (sin CLS) | 4 h |
| T11 | Familias en bento, sin pestañas (sección 7.2) | `vitrina/EscenarioFamilias.tsx` (reemplazo, p. ej. `BentoFamilias.tsx`), `contenido.ts`, tests | Las cuatro familias visibles a la vez; una sola acción amarilla en pantalla (las tarjetas usan enlace de texto); foto con `RutaCorte` en el tono 700 o 900 de su familia mediante token semántico | 4 h |

### Fase 4, con material real (bloqueada)

| # | Tarea | Bloqueo |
|---|---|---|
| T13 | Video del taller en el espacio reservado junto al Manifiesto | Ítem 4 del material |
| T14 | Testimonios | Material con consentimiento. Fuera hasta tenerlo |

Esfuerzo total de las fases 1 a 3: unas 23 horas, más una de verificación (typecheck, lint, test,
build y una pasada de Playwright en los tres contextos).

## 4. Riesgos

- **Tests de la Vitrina.** `animaciones.test.tsx`, `Cinta.test.tsx`, `EscenarioFamilias.test.tsx` y
  `VitrinaPage.test.tsx` fijan comportamiento actual. Cada tarea actualiza el suyo en el mismo commit.
- **Medición de texto en el probador.** `canvas.measureText` depende de que Poppins esté cargada; antes
  de eso mide con la fuente de respaldo. Se espera `document.fonts.ready` y en tests se inyecta un
  medidor falso.
- **Reglas inventadas por accidente.** Mientras T8 tenga `[?]`, la interfaz lo dice. Si TaJú no
  entrega reglas antes de la entrega del proyecto, el probador sale como vista a escala sin veredicto
  de "cabe o no cabe".
- **El mapa con fachada** cambia el momento en que Google recibe la IP, no el proveedor. Si TaJú
  prefiere el texto de `/datos` actualizado para decirlo, es un cambio de política (sube
  `VERSION_POLITICA_DATOS` en los dos lados) y queda fuera de este plan.
- **La mascota.** Si TaJú revierte la decisión del 2026-09-27, las poses tienen que llegar como
  archivos; el plan no la usa.
- Fuera de alcance por la restricción de la tarea: backend, auth, CSP, `vercel.json`, despliegue y la
  auditoría de seguridad en curso. `seed-dev` (N4) se reporta pero no se toca.

## 5. Preguntas resueltas (2026-11-04)

1. La mascota se queda fuera.
2. El probador lleva al catálogo. El prellenado del formulario es un PR aparte, después de la entrega.
3. La lista de blondas está vigente y validada con el cliente, incluida media libra + de 26 cm. T7 deja
   de estar pendiente.

## 6. Material que necesito (primera tanda)

| # | Qué | Para qué | Dónde dejarlo | Calidad |
|---|---|---|---|---|
| 1 | Fotos de producto terminado: al menos una por familia, mejor tres de toppers (MDF y acrílico) | T11 y T12, y la vista previa del probador | `docs/referencias/productos/<familia>/` | Original en alta resolución, fondo liso |
| 2 | Regla del taller para toppers: ancho máximo según el diámetro de la torta, alto mínimo de letra legible, largo máximo de nombre, y si cambia entre MDF y acrílico | T8 y T9 (sin esto el probador no da veredicto) | `docs/referencias/reglas/topper-proporciones.md` | Basta texto o una foto de la nota del taller |
| 3 | Confirmación de la lista de precios de blondas (la que adjuntaste) y su fecha | T7 | `docs/referencias/precios/blondas-mdf.jpg` | Basta la captura |
| 4 | Foto o video corto (10 a 20 s) de la máquina cortando o de una pieza recién cortada | T13 | `docs/referencias/taller/` | Original; el video sin audio |
| 5 | Grosores y colores de MDF y acrílico que el taller maneja hoy | Opciones de material del probador (T9) | `docs/referencias/reglas/materiales.md` | Basta texto |

## 7. Cambios aprobados (2026-11-04)

### 7.1 Orden

Fase 1 (T1 a T5) igual. Fase 2 (T6 `RutaCorte`, T7 `medidasTorta`) igual. Fase 2b nueva, antes del
probador: T12 hero con producto real y T11 familias en bento. Ya hay fotos; mientras llegan los
originales quedan como marcadores con `alt` real. Fase 3 (probador, T8 a T10) va después.

### 7.2 Dirección visual de la fase 2b (aprobada en boceto)

- **Hero, escritorio.** Dos columnas. Izquierda: eyebrow ("Papelería creativa con corte láser, en
  Neiva"), titular `display-xl` a 12ch, párrafo, botón amarillo "Ver el catálogo" y secundario con
  borde "¿Cuánto mide tu torta?" que baja al probador (ancla). Derecha: rejilla 2x2 con una foto alta
  (ocupa dos filas) y dos cuadradas; cada foto con `RutaCorte` desfasada 8 px alrededor, rotación
  entre -2 y 2 grados y etiqueta tipo píldora blanca con el material. El único rosa de la página es
  una pieza pequeña de corazón en trazo punteado en una esquina. Sin tarjeta blanca encajonada.
- **Hero, móvil.** Titular, párrafo y los dos botones a ancho completo dentro de 390 x 664; debajo una
  fila de tres fotos cuadradas. Sin imagotipo duplicado.
- **Familias.** `flex-wrap`. Toppers ocupa doble ancho con foto y texto lado a lado; Superficies,
  Señalética y Papelería a su lado y debajo. Cada tarjeta con su fondo de familia, foto con
  `RutaCorte` en el tono 700 o 900 de su color (token semántico nuevo si hace falta, nunca la
  primitiva en el componente), chips blancos y enlace de texto, no botón amarillo. Se eliminan las
  pestañas.
- **Cinta.** Botón de pausa en una ranura fija a la izquierda separada por un trazo punteado vertical;
  separadores entre palabras como tramo corto de `RutaCorte`; texto en `h3` SemiBold.
- **Taller.** Frase completa a opacidad 1, `RutaCorte` debajo, y al lado el espacio reservado del
  video sobre `superficie-invertida` con la etiqueta de pendiente.

Nota sobre tokens: si `RutaCorte` necesita los tonos 700/900 por familia, hay que crear tokens
semánticos (p. ej. `--familia-toppers-trazo`) en `tokens.css`, `tailwind.config.js` y proponer el
cambio en `.docs/branding/04-tokens-de-diseno.md`. Los tres deben coincidir; el doc de marca no se
edita sin confirmación de TaJú.
