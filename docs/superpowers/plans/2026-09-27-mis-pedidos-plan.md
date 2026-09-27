# Mis pedidos | Plan de implementación

- Spec: `docs/superpowers/specs/2026-09-27-mis-pedidos-design.md`
- Rama: `feature/mis-pedidos`, sale de `dev`; PR a `dev`
- Método: TDD por tarea (test en rojo, código mínimo, verde), commit por tarea. Sin dependencias nuevas.

## Fase 1 | Servidor

| # | Tarea | Archivos | Test primero |
|---|---|---|---|
| 1.1 | `historialEstados` sin `actor` en `getMisPedidos` y `getPedidoById` | `pedidos.service.ts` | `pedidos.service.test.ts`: lista y detalle no traen `actor`; pedido ajeno sigue en 404 |

## Fase 2 | Base del cliente

| # | Tarea | Archivos | Test primero |
|---|---|---|---|
| 2.1 | Tipo `historialEstados` en `Pedido` | `types/index.ts` | cubierto por typecheck |
| 2.2 | `codigoPedido`, `SIGUIENTE_PASO`, `enCurso`, `avance`, fecha en palabras | `lib/pedido.ts` | `pedido.test.ts`: `_id` conocido a `TJ-XXXXXX`; seis estados con mensaje; `enCurso` y `avance` por estado |
| 2.3 | Fábrica de pedidos de prueba | `test/pedidos.ts` | usada por 3.x y 4.x |
| 2.4 | `useMisPedidos`: lista, cache atada al token (patrón de `useCatalogo`), `reintentar`, `pedidoEnMemoria(id)` | `hooks/useMisPedidos.ts` | `useMisPedidos.test.ts`: una llamada, error y reintento, cache por sesión, logout descarta |
| 2.5 | `usePedido`: detalle, 404 vs red, suscrito a la sesión (patrón de `useProducto`) | `hooks/usePedido.ts` | `usePedido.test.tsx`: inicial desde memoria, 404, red, logout descarta |

## Fase 3 | Lista

| # | Tarea | Archivos | Test primero |
|---|---|---|---|
| 3.1 | `LineaAvance` (seis tramos, atenuada si entregado) | `components/orders/LineaAvance.tsx` | en 3.2 |
| 3.2 | `TarjetaPedido`: un enlace, franja y silueta de familia, producto, código, badge, avance, próximo paso o fecha | `components/orders/TarjetaPedido.tsx` | `TarjetaPedido.test.tsx` |
| 3.3 | `MisPedidosPage` reescrita: cabecera con resumen, en curso y "Entregados", entrada escalonada, estados de carga, error y vacío tuteado | `pages/MisPedidosPage.tsx` | `MisPedidosPage.test.tsx` |

## Fase 4 | Detalle

| # | Tarea | Archivos | Test primero |
|---|---|---|---|
| 4.1 | `FranjaEspecificaciones` acepta pares etiqueta y valor; el detalle de producto pasa sus pares | `components/producto/FranjaEspecificaciones.tsx`, `ProductoDetailPage.tsx` | `ProductoDetailPage.test.tsx` sigue en verde |
| 4.2 | `LineaTiempoPedido`: cumplidos con fecha, actual con mensaje, futuros punteados, corte animado con reduced-motion | `components/orders/LineaTiempoPedido.tsx` | en 4.4 |
| 4.3 | `BloqueEntrega` y `AccionesPedido` (Pedir de nuevo, WhatsApp con código, barra móvil) | `components/orders/*.tsx` | en 4.4 |
| 4.4 | `PedidoDetallePage` y ruta protegida `/mis-pedidos/:id` | `pages/PedidoDetallePage.tsx`, `App.tsx` | `PedidoDetallePage.test.tsx`: historial, actual, entrega, WhatsApp, 404, red, pinta desde memoria |

## Fase 5 | Pedir de nuevo y Taller

| # | Tarea | Archivos | Test primero |
|---|---|---|---|
| 5.1 | `?desde=` precarga el formulario sin fecha ni imágenes; aviso de imágenes; producto inactivo con enlace; original ilegible abre vacío con aviso; "Elige una fecha" | `pages/PedidoFormPage.tsx` | `PedidoFormPage.test.tsx` |
| 5.2 | Columna "Código" en el panel | `pages/admin/AdminPedidosPage.tsx` | test de la columna |

## Fase 6 | Cierre

1. `AGENTS.md`: `components/orders/` en el mapa; riesgo de cache de pedidos atada al token si aplica la misma regla; nada de `location.state`.
2. Validación: `pnpm typecheck`, `pnpm lint`, `pnpm --filter taju-client test`, `pnpm --filter taju-server test` (incluye la prueba de carga), `pnpm build:client`, `grep -c '\.bg-accion' client/dist/assets/*.css`.
3. Capturas con Playwright y API simulada: lista y detalle en escritorio y 360 px; teclado, foco, contraste de franjas, sin scroll horizontal.
4. PR a `dev` con la plantilla habitual; seguir CI y CodeRabbit hasta verde.
