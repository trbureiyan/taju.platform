# Mis pedidos | Diseño

- Fecha: 2026-09-27
- Estado: aprobado por TaJú, sección por sección
- Alcance: lista en `/mis-pedidos`, detalle en `/mis-pedidos/:id`, "Pedir de nuevo" y código de pedido compartido con el panel de Taller
- Fuera de alcance: código secuencial almacenado, reutilizar imágenes de referencia al repetir, cambios en `crearPedido`, auth o el modelo `Pedido`

## 1. Problema

La página actual lista pedidos pero no permite seguirlos:

- No hay detalle, aunque `GET /pedidos/:id` existe y solo responde al dueño.
- `historialEstados` se guarda en cada pedido y el cliente nunca lo ve: no sabe cuándo pasó a producción.
- Muestra la categoría y no el producto: dos toppers distintos se ven iguales.
- No hay código de pedido; la marca asigna JetBrains Mono a los códigos y hoy solo existe el `_id` de Mongo.
- El vacío dice "Aún no tenés pedidos" (voseo), contra la regla de tutear.
- El cliente profesional "necesita repetir pedidos rápido" (AGENTS.md) y no tiene cómo.

## 2. Decisiones

1. Seguimiento como núcleo y "Pedir de nuevo" como una sola acción del detalle (opción C).
2. **Código derivado del `_id`** (opción A): `TJ-` + últimos 6 caracteres en mayúscula, por ejemplo `TJ-3F9A2C`. Una sola función `codigoPedido()` que usan cliente y panel de Taller.
3. Ruta por pedido (`/mis-pedidos/:id`) sobre el endpoint existente; "Pedir de nuevo" viaja por la URL (`?desde=`), nunca por `location.state`.
4. Estética en la línea de Vitrina y catálogo: color de familia, silueta en ruta de corte, springs y presión del sistema M3 Expressive.

### 2.1 Por qué el código derivado y no uno secuencial

El código existe para una cosa: que cliente y taller nombren el mismo pedido por WhatsApp. El derivado lo cumple sin tocar la base de datos ni la creación de pedidos.

Un código secuencial (`TJ-1042`) se dicta mejor y ordena, pero exige:

- un contador dentro de la transacción de `crearPedido`, que ya compite con la clave de idempotencia (la prueba de carga de 50 requests concurrentes lo expondría);
- un índice único parcial, porque uno común falla al arrancar contra los pedidos existentes sin código;
- una migración de datos que corre TaJú a mano;
- decidir un número inicial para no revelar el volumen del taller.

Nada de eso resuelve una necesidad actual del taller. Los límites del derivado (no es consecutivo, no cuenta pedidos) no afectan su operación: el panel ya ordena por fecha y muestra cliente y producto junto al código. Con 6 caracteres hexadecimales, una colisión es despreciable al volumen del taller, y aun así el pedido queda identificado por cliente y fecha.

## 3. Lista (`/mis-pedidos`)

- **Cabecera**: patrón de `CabeceraCatalogo`, título "Mis pedidos" y resumen "Tienes N pedidos en camino" (se oculta sin pendientes).
- **Tarjeta**, un solo enlace a su detalle:
  - franja lateral con el color de la familia (`--familia-*-fondo`) y `PiezaSilueta` de la familia en ruta de corte;
  - nombre del producto, etiqueta de familia, código en JetBrains Mono;
  - badge de estado (`ETIQUETAS_ESTADO`, `CLASES_ESTADO`);
  - línea de avance de seis tramos llena hasta el estado actual;
  - lo próximo que el cliente necesita saber: la fecha de entrega si existe; si no, el mensaje de `SIGUIENTE_PASO[estado]`.
- **Orden**: en curso primero; debajo, bajo "Entregados", los entregados con tarjeta sin franja, silueta en color terciario y avance completo atenuado.
- **Movimiento**: entrada escalonada con resorte `efectos normal`; presión `scale-97` con `ease-estandar`; con movimiento reducido todo aparece en su lugar.
- **Estados**: `EsperaTaller` al cargar; error con "Probar de nuevo"; vacío "Aún no tienes pedidos" con enlace al catálogo.

### 3.1 Mensajes por estado (`SIGUIENTE_PASO`, junto a `ETIQUETAS_ESTADO`)

| Estado | Mensaje |
|---|---|
| `recibido` | Lo estamos revisando. Te escribimos por WhatsApp si nos falta algo. |
| `en_revision` | Estamos revisando los detalles de tu pedido. |
| `confirmado` | Tu pedido está confirmado. Pronto empieza a cortarse. |
| `en_produccion` | Ya estamos cortando tu pedido. |
| `listo_para_entrega` | Ya está listo. Te escribimos para coordinar la entrega. |
| `entregado` | Entregado. Gracias por pedir con nosotros. |

[?] Textos a validar con el taller junto con las listas de "Antes de pedir".

## 4. Detalle (`/mis-pedidos/:id`)

- **Cabecera**: franja de color de familia a lo ancho del contenedor (sin sangre), nombre del producto como H1, código en JetBrains Mono, badge de estado.
- **Línea de tiempo** vertical de seis estados en ruta de corte:
  - cumplidos con su fecha tomada de `historialEstados` ("Confirmado, 14 de octubre");
  - actual resaltado, con el mensaje de `SIGUIENTE_PASO`;
  - futuros con trazo punteado y texto terciario;
  - la línea "se corta" hasta el estado actual con resorte `efectos lento`; con movimiento reducido aparece dibujada.
- **Entrega**: "Entrega prevista: viernes 18 de octubre" si `fechaEntrega` existe; si no, "Te confirmamos la fecha por WhatsApp apenas pase a producción". No se distingue fecha pedida de fecha confirmada: el formulario guarda la del cliente en `fechaEntrega` y el taller la sobrescribe en el mismo campo, así que el texto no afirma una confirmación que el dato no garantiza.
- **Lo que pediste**: medida con referencia de torta cuando aplica y "(medida personalizada)" si lo es, cantidad, colores, materiales, descripción completa, imágenes de referencia como miniaturas que abren la imagen. Se reusa la presentación de `FranjaEspecificaciones`, generalizada para recibir pares etiqueta y valor en vez de un `Producto`.
- **Acciones**: primaria "Pedir de nuevo"; secundaria "Escríbenos por este pedido" (WhatsApp con "Hola, les escribo por mi pedido TJ-3F9A2C (Topper luna)."). En móvil, barra fija con un solo botón amarillo, como `BarraPedidoMovil`.
- **Estados**: 404 (inexistente o de otro cliente, el servidor no distingue) "No encontramos este pedido" con enlace a Mis pedidos; error de red con "Probar de nuevo"; pinta al instante si el pedido está en la memoria de la lista de esta sesión (cache atada al token, misma regla que `useCatalogo`).

## 5. Pedir de nuevo

- Enlace a `/pedido/:productoId?desde=:pedidoId`. El formulario pide `GET /pedidos/:pedidoId` y precarga medida (predefinida o personalizada), cantidad, colores, materiales y descripción.
- No se precargan la fecha deseada (la anterior ya pasó) ni las imágenes; en su lugar: "Si quieres usar las mismas imágenes de referencia, adjúntalas de nuevo."
- Medida personalizada se precarga como personalizada: el taller la confirma de nuevo, porque la confirmación era del pedido anterior.
- Producto inactivo o borrado: el mensaje actual del formulario más un enlace al catálogo.
- Pedido original ilegible (404 o red): el formulario abre vacío con un aviso breve, sin bloquear.
- El formulario ya se toca: su error de fecha usa voseo ("Elegí una fecha…") y pasa a "Elige una fecha…".
- Idempotencia intacta: el pedido repetido es un pedido nuevo; la clave cubre el payload completo.

## 6. Servidor

- `getMisPedidos` y `getPedidoById` proyectan `historialEstados` sin `actor` (id del administrador): quedan `estadoAnterior`, `estadoNuevo`, `fecha`.
- Sin cambios en el modelo, los índices, `crearPedido` ni auth.

## 7. Cliente | unidades

| Unidad | Responsabilidad |
|---|---|
| `lib/pedido.ts` | `codigoPedido`, `SIGUIENTE_PASO`, `enCurso`, `avance` (índice del estado), fecha en palabras |
| `types` | `Pedido.historialEstados` sin `actor` |
| `hooks/useMisPedidos.ts` | lista, cache atada al token, `reintentar`, `pedidoEnMemoria(id)` |
| `hooks/usePedido.ts` | detalle por id, 404 vs red, suscrito a la sesión |
| `components/orders/` | `TarjetaPedido`, `LineaAvance`, `LineaTiempoPedido`, `BloqueEntrega`, `AccionesPedido` |
| `components/producto/FranjaEspecificaciones` | acepta pares etiqueta y valor |
| `pages/MisPedidosPage.tsx` | lista reescrita |
| `pages/PedidoDetallePage.tsx` | nuevo, ruta protegida |
| `pages/PedidoFormPage.tsx` | lee `?desde=` y precarga |
| `pages/admin/AdminPedidosPage.tsx` | columna "Código" |

## 8. Pruebas

- Puras: `codigoPedido` con `_id` conocido; `SIGUIENTE_PASO` cubre los seis estados; `enCurso` y `avance` por estado.
- Servidor: historial sin `actor` en lista y detalle; pedido ajeno da 404.
- Lista: producto y código, orden en curso antes que entregados, resumen, vacío tuteado, carga y error con reintento.
- Detalle: fechas del historial, actual marcado, futuros pendientes, entrega prevista o mensaje sin fecha, WhatsApp con código, 404 y red, pinta desde la memoria de la sesión.
- Pedir de nuevo: precarga sin fecha ni imágenes, producto inactivo con enlace, original ilegible abre vacío con aviso.
- Admin: columna "Código".
- Antes del PR: typecheck, lint, suites de cliente y servidor (incluida la prueba de carga), build, clases de marca compiladas, capturas con Playwright en escritorio y 360 px (sin scroll horizontal, teclado, foco, contraste de las franjas).

## 9. Rama y entrega

`feature/mis-pedidos` desde `dev`, PR a `dev`, un commit por tarea. Comparte con #84 solo `AGENTS.md`, en líneas distintas.

## 10. Pendientes con el taller

- Textos de `SIGUIENTE_PASO` (sección 3.1).
