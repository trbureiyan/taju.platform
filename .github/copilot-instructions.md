# taju.platform — Copilot Instructions

taju.platform es la plataforma web MERN de **TaJú**, taller de corte y grabado láser en Neiva (Huila) que produce papelería y objetos personalizados para celebraciones y eventos. Cubre la Vitrina (landing pública), el catálogo, el módulo parametrizado de Pedidos con seguimiento del cliente, y el panel interno de Taller. Proyecto Integrador II, Ingeniería de Software, Universidad Surcolombiana.

Fuente de verdad completa: `AGENTS.md` (convenciones, riesgos, dominio) y `ARCHITECTURE.md` (arquitectura del server, seguridad, despliegue). Este archivo es un resumen operativo para sugerencias de Copilot; ante cualquier discrepancia, `AGENTS.md` gana.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 4 (`@tailwindcss/vite`), React Router 7 |
| Movimiento | `motion` (springs Material Design 3 Expressive), `lucide-react` (iconos) |
| Backend | Node.js 20 LTS, TypeScript, Express 4 |
| Base de datos | MongoDB Atlas, Mongoose ODM |
| Almacenamiento | Cloudinary (imágenes de referencia de pedido) |
| Autenticación | JWT en memoria del cliente, sin `localStorage` ni cookies |
| Validación | Zod (server), bcryptjs para contraseñas |
| Analítica | Vercel Web Analytics |
| Package manager | pnpm 11 (monorepo con workspaces `client`/`server`) |
| Testing | Vitest — jsdom + Testing Library (client), mongodb-memory-server como replica set (server) |

## Arquitectura

**Flujo de datos (server):** `routes/index.ts` (monta cada módulo bajo `/api`) → `modules/<dominio>/*.routes.ts` → `*.controller.ts` (request/response, valida con Zod) → `*.service.ts` (lógica de negocio) → `models/` (Mongoose) → MongoDB Atlas. Tres módulos: `auth/`, `catalog/`, `pedidos/`. No hay capa `repositories/` separada — el servicio habla directo con el modelo.

**[DECISION]** Los pedidos persisten snapshots embebidos de `producto` y `categoria` (no referencias vivas): si el catálogo cambia después, el histórico del pedido no se altera.

Los documentos normativos viven en `.docs/` (gitignoreado) y `docs/superpowers/` (versionado). `.docs/branding/` es normativo: una decisión de implementación que lo contradiga está mal, no el documento. No editar `.docs/branding/` sin confirmación explícita del usuario. `.docs/WALKTHROUGH.md` guarda estado sensible de infraestructura (Atlas, Render, Vercel) — leerlo antes de cualquier tarea de despliegue.

**Sistema visual:** fuente única de verdad es `.docs/branding/04-tokens-de-diseno.md`. Los valores viven en `client/src/styles/tokens.css` como custom properties; `client/tailwind.config.js` los consume por referencia (`var(--…)`), sin duplicarlos. Los componentes consumen solo tokens semánticos (`--accion-fondo`, `--texto-principal`), nunca primitivos (`--amarillo-500`, `--space-4`). Si falta un token semántico, crearlo — no usar la primitiva directo.

**Dirección de interacción:** Material Design 3 Expressive gobierna forma y movimiento (radios, `scale-97` de presión, curvas `ease-estandar`/`ease-entrada`, springs de `client/src/lib/movimiento.ts`), nunca color ni tipografía — esos son fijos por `.docs/branding/`.

**Autenticación:** JWT en memoria del módulo cliente (`lib/api.ts`). Al recargar la página se pierde la sesión — es intencional. Dos roles: `cliente` y `administrador`. Rutas de taller exigen `administrador`; acceso no autorizado da `401`/`403`.

**Imágenes de pedido:** JPG, máx. 5 MB, hasta 3 por pedido, validadas por MIME y magic bytes, subidas a Cloudinary.

## Dominio

El dominio se nombra en español y el término es **idéntico** en el modelo Mongoose, la ruta Express, el tipo TypeScript y el texto de interfaz. No hay capa de traducción; si aparece una, es un error de diseño.

### Catálogo — cuatro familias. No inventar categorías fuera de esta lista.

| Familia | Incluye |
|---|---|
| `toppers` | Cake toppers en MDF y acrílico |
| `superficies` | Blondas de MDF grabadas, bases |
| `senaletica` | Letreros, banners, letras en vinilo, números |
| `papeleria` | Invitaciones, tarjetas tipo VIP, llaveros, cajas, vasos |

### Estados de pedido — enum canónico. Mismo valor en BD, API y UI.

```ts
type EstadoPedido =
  | 'recibido'
  | 'en_revision'
  | 'confirmado'
  | 'en_produccion'
  | 'listo_para_entrega'
  | 'entregado'
  | 'cancelado';
```

Etiquetas: Recibido, En revisión, Confirmado, En producción, Listo para entrega, Entregado, Cancelado (los seis primeros son el flujo, `FLUJO_PEDIDO`; `cancelado` es una salida) — derivadas de `ETIQUETAS_ESTADO`, nunca escritas sueltas en un componente. El cliente ve su `historialEstados` sin el campo `actor` (dato interno del taller); el código de pedido compartido con el taller por WhatsApp sale de `codigoPedido()` (`lib/pedido.ts`), derivado del `_id` (`TJ-XXXXXX`), nunca formateado a mano.

### Vocabulario de especificación

`diametro` y `altura` en centímetros, enteros. Campos canónicos: `medida`, `referencia`, `material`, `acabado`, `personalizacion`, `fechaEntrega`, `nota`.

### Dos audiencias

**Cliente final:** compra por unidad, carga emocional alta, necesita acompañamiento en la especificación.

**Cliente profesional:** volumen, escalas de precio por cantidad. La familia `superficies` tiene precio por escala y cantidad mínima (12 unidades). Cualquier componente de precio debe soportar ambos modelos.

## Sistema visual

Reglas obligatorias antes de crear o modificar cualquier componente visual.

| Regla |
|---|
| Texto sobre color de marca siempre en tinta (`--tinta-900`). Nunca blanco sobre `--accion` ni `--contexto`. |
| No usar la paleta cruda de Tailwind (`bg-yellow-400`, `text-gray-600`, etc.). Todo vía tokens semánticos. |
| No usar hexadecimales literales en componentes. Solo dentro de `tokens.css`. |
| Espaciado solo de la escala base 4: 1, 2, 3, 4, 6, 8, 12, 16, 24. Nada arbitrario. |
| Objetivo táctil mínimo 44px en botones y campos. |
| Foco visible en todo elemento interactivo. No anular `outline: none` sin sustituto. |
| Cifras tabulares en precios y medidas (`font-variant-numeric: tabular-nums`). |
| Solo una acción primaria por pantalla. |
| Turquesa es color de contexto, nunca de acción. |
| Rosa máximo una aparición por pantalla, nunca en elementos estructurales ni de sistema. |

> [!CAUTION]
> **Verona** es la serif del wordmark, comercial y sin licencia web. El logotipo existe como trazado vectorial en `public/brand/`. **Nunca componer texto vivo en Verona** ni declararla en CSS.

**Tipografía:** Poppins (400, 500, 600) para todo; JetBrains Mono para códigos de pedido e identificadores. Ambas por Google Fonts.

**Activos de marca** en `public/brand/`: `taju-isotipo.svg` (símbolo solo, <120px de ancho o favicon), `taju-isotipo-monocromático.svg` (fondos oscuros), `taju-imagotipo.svg` (uso general), `taju-imagotipo-v2.svg` (variante vertical), `taju-logotipo-completo.svg`, `taju-logotipo-only-taju.svg`. Nunca editar estos archivos.

**Iconos:** Lucide React, trazo uniforme de 2px. No mezclar sets ni incrustar SVG sueltos de origen distinto.

**Mascota:** fuera de esta versión del proyecto (decisión de TaJú, 2026-09-27). Ningún componente la usa ni le reserva espacio, aunque `.docs/branding/` le asigne poses.

**En `components/admin/` (panel Taller):** sin acento rosa. Criterio rector: legibilidad operativa bajo presión de entrega.

## Convenciones de componentes

Antes de crear un componente nuevo, revisar los primitivos en `client/src/components/ui/`.

No usar `@apply` de Tailwind para abstraer clases repetidas — si un patrón visual se repite, extraerlo a un componente React.

| Ubicación | Contenido |
|---|---|
| `components/ui/` | Primitivos compartidos: Button, Input, Badge... |
| `components/catalog/` | Catálogo: tarjeta, estantes, barra de filtros, navegación de familias |
| `components/producto/` | Detalle de producto: galería, precio por escala, antes de pedir, especificaciones |
| `components/orders/` | Seguimiento de pedidos: tarjeta, línea de avance, línea de tiempo, entrega, acciones |
| `components/admin/` | Panel de taller |
| `components/vitrina/` | Bloques de la landing en `/` + `contenido.ts` (texto por familia, fuente única) |
| `components/shared/` | Layout, nav, footer, `EsperaTaller`, feedback genérico |

Respetar `prefers-reduced-motion` en cualquier transición o animación.

## Nomenclatura

- Componentes: PascalCase, archivos y exports (`TarjetaPedido.tsx`)
- Hooks: camelCase con prefijo `use` (`useMisPedidos.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Tipos: interfaces PascalCase, archivos camelCase (`pedido.types.ts`)
- Rutas de API: lowercase con guiones (`/api/pedidos/:id/estado`)
- Variables de entorno: SCREAMING_SNAKE_CASE

## Comandos

| Comando | Propósito | Notas |
|---|---|---|
| `pnpm dev:client` | Vite dev server | Puerto 5173 |
| `pnpm dev:server` | tsx watch | Puerto 3001 |
| `pnpm build:client` | Build de producción del frontend | Correr antes de todo push |
| `pnpm typecheck` | `tsc --noEmit` en client y server | Corre en el hook pre-push |
| `pnpm lint` | eslint en client y server | Corre en el hook pre-push |
| `pnpm --filter taju-client test` | Vitest + jsdom | `test:watch` para modo interactivo |
| `pnpm --filter taju-server test` | Vitest + mongod en memoria | Incluye la prueba de carga de pedidos |
| `pnpm db:local` | Crea colecciones e índices en MongoDB local | Idempotente, exige replica set — ver comandos peligrosos |
| `pnpm seed:dev` | Puebla `taju-dev` con datos de muestra | Idempotente — ver comandos peligrosos |

`husky` corre `pnpm typecheck && pnpm lint` antes de cada `git push` (`.husky/pre-push`), instalado solo vía `pnpm install`.

### Comandos peligrosos

> [!CAUTION]
> Los siguientes comandos modifican datos o esquema de base de datos, o requieren una acción remota irreversible. **Nunca ejecutar autónomamente sin confirmación explícita del usuario.**

| Acción | Razón |
|---|---|
| `pnpm db:local`, `pnpm seed:dev` | Mutación de datos |
| Editar `.env` o `.env.example` | Contiene secretos |
| Editar módulos de auth o JWT | Afecta todas las rutas autenticadas |
| Git push, merge o deploy | Operaciones remotas irreversibles |
| Instalar nuevas dependencias | Requiere `pnpm install` + commit del lockfile |

```text
MANUAL ACTION REQUIRED:
1. Run: {comando exacto}
2. Verify: {qué verificar}
3. Confirm before I continue with the next step
```

## Variables de entorno

Copiar `server/.env.example` a `server/.env`: `NODE_ENV`, `PORT`, `MONGO_URI`, `JWT_SECRET`/`JWT_EXPIRES_IN`, las tres de Cloudinary, `CLIENT_URL`.

## Supply chain y dependencias

Versiones exactas en `package.json`: sin `^` ni `~`. Commitear el lockfile con cada cambio que toque el manifiesto. Sin dependencias por CDN — todo se instala como paquete npm y se bundlea.

## Código

Comentarios explican el *por qué* y el *qué no obvio*, nunca el *cómo*. Un comentario que reitera lo que ya dice el código es ruido.

```ts
// el cliente manda el token en memoria; si recarga, pierde la sesión — es intencional
// esDimensionPersonalizada bloquea el avance a "en_produccion" hasta confirmación del admin
// subdocumento embebido intencional: preserva snapshot de categoría al momento del pedido
```

Marcadores ASCII: `[!]` peligroso, `[?]` incierto, `[x]` deprecado, `-->` redirección.

JSDoc documenta el contrato público: qué hace, parámetros, valor de retorno, excepciones.

Decisiones de diseño no obvias, junto al punto de decisión, nunca en un ADR aparte:

```ts
// [DECISION] {elección} — {por qué}. {tradeoff o acción futura}.
```

## Microcopy y UI

Fuente completa: `.docs/branding/03-voz-de-marca.md`.

Tutear siempre. Primera persona del plural: "te confirmamos", nunca "se confirmará" ni "TaJú confirma". **Nunca culpar al usuario** — el error es del sistema o de la marca.

Mensajes de error: qué pasó → por qué importa → qué hacer. Sin signos de exclamación.

```text
MAL:  Campo obligatorio
BIEN: Nos falta el diámetro de tu torta. Sin ese dato no podemos calcular la proporción del topper.
```

Botones describen la acción concreta: "Enviar mi pedido", no "Enviar". Prohibido: anglicismos con equivalente natural, lenguaje corporativo vacío, lenguaje de sistema expuesto (procesar, validar, transacción), voz pasiva refleja, más de un signo de exclamación por pantalla. Excepción única: **cake topper** se mantiene en inglés.

En `components/admin/` el tono se apaga: funcional y neutro.

## Commits y PRs

Formato: `<type>: <qué cambió, máx. 72 chars>`, con cuerpo explicando el *por qué*.

Types: `feature`, `fix`, `hotfix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`.

```text
feature: add file type validation to order image upload

- Valida tipos de archivo permitidos para imágenes del catálogo.
- Retorna 400 si el formato no coincide con el mime-type esperado.
```

Malos patrones: título > 72 chars, storytelling ("resolved an issue where…"), cuerpo vago ("various improvements").

Cada PR debe pasar: `lint` + `typecheck` + `build` + `test`.

## Verificar antes de corregir

1. Leer el código actual, no suponer sobre él.
2. Confirmar que el hallazgo sigue siendo válido — el código pudo cambiar desde que se observó.
3. Si es inválido: saltar con `// [SKIP] Already handled in {file}:{line}`.
4. Si es válido: corregir con cambios mínimos, sin refactorizar código adyacente salvo que la corrección lo exija.
5. Validar con el test o comando relevante.
6. Reportar qué se corrigió, qué se saltó y por qué.

## TDD y validación

Flujo: escribir el test (rojo) → código mínimo que lo pasa (verde) → refactorizar si hace falta → correr la suite completa antes de commitear.

Ubicación: `*.test.ts(x)` junto al archivo que prueban. Mocking de Cloudinary: interceptar `lib/cloudinary.ts` completo, nunca llamadas reales. Mocking de DB: `MongoMemoryReplSet` — un standalone rechaza las transacciones que usa `crearPedido`.

**Antes de declarar el trabajo completo:**

1. `pnpm typecheck` — sin errores de tipos.
2. `pnpm lint` — sin errores.
3. `pnpm --filter taju-client test` y `pnpm --filter taju-server test` — todo en verde.
4. `pnpm build:client` — build de producción exitoso.

## Áreas de riesgo conocidas

- **Auth / JWT:** token en memoria del cliente, sin persistencia. Cualquier cambio en el payload afecta todas las rutas autenticadas.
- **RBAC:** `server/src/middleware/rbac.ts` valida el rol `administrador` en rutas de taller.
- **Cloudinary:** llamadas reales solo en producción; en tests, interceptar el módulo completo.
- **MongoDB Atlas:** `MONGO_URI` define el entorno de destino. Un seed o reset en producción es irreversible.
- **Tokens de diseño:** `tokens.css` y `.docs/branding/04-tokens-de-diseno.md` deben coincidir — una discrepancia es un error, no una ambigüedad.
- **Estados de pedido:** el enum TypeScript, el campo Mongoose y las etiquetas UI deben ser el mismo string.
- **Idempotencia de pedidos:** `crearPedido` reserva una clave (hash del payload + archivos) en una transacción; un envío idéntico en 60s recibe 409. Requiere replica set.
- **Escala de precios:** `superficies` opera por cantidad (mínimo 12 unidades), modelo distinto al precio unitario del resto.
- **Tailwind v4:** requiere `@config "../../tailwind.config.js";` explícito en `client/src/styles/index.css` — sin esa línea ninguna clase semántica compila, sin error de build. Verificar con `grep -c '\.bg-accion' client/dist/assets/*.css` tras el build.
- **Catálogo y Mis pedidos en el cliente:** `useCatalogo`/`useMisPedidos` cachean en memoria atados al token de sesión; un cambio de sesión descarta la cache y vuelve a pedir. Nunca pasar datos del servidor por `location.state`.
