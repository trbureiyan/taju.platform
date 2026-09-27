# Catálogo y detalle | Plan de implementación

- Spec: `docs/superpowers/specs/2026-09-26-catalogo-detalle-design.md`
- Rama: `feature/catalogo`, sale de `feature/vitrina`; PR a `dev` después de #82
- Método: TDD por tarea, commit por tarea. Sin dependencias nuevas.

## Fase 1 | Base pura

| # | Tarea | Archivos | Test primero |
|---|---|---|---|
| 1.1 | `ErrorApi` con código de estado HTTP | `lib/api.ts` | `api.test.ts` |
| 1.2 | Filtrar (tildes y mayúsculas), ordenar, agrupar | `lib/catalogo.ts` | `catalogo.test.ts` |
| 1.3 | `partesPrecio`, `precioParaOrden` | `lib/precio.ts` | `precio.test.ts` |
| 1.4 | Etiquetas de especificaciones y referencia de torta | `lib/especificaciones.ts` | `especificaciones.test.ts` |
| 1.5 | `necesitamos` por familia | `vitrina/contenido.ts` | `contenido.test.ts` |

## Fase 2 | Catálogo

| # | Tarea | Archivos | Test primero |
|---|---|---|---|
| 2.1 | Estado en la URL | `hooks/useFiltrosCatalogo.ts` | `useFiltrosCatalogo.test.tsx` |
| 2.2 | Catálogo completo en una llamada, `reintentar` | `hooks/useCatalogo.ts` | `useCatalogo.test.ts` |
| 2.3 | Tarjeta: un enlace, silueta, precio por audiencia, estado de navegación | `catalog/ProductoCard.tsx` | `ProductoCard.test.tsx` |
| 2.4 | Cabecera, navegación de familias, barra, estantes, grilla, vacío | `catalog/*.tsx`, `CatalogoPage.tsx` | `CatalogoPage.test.tsx` |
| 2.5 | Eliminar `FiltroFamilia` | `catalog/FiltroFamilia*` | cubierto por 2.4 |

## Fase 3 | Detalle

| # | Tarea | Archivos | Test primero |
|---|---|---|---|
| 3.1 | Producto inicial por navegación, refresco, 404 vs red | `hooks/useProducto.ts` | `useProducto.test.tsx` |
| 3.2 | Galería, precio, antes de pedir, especificaciones, más de familia, barra móvil | `producto/*.tsx`, `ProductoDetailPage.tsx` | `ProductoDetailPage.test.tsx` |
| 3.3 | WhatsApp flotante oculto en el detalle | `Layout.tsx` | `Layout.test.tsx` |
| 3.4 | Transición `layoutId` tarjeta → detalle; se retira si no es fiable | `ProductoCard.tsx`, `GaleriaProducto.tsx` | verificación manual |

## Fase 4 | Cierre

1. `AGENTS.md`: `components/producto/`, `lib/catalogo.ts`, `ErrorApi`.
2. Validación: `pnpm typecheck`, `pnpm lint`, `pnpm --filter taju-client test`, `pnpm build:client`.
3. Capturas de catálogo y detalle en escritorio y móvil; 360px, teclado, contraste.
4. Mantener la rama al día con `feature/vitrina`; PR a `dev` cuando #82 esté mergeado.
