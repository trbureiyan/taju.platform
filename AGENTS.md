# AGENTS

taju.platform | Plataforma web MERN para Taju Studio, estudio creativo de artículos personalizados para eventos.
React 18 + TypeScript + Tailwind (client), Node.js 20 LTS + Express.js + TypeScript (server), MongoDB Atlas + Mongoose, Cloudinary, JWT en memoria.

---

## Repository Map

```text
{project-root}/
├── {entry-layer}/           # {Description of routing or entrypoint responsibility}
│   ├── {auth-module}/       # {Auth flows}
│   ├── {api-module}/        # {API endpoints — grouped by domain}
│   └── {public-pages}/      # {Public-facing surfaces}
├── {components}/            # {React/UI components}
│   ├── {feature-group}/     # {Feature-specific components}
│   └── {ui-primitives}/     # {Shared primitives — check here before creating new}
├── {hooks}/                 # {Custom hooks — one file per concern}
├── {lib}/                   # {Shared server-side utilities}
│   ├── {auth-module}/       # {JWT, CSRF, session helpers}
│   ├── {db-client}/         # {Database client singleton}
│   └── {generated}/         # [GENERATED] Never edit manually
├── {repositories}/          # {Data access layer — ORM queries, one file per domain}
├── {schema}/                # {Database schema, migrations, seed}
├── {middleware}/            # {Global middleware: auth, RBAC, security}
├── {tests}/                 # {Test files — naming convention: <module>.<runner>-test.ts}
└── {ci}/                    # {CI workflows, PR templates}
```

**Layer architecture:** {Describe the data flow from request to response in one sentence.}
For example: Route handler → `lib/data/` (business logic) → `repositories/` (ORM queries) → Database.

---

## Commands

| Command | Purpose | Notes |
|---|---|---|
| `{dev}` | Dev server | Local development |
| `{build}` | Production build | Run before every push |
| `{lint}` | Linter | Pre-commit hook |
| `{test}` | Test runner | Full suite |
| `{test:watch}` | Test watch mode | TDD workflow |
| `{typecheck}` | Type-check only | Pre-push hook |

### Dangerous Commands

> [!CAUTION]
> The following commands modify the database schema or data. **Never run autonomously without explicit user confirmation.** State what you intend to do and wait for approval. Some operations are irreversible.

***

## Task Intake and Research

When assigned a task:

1. Leer `AGENTS.md` primero.
2. Leer el prompt con atención. Identificar el objetivo, las restricciones y el alcance antes de tocar archivos.
3. Inspeccionar los archivos relevantes con lecturas exactas y dirigidas. No hacer escaneos amplios de directorios cuando se conocen rutas específicas.
4. Verificar la implementación actual antes de escribir código. Nunca asumir la estructura: inspeccionarla.
5. Identificar edge cases del stack (ver sección Current Risk Areas) antes de redactar un plan.

### Rules of Engagement

- Empezar con el conjunto mínimo de archivos plausible. Búsqueda dirigida sobre escaneos amplios.
- Ignorar `client/dist/`, `server/dist/`, `node_modules/`.
- If a task touches {high-coupling area A}, also check {file B, C, D} — they form a unit.
- If a task touches {high-coupling area E}, check {file F, G} as well.

**Audit before acting:** Verificar cada hallazgo contra el código actual. Corregir solo los problemas aún válidos. Saltear el resto con una razón breve. Mantener los cambios mínimos. Validar después.

### Documentation Maintenance

- `AGENTS.md` es documentación versionada del proyecto, no una nota local desechable.
- Todo cambio grande en arquitectura, auth, seguridad, base de datos, despliegue, dependencias, rutas o flujo de trabajo debe revisar este archivo y los docs relacionados.
- Si el cambio modifica una instrucción, un riesgo, un comando o una descripción de arquitectura, actualizar la documentación en el mismo commit.
- Si tras la revisión no se necesita ninguna edición, registrar esa decisión en el resumen del cambio. No dejar instrucciones contradictorias.

---

## Current Risk Areas

Document known landmines here. Be specific: name the files, describe the behavior, state the failure mode.

- **{Auth / JWT flow}**: `{lib/jwt.ts}` (main), `{lib/auth/jwt-edge.ts}` (edge). {What the token does, refresh behavior, role source.} Changes here affect every authenticated route.
- **{CSRF protection}**: `{lib/csrf.ts}` + `{hooks/useCsrf.ts}` + `{middleware.ts}`. {Pattern used.} Every mutating request must carry the token. Public exemptions are hardcoded in `{middleware.ts}` — adding new public routes requires updating that list.
- **{Database schema}**: {N} models with {notable constraints: cascade deletes, BigInt PKs, junction tables, etc.}. Migrations must be tested against a clean DB. Never edit generated files in `{lib/generated/}`.
- **{Runtime serialization gotcha}**: {E.g., BigInt IDs cannot be JSON-serialized. Always convert before returning from route handlers.} Recurring source of runtime crashes.
- **{Server/client boundary}**: `{"use client"}` placement determines what ships to the browser. Server-only code ({e.g., DB queries, JWT verification}) must never leak into client components.
- **{Middleware scope}**: `{middleware.ts}` runs on every request. It handles {list: auth redirect, RBAC, CSRF, etc.}. Changes here affect the entire app.
- **{Third-party anti-bot / challenge}**: `{lib/altcha.ts}` + `{route}` + `{component}`. {Library, pattern, CDN origin, expiration, env var.} If added to new forms, update {CSP or equivalent}.
- **{Rate limiting}**: {Where it lives, what resets it, known scaling limitation.}
- **{Environment variables}**: `{.env}` is the primary local file. Required variables listed in `{.env.example}`. Required in production: `{VAR_1}`, `{VAR_2}`.
- **{CSP / security headers}**: `{next.config.ts}` defines allowed origins. Any new external dependency requires updating the corresponding directive.
- **{Cache strategy}**: `{lib/cache-tags.ts}` centralizes cache tags and TTLs. {Which data is cached, TTLs, cache invalidation behavior, dev vs. production difference.}

---

## Design Patterns and Component Reuse

### Visual system

| Token | Value | Usage |
|---|---|---|
| `--background` | `{TODO: branding}` | Fondo de página |
| `--foreground` | `{TODO: branding}` | Texto primario |
| `--accent` | `{TODO: branding}` | CTAs, elementos interactivos |
| `--muted` | `{TODO: branding}` | Texto secundario, etiquetas |
| `--admin-surface` | `{TODO: branding}` | Superficie del panel Taller |

Fonts: `{TODO: branding}` para headings, `{TODO: branding}` para UI y cuerpo.

Configurar los tokens como colores personalizados en `tailwind.config.ts` bajo la clave `theme.extend.colors`. No usar valores hexadecimales hardcodeados fuera de ese archivo.

### Component conventions

- Antes de crear un componente nuevo, revisar `client/src/components/ui/` para primitivos existentes.
- No usar `@apply` de Tailwind para abstraer clases repetidas. Si un patrón visual se repite, extraerlo a un componente React.
- Los componentes de las tres secciones principales viven en `components/catalog/`, `components/order/` y `components/admin/`. Los primitivos compartidos van en `components/ui/`.
- Iconos: `{TODO: definir librería}`.
- Animaciones: respetar `prefers-reduced-motion` en cualquier transición o animación CSS.

### Naming

- Componentes: PascalCase, archivos y exports (`OrderStatusBadge.tsx`)
- Hooks: camelCase con prefijo `use` (`useOrderHistory.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Tipos: interfaces en PascalCase, archivos en camelCase (`pedido.types.ts`)
- Rutas de API: lowercase con guiones (`/api/pedidos/:id/estado`)
- Variables de entorno: SCREAMING_SNAKE_CASE

---

## Commits and PRs

### Commits

Corto, directo, estilo caverna. Leer el mensaje, correlacionar con el diff. Sin storytelling.

Formato: `<type>: <qué cambió, máx. 72 chars>`

Types: `feature`, `fix`, `hotfix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`

Buenos ejemplos:
```text
feature: add file type validation middleware
fix: block estado transition when esDimensionPersonalizada is true
refactor: extract order status logic to pedidos.service
test: cover JWT expiry rejection in auth middleware
chore: update Cloudinary SDK to 2.x
```

Malos patrones:
```text
feature: add comprehensive order management system with validation   <- demasiado largo
fix: resolved an issue where the file was not being validated        <- storytelling
chore: various improvements and cleanup                              <- vago
```

### Architectural decisions

Cuando un cambio introduce una decisión de diseño no obvia, agregar un comentario de una línea junto al punto de decisión:

```ts
// [DECISION] {elección} — {por qué}. {tradeoff o acción futura}.
```

No escribir documentos ADR separados. La decisión vive con el código.

### PRs

Cada PR debe pasar: `lint` + `typecheck` + `build` + `test` (cuando el runner esté definido).

---

## Manual Actions — Do Not Touch

El agente no debe ejecutar estas acciones. Describir lo que se necesita hacer y pedirle al usuario que lo ejecute manualmente.

| Action | Why |
|---|---|
| `{migrate:create}` | Creates migration files, modifies DB schema |
| `{migrate:deploy}` | Applies migrations to target DB |
| `{db:push}` | Pushes schema without migration history |
| `{db:seed}` | Mutates database data |
| Editing `{.env}`, `{.env.example}` | Contains secrets and config |
| Editing `{middleware CSRF exemptions}` | Security-sensitive exemptions |
| Editing `{auth core files}` | Token logic — any change affects every authenticated route |
| Git push, merge, or deploy actions | Irreversible remote operations |
| Editing `{generated/}` | Auto-generated — will be overwritten |
| Installing new dependencies | Requires package manager install + lockfile commit |

Cuando alguna de estas acciones sea necesaria, generar un bloque claro:

```text
MANUAL ACTION REQUIRED:
1. Run: {comando exacto}
2. Verify: {qué verificar}
3. Confirm before I continue with the next step
```

---

## TDD and Validation

### Test-first workflow

1. Escribir el test que define el comportamiento esperado.
2. Ejecutarlo: debe fallar (red).
3. Escribir el código mínimo para que pase (green).
4. Refactorizar si es necesario; los tests deben seguir en verde.
5. Ejecutar la suite completa antes de hacer commit.

### Test structure

```text
{tests}/
├── {module-a}.{runner}-test.ts   # {What this covers}
├── {module-b}.{runner}-test.ts   # {What this covers}
├── unit/                         # Future: pure logic, no I/O
└── integration/                  # Future: end-to-end flows
```

Convención de nombres: `<module>.test.ts`

### Test conventions

- Framework: `{TODO: definir — Jest o Vitest}`.
- Mocking de DB: `{TODO: definir — mongodb-memory-server o mocks manuales}`.
- Mocking de Cloudinary: interceptar `lib/cloudinary.ts` completo; nunca hacer llamadas reales en tests.
- Cobertura objetivo: `server/src/services/` y `server/src/middleware/`.
- Cada test debe ser independiente: sin estado compartido entre tests.

### Validation before claiming done

Antes de declarar el trabajo completo:

1. `npm run typecheck` — sin errores de tipos.
2. `npm run lint` — sin errores de lint.
3. `npm run test` — todos los tests pasan.
4. `npm run build` — build de producción exitoso.

Si alguno falla, corregir antes de reportar.

---

## Verify Before Fixing

Antes de implementar cualquier plan o corrección:

1. Verificar el hallazgo: leer el código actual, no suposiciones sobre él.
2. Confirmar que sigue siendo válido: el código puede haber cambiado desde que se observó el problema.
3. Si es inválido: saltar con una razón de una línea: `// [SKIP] Already handled in {file}:{line}`
4. Si es válido: corregir con cambios mínimos. No refactorizar código adyacente a menos que la corrección lo requiera.
5. Validar: ejecutar el test o comando de verificación relevante.
6. Reportar: qué se corrigió, qué se saltó y por qué.

Esto aplica a toda tarea: bug fixes, features, refactors, auditorías. Sin excepciones.

---

## Supply Chain and Dependencies

Versiones exactas en `package.json`: sin `^` ni `~`. Commitear el lockfile con cada cambio que toque el manifiesto de paquetes.

No hay dependencias cargadas desde CDN. Todo el código de terceros se instala como dependencia npm y se bundlea.

---

## Writing and Documentation

El texto en este repositorio sigue: sin emojis, sin relleno, sin vocabulario corporativo. Prosa por defecto. Los comentarios de código explican el *por qué* y el *qué no obvio*, nunca el *cómo*. Marcadores ASCII: `[!]` peligroso, `[?]` incierto, `[x]` deprecado, `-->` redirección.

JSDoc documenta el contrato de la función: qué hace, parámetros, valor de retorno, excepciones.

### Comment style

Los comentarios suenan como un colega dejando una nota rápida: breves, conceptuales, sin explicar lo obvio.

```ts
// el cliente manda el token en memoria; si recarga, pierde la sesión — es intencional
// esDimensionPersonalizada bloquea el avance a "en produccion" hasta confirmación del admin
// subdocumento embebido intencional: preserva snapshot de categoría al momento del pedido
```

No describir lo que el código ya dice. Comentar solo cuando el contexto, la intención o una trampa no son evidentes a primera vista.
