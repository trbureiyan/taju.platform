# Vitrina | Plan de implementación

- Spec: `docs/superpowers/specs/2026-09-26-vitrina-design.md`
- Rama: `feature/vitrina`, sale de `dev`, vuelve a `dev` por PR
- Método: TDD por tarea (test rojo, código mínimo, verde), commit por tarea

La implementación se divide en tres fases. La fase 1 no necesita dependencias nuevas y deja la Vitrina completa en su estado estático, que es exactamente el estado de reduced-motion del spec. La fase 2 suma `motion` y requiere la acción manual de instalación. La fase 3 cierra documentación, validación y PR.

## Fase 1 | Sin dependencias nuevas

| # | Tarea | Archivos | Test primero |
|---|---|---|---|
| 1.1 | Tokens nuevos (display xl/2xl, tracking e interlineado display, fondos por familia, superficie y texto invertidos) y su puente en Tailwind. Archivo de enmiendas para `.docs/` local | `tokens.css`, `tailwind.config.js`, `specs/...-enmiendas-branding.md` | No aplica (sin lógica) |
| 1.2 | `?familia=` sincronizado con la URL, valores inválidos caen a "Todos". Copy de error sin voseo ni lenguaje de sistema | `CatalogoPage.tsx`, `lib/familia.ts` | `CatalogoPage.test.tsx`, `familia.test.ts` |
| 1.3 | `useDespertarServidor`: `origen + '/health'`, una vez por carga, silencioso, corte a 60 s, comentario `[DECISION]` | `hooks/useDespertarServidor.ts` | `useDespertarServidor.test.ts` |
| 1.4 | `EsperaTaller` con tres tiempos y `role="status"`; reemplaza el "Cargando productos..." del catálogo | `shared/EsperaTaller.tsx`, `CatalogoPage.tsx` | `EsperaTaller.test.tsx` |
| 1.5 | `Layout` sin contenedor forzado en `/`, footer global, despertador montado una vez; footer y WhatsApp ocultos en `/admin` | `Layout.tsx`, `shared/Footer.tsx` | `Layout.test.tsx` |
| 1.6 | "Ingresar" como acción secundaria | `Nav.tsx` | cubierto por 1.9 |
| 1.7 | `/` renderiza `VitrinaPage`; rutas de admin con `React.lazy` | `App.tsx` | cubierto por 1.9 |
| 1.8 | `contenido.ts` tipado sobre `Familia` | `vitrina/contenido.ts` | `contenido.test.ts` |
| 1.9 | Bloques estáticos: hero (aparición CSS), cinta (bucle CSS con pausa), escenario (tablist por teclado, fondo por familia, revelado CSS), manifiesto, franja, frases (lista), página | `vitrina/*.tsx`, `pages/VitrinaPage.tsx` | `VitrinaPage.test.tsx`, `EscenarioFamilias.test.tsx`, `Cinta.test.tsx` |

La cinta se resuelve en CSS: un SVG con la onda repetida dos veces se traslada −50% en bucle y se pausa con `animation-play-state`. No necesita `motion`, así que sale del alcance de la fase 2.

## Fase 2 | Con `motion` (requiere acción manual)

```text
MANUAL ACTION REQUIRED:
1. Run: pnpm --filter taju-client add motion@<versión exacta>
2. Verify: package.json sin ^ ni ~, pnpm-lock.yaml actualizado
3. Confirm before I continue with the next step
```

| # | Tarea |
|---|---|
| 2.1 | `lib/movimiento.ts`: lectura de curvas y duraciones desde CSS, springs M3 Expressive verificados contra la documentación, `MotionConfig reducedMotion="user"` en la raíz, `LazyMotion` |
| 2.2 | Hero: caída escalonada de piezas con spring espacial |
| 2.3 | `TechText` en el nombre de familia, solo `(pointer: fine)`; trazo único en móvil |
| 2.4 | Manifiesto: revelado por palabra con `useScroll` |
| 2.5 | Frases: sección sticky con desenfoque en escritorio |
| 2.6 | Escenario en móvil: deslizar con snap |

Cada tarea mantiene el test de reduced-motion en verde: con la preferencia activa el resultado es idéntico al de la fase 1.

## Fase 3 | Cierre

1. `AGENTS.md`: mapa con `components/vitrina/`, `lib/movimiento.ts`, despertador del servidor, springs en la nota de M3 Expressive.
2. Validación: `pnpm typecheck`, `pnpm lint`, `pnpm --filter taju-client test`, `pnpm build:client`.
3. Criterios manuales del spec (LCP, pausa, teclado, 360px, contraste) con capturas en el PR.
4. PR `feature/vitrina` → `dev`.
