# Catálogo y detalle de producto | Diseño

- Fecha: 2026-09-26
- Estado: aprobado por secciones en brainstorming, pendiente de revisión final del documento
- Alcance: `/catalogo` y `/catalogo/:id`. Mis pedidos queda para un spec aparte.
- Depende de: `docs/superpowers/specs/2026-09-26-vitrina-design.md` (contenido por familia, siluetas, tokens de familia, `EsperaTaller`, `motion`)
- Fuentes normativas: `.docs/branding/01` a `04`, `AGENTS.md`

---

## 1. Contexto

El catálogo actual es un listado genérico. Tiene tres problemas de fondo. La tarjeta solo es clicable en el texto "Ver detalles". Las dos audiencias (identidad §3) se ven iguales, aunque una blonda por escala no es un topper por unidad. Y no hay nada que oriente: ni contexto de familia, ni conteo, ni búsqueda, ni orden. El placeholder de imagen viene de `placehold.co`, un servicio externo que AGENTS.md no permite. El detalle tiene buena base (migas, precio con escala, dimensiones, acción de pedido que respeta la sesión), pero muestra claves de base de datos crudas ("ocasion"), no tiene jerarquía, y ante un 404 o una caída de red devuelve al catálogo sin decir nada.

Una parte de lo "básico" visible en producción viene de otro lado: el bug de Tailwind que corrige el PR #81.

## 2. Supuestos y decisiones previas

1. **Volumen.** Entre 30 y 100 productos en el primer año. Es una hipótesis del equipo, no un dato del negocio. Búsqueda, orden y filtros se resuelven en el cliente, sin tocar la API. El paso a más de 100 (búsqueda en servidor, paginación) queda como cambio aislado.
2. **Enfoque "estante por familia"** (aprobado frente a panel lateral de filtros y a carruseles). La tipografía es la navegación (sweetgreen) y el color identifica la familia (The1), con los mismos tokens `--familia-*` de la Vitrina.
3. **Concepto rector heredado:** del trazo a la pieza. Sin foto, se ve la silueta en ruta de corte; con foto, la pieza.
4. **Sin fotografía de banco** (Pautas §5).

## 3. Tarjeta de producto (`ProductoCard`)

**Un solo enlace.** El nombre del producto es el único elemento interactivo; una capa transparente sobre él cubre toda la tarjeta, así el clic funciona en toda la superficie. El nombre accesible es el del producto. No se envuelve la tarjeta completa en `<a>`, porque el lector de pantalla leería todo su contenido de corrido.

**La imagen es la tarjeta.** Sin borde ni fondo. Imagen cuadrada con radio 20px (`radio-lg`), texto debajo sin caja. Sin foto, o si la foto falla, el cuadro toma el fondo de su familia con la silueta en ruta de corte (`PiezaSilueta`). Se elimina `placehold.co`.

**Contenido.** Nombre (hasta dos líneas), precio y ocasión como dato chico si existe. La descripción técnica sale de la tarjeta y queda completa en el detalle. La familia se muestra solo donde se mezclan familias (búsqueda u ocasión con "Todas"); dentro de un estante sería redundante.

**Precio por audiencia.**

| Caso | Texto |
|---|---|
| Unidad | "$45.000" |
| Escala | "$2.500 c/u · desde 12 unidades" más la etiqueta "Por volumen" en `contexto-suave` |
| Sin precio | "Te lo cotizamos" |

**Movimiento.** Hover: sube 4px con spring espacial rápido; si hay segunda foto, fundido hacia ella (solo `pointer: fine`). Primera carga: entrada escalonada con spring de efectos. Filtrar o buscar: reacomodo con animación de layout. Reduced-motion: todo directo.

**Grilla.** Dos columnas en teléfono, tres desde `md`, cuatro desde `xl`.

## 4. Página del catálogo

**Datos.** `useCatalogo()` trae todo el catálogo una vez (`GET /productos`) y la familia se filtra en el cliente. Cambiar de familia es instantáneo y no genera otra espera contra un servidor que puede estar despertando. El parámetro `familia` de la API se mantiene, pero el catálogo no lo usa.

**Estado en la URL.** `?familia=`, `?q=`, `?orden=`, `?ocasion=`. Se puede compartir, "atrás" deshace el último filtro, recargar no borra nada. El buscador reemplaza la entrada de historial en vez de apilarla.

**Cabecera.** Banda `superficie-calida` con "Catálogo" cuando están todas; con el fondo de la familia elegida cuando hay una. Nombre en `display-xl` y descripción de la familia tomada de `vitrina/contenido.ts` (fuente única). Debajo, navegación de familias en tipografía grande: "Todas, Toppers, Superficies, Señalética, Papelería". Son enlaces con `aria-current="page"`, no botones, porque cambian la URL. En teléfono, fila deslizable.

**Barra de herramientas.** Fija bajo el nav:

- buscador por nombre con etiqueta accesible;
- orden: "Recomendados" (orden del taller), "Precio: menor a mayor", "Precio: mayor a menor", "Nombre". Escala ordena por precio de entrada; "Te lo cotizamos" siempre al final;
- chips de ocasión existentes (`FiltroOcasion`);
- conteo "24 productos" en región `aria-live="polite"`.

**Estantes.** Con "Todas" y sin búsqueda ni ocasión: un estante por familia con cabecera (punto de color, nombre, conteo, "Ver los 12 toppers →"), una fila de hasta cuatro tarjetas. Con búsqueda u ocasión activa: una sola grilla con la familia visible en cada tarjeta.

**Estados.**

- Vacío: "No encontramos productos con ese filtro. Prueba quitando alguno o escríbenos y lo cotizamos a la medida.", botón "Quitar los filtros" y enlace a WhatsApp. Las Pautas asignan aquí la pose de señalamiento de la mascota; ese archivo no existe en `public/brand/`. El componente deja el espacio listo y el activo queda pendiente con el taller. No se sustituye por el isotipo, que tiene otro uso asignado.
- Error: mensaje sin voseo ni lenguaje de sistema y botón "Probar de nuevo" (`reintentar` de `useCatalogo`).
- Carga: `EsperaTaller`.

## 5. Detalle de producto

**Apertura instantánea.** El detalle toma el producto del catálogo en memoria de la sesión actual (`productoEnCatalogo`, ver sección 11). Se pinta con esos datos en el primer cuadro y refresca desde la API en segundo plano. Solo la entrada directa o la recarga muestran `EsperaTaller`.

**Transición tarjeta a detalle.** La imagen viaja de la tarjeta al detalle con `layoutId` (container transform de M3). Con reduced-motion el cambio es directo. **Riesgo registrado:** la animación de layout entre rutas es lo más frágil del spec. Si no resulta fiable en volver atrás, recarga o entrada por enlace, se retira y queda solo la apertura instantánea.

**Escritorio (estructura de Astra).**

- Izquierda: galería. Imagen grande sobre el fondo de la familia (o silueta), miniaturas debajo.
- Derecha: migas "Catálogo / Toppers / nombre"; nombre en `display-xl`; categoría chica; descripción; bloque de precio junto a la acción. Unidad: "$45.000". Escala: tabla con todas las escalas ("desde 12 unidades · $2.500 c/u"). Botón primario "Empezar mi pedido".
- "Antes de pedir": bloque en `contexto-suave` con los datos que se van a pedir para esa familia (toppers: diámetro, altura, nombre y edad, fecha). La lista vive en `contenido.ts` por familia. `[?]` pendiente de validar con el taller.
- Franja de especificaciones a todo el ancho (Sunloop). Claves traducidas por mapa (`ocasion` → "Ocasión"); una clave desconocida se muestra capitalizada. Dimensiones como referencia de torta: "22 cm, torta de media libra".
- "Más {familia}": fila de cuatro tarjetas de la misma familia.

**WhatsApp contextual.** Enlace en línea bajo la acción principal con mensaje prellenado: "Hola, tengo una pregunta sobre {nombre}". El flotante genérico se oculta en `/catalogo/:id`: sigue habiendo un solo WhatsApp en pantalla y además es el más útil.

**Móvil.** Galería arriba a todo el ancho, deslizable, con indicadores. Barra fija inferior con precio y "Empezar mi pedido" (Fitts). Sin el WhatsApp flotante, no se pisan.

**Estados.**

- No encontrado (404): "No encontramos este producto. Puede que el taller ya no lo esté ofreciendo." y enlace al catálogo.
- Error de red: mensaje de error y "Probar de nuevo".
- Hoy ambos casos redirigen en silencio al catálogo; eso se elimina.

## 6. Arquitectura

**Funciones puras.**

- `lib/catalogo.ts`: `filtrarProductos`, `ordenarProductos`, `agruparPorFamilia`. La búsqueda normaliza mayúsculas y tildes (NFD sin diacríticos): "senaletica" encuentra "Señalética".
- `lib/precio.ts`: se agregan `partesPrecio()` (tipo, valor, mínimo) y `precioParaOrden()`. `formatearPrecio` se mantiene donde ya se usa.
- `lib/especificaciones.ts`: mapa de etiquetas legibles y conversión de dimensión a referencia de torta.

**Hooks.**

- `useFiltrosCatalogo`: lee y escribe `familia`, `q`, `orden`, `ocasion` en la URL; valores inválidos caen al valor por defecto.
- `useCatalogo()`: sin parámetro, trae todo, expone `reintentar`.
- `useProducto(id, inicial)`: arranca con el producto del catálogo en memoria de esta sesión si existe, refresca en segundo plano, distingue cargando, no encontrado y error de red.

**API.** `lib/api.ts` lanza un error que conserva el código de estado HTTP (`ErrorApi`), para distinguir 404 de caída de red. No toca el módulo de auth.

**Componentes.**

- `components/catalog/`: `ProductoCard` (rehecho), `CabeceraCatalogo`, `NavFamilias`, `BarraCatalogo`, `EstanteFamilia`, `GrillaProductos`, `EstadoVacioCatalogo`. Se elimina `FiltroFamilia` (y su test), reemplazado por `NavFamilias`.
- `components/producto/`: `GaleriaProducto`, `BloquePrecio`, `AntesDePedir`, `FranjaEspecificaciones`, `MasDeFamilia`, `BarraPedidoMovil`.
- `vitrina/contenido.ts`: suma `necesitamos` por familia.
- `Layout.tsx`: oculta el WhatsApp flotante en `/catalogo/:id`.

## 7. Pruebas

TDD con Vitest y Testing Library:

1. Búsqueda insensible a mayúsculas y tildes; filtro por familia y ocasión combinados.
2. Orden por precio: escala por precio de entrada, "Te lo cotizamos" al final en ambos sentidos.
3. Agrupación por familia en el orden del enum.
4. `partesPrecio` para unidad, escala y sin precio.
5. Etiquetas de especificaciones (conocidas y desconocidas) y referencia de torta.
6. `useFiltrosCatalogo`: la URL es la fuente del estado; valores inválidos caen al defecto.
7. `ProductoCard`: un solo enlace con el nombre del producto; silueta sin foto o con foto rota; etiqueta "Por volumen" en escala.
8. Catálogo: estantes con "Todas"; grilla al buscar; conteo actualizado; "Quitar los filtros" limpia la URL; "Probar de nuevo" vuelve a pedir.
9. Detalle: pinta al instante con el catálogo en memoria de esta sesión, nunca con un producto guardado en el historial; 404 y error de red muestran mensajes distintos; tabla de escalas visible; "Antes de pedir" según familia.
10. WhatsApp flotante ausente en `/catalogo/:id` y presente en `/catalogo`.

Criterios manuales: 360px sin scroll horizontal; foco visible; navegación por teclado de familias, buscador, orden y tarjetas; contraste de tinta sobre fondos de familia (ya verificado en la Vitrina).

## 8. Rama y entrega

`feature/catalogo` sale de `feature/vitrina`, porque depende de piezas que aún no están en `dev`. El PR a `dev` se abre cuando #82 esté mergeado; mientras tanto la rama se mantiene al día con su base.

## 9. Pendientes con el taller

- Pose de señalamiento de la mascota (estado vacío).
- Listas de "Antes de pedir" por familia.
- Confirmar que el orden "Recomendados" (orden en que el taller carga los productos) le sirve, o si prefiere marcar destacados desde el admin (fuera de este spec).

## 10. Fuera de alcance

- Mis pedidos y "repetir pedido" (spec aparte).
- Búsqueda en servidor, paginación e índices (solo si el catálogo supera los 100 productos).
- Coverflow (Skiper47): descartado para familias y para el listado; puede reevaluarse para destacados.

## 11. Desviaciones durante la implementación

- **Transición tarjeta → detalle retirada**, como preveía el riesgo de la sección 5. En el navegador, además de la imagen elegida, las tarjetas de "Más {familia}" volaban desde sus posiciones en el catálogo (comparten `layoutId`) y la imagen cruzaba por encima del título. Queda la apertura instantánea.
- **Scroll al navegar**: `BrowserRouter` no maneja el scroll y el detalle se abría a la altura de la tarjeta. `ScrollAlInicio` sube la página al avanzar (PUSH) y respeta la posición al volver (POP).
- **Catálogo en memoria**: `useCatalogo` recuerda el último resultado; volver del detalle pinta al instante y el navegador puede restaurar la posición en la lista. La memoria va atada al token de sesión: con sesión de administrador `/productos` incluye inactivos, y un login o logout la descarta y vuelve a pedir.
- **Apertura instantánea sin `Link state`**: el producto en el estado de navegación queda en el historial del navegador y sobrevive al cierre de sesión, así que volver atrás podía pintar un producto inactivo que abrió el administrador. El detalle lo toma del catálogo en memoria de la sesión actual; `useProducto` también descarta el producto cuando cambia la sesión.
- **Un solo botón amarillo en el detalle móvil**: el botón en línea se oculta en teléfono porque la barra fija ya lleva "Empezar mi pedido".
- **La búsqueda también mira el nombre de la categoría** ("blonda" encuentra productos de la categoría "Blondas").
