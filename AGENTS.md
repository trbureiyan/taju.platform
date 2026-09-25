# AGENTS

> [!IMPORTANT]
> **Directiva de Interacción:** El agente debe responder siempre al inicio de cada interacción dirigiéndose directamente al usuario como **TaJú** (ej. "Hola TaJú," o "TaJú:"), tratando al usuario como la persona/entidad principal del taller.

taju.platform | Plataforma web MERN para TaJú, taller de corte y grabado láser en Neiva (Huila) que produce papelería y objetos personalizados para celebraciones y eventos.
React 18 + TypeScript + Tailwind (client), Node.js 20 LTS + Express.js + TypeScript (server), MongoDB Atlas + Mongoose, Cloudinary, JWT en memoria.

---

## Repository Map

```text
taju.platform/
├── client/                          # React 18 + TypeScript + Vite + Tailwind
│   ├── index.html                   # entry point — Google Fonts aqui, no en CSS
│   ├── tailwind.config.js           # consume CSS vars, no duplica valores
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx                 # render root
│       ├── App.tsx                  # router root (por definir en Phase 1)
│       ├── styles/
│       │   ├── tokens.css           # fuente unica de tokens — ver 04-tokens-de-diseno.md
│       │   └── index.css            # @import tokens + @tailwind layers + reset base
│       ├── components/
│       │   ├── ui/                  # primitivos compartidos: Button, Input, Badge...
│       │   ├── catalog/             # componentes del catalogo de productos
│       │   ├── orders/              # formulario y flujo de pedidos
│       │   ├── admin/               # panel de taller — tono neutro, sin acento rosa
│       │   └── shared/              # layout, nav, feedback generico
│       ├── hooks/                   # un archivo por concern (useOrderStatus.ts, etc.)
│       ├── lib/                     # utilidades del cliente (api.ts, formatters, etc.)
│       └── types/                   # tipos compartidos (pedido.types.ts, etc.)
├── server/                          # Node.js 20 LTS + Express + TypeScript
│   ├── tsconfig.json                # CommonJS, typecheck incluye los *.test.ts
│   ├── tsconfig.build.json          # build a dist/, excluye tests y src/test/
│   ├── vitest.config.mts            # entorno node, JWT_SECRET fijo de prueba
│   └── src/
│       ├── index.ts                 # arranque: conecta Mongo y escucha
│       ├── app.ts                   # crearApp(): middleware + rutas, sin puerto (lo usan los tests)
│       ├── test/                    # helpers de test: mongod en memoria (replica set), fixtures
│       ├── routes/                  # router raiz, monta cada modulo bajo /api
│       ├── modules/                 # slice vertical por dominio: auth/, catalog/, pedidos/
│       │   └── <dominio>/           # *.routes.ts + *.controller.ts + *.service.ts juntos
│       ├── models/                  # esquemas Mongoose
│       ├── middleware/              # auth, RBAC, validacion, upload
│       └── lib/                     # db.ts, cloudinary.ts, jwt.ts, errors.ts
├── public/
│   └── brand/                       # SVGs de marca — nunca editar
├── tools/
│   ├── db-local/                    # modulo externo: prepara MongoDB local (pnpm db:local)
│   └── seed-dev/                    # modulo externo: puebla taju-dev con datos de muestra (pnpm seed:dev)
├── .docs/                           # documentacion normativa
│   └── branding/                    # fuentes de verdad de marca
├── .github/
│   └── workflows/
│       └── ci.yml                   # lint | typecheck | build | test en main y dev
└── AGENTS.md
```

**Layer architecture:** Request → `routes/index.ts` (monta cada modulo) → `modules/<dominio>/*.routes.ts` → `*.controller.ts` (request/response) → `*.service.ts` (logica de negocio) → `models/` (Mongoose) → MongoDB Atlas.

---

## Commands

| Command | Purpose | Notes |
|---|---|---|
| `pnpm dev:client` | Vite dev server (client) | Puerto 5173 por defecto |
| `pnpm dev:server` | tsx watch (server) | Puerto 3001 por defecto |
| `pnpm build:client` | tsc + vite build | Correr antes de todo push |
| `pnpm typecheck` | tsc --noEmit en client y server | Corre en el hook pre-push |
| `pnpm lint` | eslint en client y server | Corre en el hook pre-push |
| `pnpm --filter taju-client build` | build directo del client | |
| `pnpm --filter taju-server build` | tsc compila a server/dist/ | Usa `tsconfig.build.json` |
| `pnpm --filter taju-client test` | Vitest + jsdom | `test:watch` para modo interactivo |
| `pnpm --filter taju-server test` | Vitest + mongod en memoria | Incluye la prueba de carga de pedidos (autocannon) |
| `pnpm db:local` | Crea colecciones e indices en MongoDB local | Idempotente, rechaza destinos no locales, exige replica set. Ver `tools/db-local/README.md` |
| `pnpm seed:dev` | Puebla `taju-dev` con categorias/productos/usuarios de muestra | Idempotente via `$setOnInsert`, rechaza incondicionalmente `taju-prod`. Ver `tools/seed-dev/README.md`. Mutacion de datos — confirmar con el usuario antes de correr (Dangerous Commands) |

Workspaces: `pnpm --filter taju-client <script>` o `--filter taju-server` para correr un solo lado.

**Git hooks:** `husky` gestiona `.husky/pre-push`, que corre `pnpm typecheck && pnpm lint` antes de cada `git push`. Se instala solo via el script `prepare` al correr `pnpm install` — no requiere setup manual. Los tests no están en el hook a propósito: `mongodb-memory-server` agrega latencia de arranque en cada corrida y ya los cubre el CI; el hook solo atrapa el error mas comun (uno que CI hubiera atrapado igual) sin frenar cada push.

### Dangerous Commands

> [!CAUTION]
> The following commands modify the database schema or data. **Never run autonomously without explicit user confirmation.** State what you intend to do and wait for approval. Some operations are irreversible.

***

## Task Intake and Research

When assigned a task:

1. Leer `AGENTS.md` primero. Si el trabajo toca infraestructura, despliegue, Atlas, Render, Cloudinary, o cualquier credencial/cuenta de servicio, leer también `.docs/WALKTHROUGH.md` — gitignoreado a propósito, contiene contexto sensible (estado real de accesos, decisiones interinas de seguridad, credenciales de referencia) que nunca se documenta en este archivo ni en ningún archivo versionado del repo público.
2. Leer el prompt con atención. Identificar el objetivo, las restricciones y el alcance antes de tocar archivos.
3. Inspeccionar los archivos relevantes con lecturas exactas y dirigidas. No hacer escaneos amplios de directorios cuando se conocen rutas específicas.
4. Verificar la implementación actual antes de escribir código. Nunca asumir la estructura: inspeccionarla.
5. Identificar edge cases del stack (ver sección Current Risk Areas) antes de redactar un plan.

### Rules of Engagement

- Empezar con el conjunto mínimo de archivos plausible. Búsqueda dirigida sobre escaneos amplios.
- Ignorar `client/dist/`, `server/dist/`, `node_modules/`.
- Si un task toca `server/src/modules/auth/`, revisar también `server/src/middleware/rbac.ts` y las rutas protegidas — forman una unidad.
- Si un task toca `client/src/styles/tokens.css`, revisar también `client/tailwind.config.js` y `.docs/branding/04-tokens-de-diseno.md` — los tres deben coincidir.
- Si un task toca `server/src/models/`, revisar también el servicio y el controlador correspondiente — no modificar el schema sin revisar las consultas que lo consumen.

**Audit before acting:** Verificar cada hallazgo contra el código actual. Corregir solo los problemas aún válidos. Saltear el resto con una razón breve. Mantener los cambios mínimos. Validar después.

### Documentation Maintenance

- `AGENTS.md` es documentación versionada del proyecto, no una nota local desechable.
- Todo cambio grande en arquitectura, auth, seguridad, base de datos, despliegue, dependencias, rutas o flujo de trabajo debe revisar este archivo y los docs relacionados.
- Si el cambio modifica una instrucción, un riesgo, un comando o una descripción de arquitectura, actualizar la documentación en el mismo commit.
- Si tras la revisión no se necesita ninguna edición, registrar esa decisión en el resumen del cambio. No dejar instrucciones contradictorias.

Los documentos de marca en `.docs/branding/` son normativos y versionados. Un agente no los edita por iniciativa propia. Si una decisión de implementación contradice lo escrito ahí, la decisión está mal, no el documento. Si el documento está genuinamente equivocado, señalarlo y esperar confirmación antes de tocarlo.

---

## Current Risk Areas

Document known landmines here. Be specific: name the files, describe the behavior, state the failure mode.

- **Auth / JWT flow**: Token almacenado en memoria del cliente — sin `localStorage`, sin cookies. Al recargar la página el token se pierde; es intencional. Cualquier cambio en la estructura del payload afecta todas las rutas autenticadas. Modulo de auth: `server/src/modules/auth/`.
- **RBAC**: Dos roles — `cliente` y `administrador`. El middleware de Express valida el rol en rutas de taller. Middleware: `server/src/middleware/rbac.ts`.
- **Cloudinary**: Las llamadas son reales solo en producción. En tests interceptar el módulo de integración completo; nunca hacer llamadas reales. Módulo: `server/src/lib/cloudinary.ts`.
- **MongoDB Atlas**: `MONGO_URI` define el entorno de destino. Un seed o reset en producción es irreversible. Estado real del Network Access, service accounts y cualquier detalle de acceso: `.docs/WALKTHROUGH.md`, nunca acá.
- **Tokens de diseño**: El archivo de tokens CSS y `.docs/branding/04-tokens-de-diseno.md` deben coincidir. Una discrepancia es un error, no una ambigüedad.
- **Estados de pedido**: El enum `EstadoPedido` en TypeScript, el campo en Mongoose y las etiquetas en la UI deben ser el mismo string. Cualquier divergencia genera inconsistencias silenciosas.
- **Idempotencia en creación de pedidos**: `crearPedido` (`server/src/modules/pedidos/pedidos.service.ts`) reserva una clave (hash del payload completo, incluido el contenido de cada archivo, + clienteId) en la colección `idempotencia_pedidos` dentro de una transacción junto al `Pedido.create`. Un envío idéntico dentro de 60 s recibe 409. Requiere replica set: Atlas M0 sirve, un mongod standalone local no. Si se agrega un campo al payload de creación, sumarlo a `claveIdempotencia()` o dos pedidos distintos colisionan. El perdedor de una carrera simultánea ya subió sus imágenes a Cloudinary antes de perder — el catch de la clave duplicada las borra con `eliminarImagen` (best-effort, no bloquea la respuesta 409 si Cloudinary falla).
- **Escala de precios**: La familia `superficies` opera con precio por cantidad (mínimo 12 unidades). Lógica diferente al precio por unidad del resto. Cualquier componente de precio debe soportar ambos modelos.
- **TypeScript 7 bloqueado por typescript-eslint**: `typescript-eslint@8.x` soporta TS `>=4.8.4 <6.1.0`. Fijado en `6.0.3` hasta que typescript-eslint soporte TS 7 (tracking: [#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)). No subir `typescript` a `7.x` en ninguno de los dos `package.json` hasta que ese issue esté cerrado.
- **Tailwind v4 requiere `@tailwindcss/vite`**: El paquete `tailwindcss@4` no incluye plugin PostCSS. La integración es via `@tailwindcss/vite` registrado en `client/vite.config.ts`. `postcss.config.js` tiene solo `autoprefixer`. El CSS usa `@import "tailwindcss"` y el plugin detecta `client/tailwind.config.js` automáticamente — no usar `@config` en el CSS.
- **Zod v4 — `z.record()` requiere dos args**: En Zod v3 `z.record(z.string())` infería `Record<string, string>`. En v4 el único argumento es el key schema y los valores quedan como `unknown`. Forma correcta: `z.record(z.string(), z.string())`. Buscar `z\.record\([^,)]+\)` si se agrega código nuevo con Zod.
- **Zod v4 — `error.flatten()` removido**: `ZodError.prototype.flatten()` no existe en v4. Reemplazar con `z.flattenError(error)`. Cualquier código nuevo que acceda a errores Zod debe usar la función standalone.
- **eslint-plugin-react-hooks@7 — `set-state-in-effect`**: Nueva regla que bloquea `setState` síncrono dentro del cuerpo del `useEffect`. Los dos usos existentes en `useCatalogo.ts` y `ProductoDetailPage.tsx` son intencionales (reset antes del fetch para evitar estado obsoleto visible) y están suprimidos con `// eslint-disable-next-line`. Código nuevo que necesite el mismo patrón debe suprimir con la misma directiva y documentar el motivo.

---

## Domain Language

El dominio se nombra en español y el término es **idéntico** en el modelo de Mongoose, la ruta de Express, el tipo de TypeScript y el texto de interfaz. No hay capa de traducción entre backend y frontend. Si aparece una, es un error de diseño, no una decisión.

### Catálogo

Cuatro familias de producto. **No inventar categorías fuera de esta lista.**

| Familia | Incluye |
|---|---|
| `toppers` | Cake toppers en MDF y acrílico |
| `superficies` | Blondas de MDF grabadas, bases |
| `senaletica` | Letreros, banners, letras en vinilo, números |
| `papeleria` | Invitaciones, tarjetas tipo VIP, llaveros, cajas, vasos |

### Estados de pedido

Enum canónico. Mismo valor en base de datos, API y UI. Los valores exactos permitidos son: `recibido`, `en_revision`, `confirmado`, `en_produccion`, `listo_para_entrega`, `entregado`.

```ts
type EstadoPedido =
  | 'recibido'
  | 'en_revision'
  | 'confirmado'
  | 'en_produccion'
  | 'listo_para_entrega'
  | 'entregado';
```

Etiquetas de presentación: Recibido, En revisión, Confirmado, En producción, Listo para entrega, Entregado. La etiqueta se deriva del valor en un solo mapa (`ETIQUETAS_ESTADO`), nunca se escribe suelta en un componente.

### Vocabulario de especificación

`diametro` y `altura` en centímetros, enteros. `medida`, `referencia`, `material`, `acabado`, `personalizacion`, `fechaEntrega`, `nota`.

Los campos del formulario replican el vocabulario que el negocio ya usa con sus clientes. No inventar terminología nueva donde existe una compartida.

### Dos audiencias

El catálogo sirve a cliente final (unidad, alta carga emocional, necesita acompañamiento en la especificación) y a cliente profesional (volumen, escalas de precio por cantidad, necesita repetir pedidos rápido). Los productos de la familia `superficies` tienen precio por escala y cantidad mínima. Cualquier componente de precio debe soportar ambos modelos.

---

## Design Patterns and Component Reuse

### Visual system

Fuente única de verdad: `.docs/branding/04-tokens-de-diseno.md`. Los valores viven como CSS custom properties en `client/src/styles/tokens.css`, consumidas por Tailwind en `client/tailwind.config.js` via `var(--…)`. Estos dos archivos deben coincidir con el doc de tokens.

**No copiar valores de tokens a este archivo.** Duplicar la tabla aquí garantiza que se desincronice del CSS. Para cualquier valor concreto, leer el archivo de tokens.

Arquitectura de dos capas: primitivas (`--amarillo-500`, `--space-4`) y semánticas (`--accion-fondo`, `--texto-principal`). **Los componentes consumen solo la capa semántica.** Si un componente necesita una primitiva, falta un token semántico: crearlo, no usar la primitiva.

Invariantes verificables:

| Regla |
|---|
| Texto sobre color de marca siempre en tinta (`--tinta-900`). No usar blanco sobre el color de acción ni el de contexto. |
| No usar la paleta cruda de Tailwind (`bg-yellow-400`, `text-gray-600`, etc.). Todo a través de tokens semánticos. |
| No usar hexadecimales literales en componentes. Solo dentro del archivo de tokens. |
| Espaciado solo de la escala base 4. Valores admitidos: 1, 2, 3, 4, 6, 8, 12, 16, 24. Nada arbitrario. |
| Objetivo táctil mínimo 44px en botones y campos. |
| Foco visible en todo elemento interactivo. No anular con `outline: none` sin sustituto. |
| Cifras tabulares en precios y medidas (`font-variant-numeric: tabular-nums`). |

Tipografía: **Poppins** (400, 500, 600) para todo, **JetBrains Mono** para códigos de pedido e identificadores. Ambas por Google Fonts.

> [!CAUTION]
> **Verona** es la serif del wordmark. Es comercial y sin licencia web. El logotipo existe como trazado vectorial en `public/brand/`, por lo que reproducirlo es válido. **Nunca componer texto vivo en Verona** ni declararla en CSS.

Solo una acción primaria por pantalla. El turquesa es color de contexto, nunca de acción. El rosa es acento afectivo, máximo una aparición por pantalla, nunca en elementos estructurales ni de sistema.

En el panel de Taller (admin) no se usan el acento rosa ni la mascota. El criterio ahí es legibilidad operativa bajo presión de entrega.

Activos de marca en `public/brand/`:

| Archivo | Uso |
|---|---|
| `taju-isotipo.svg` | Solo el simbolo — usar por debajo de 120px de ancho o en favicon |
| `taju-isotipo-monocromático.svg` | Fondos oscuros o estampado |
| `taju-imagotipo.svg` | Simbolo + wordmark — uso general |
| `taju-imagotipo-v2.svg` | Variante vertical (isotipo arriba, wordmark abajo) |
| `taju-logotipo-completo.svg` | Logotipo completo |
| `taju-logotipo-only-taju.svg` | Solo el texto "taju" |

Regla: por debajo de 120px usar `taju-isotipo.svg`, nunca el imagotipo completo. El favicon en `index.html` apunta a `/brand/taju-isotipo.svg`.

Iconos: **Lucide React** (`lucide-react`). Trazo uniforme de 2px que combina con el contorno del logotipo. No mezclar sets ni incrustar SVG sueltos de origen distinto.

### Component conventions

- Antes de crear un componente nuevo, revisar los primitivos en `client/src/components/ui/`. Componentes específicos de dominio van en `catalog/`, `orders/`, o `admin/` según corresponda.
- No usar `@apply` de Tailwind para abstraer clases repetidas. Si un patrón visual se repite, extraerlo a un componente React.
- Iconos: Lucide React (`lucide-react`). Trazo uniforme de 2px. No mezclar sets ni incrustar SVG sueltos de origen distinto.
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

Corto, directo, estilo caverna. Leer el mensaje, correlacionar con el diff. Sin storytelling. Todo commit debe llevar un mensaje y descripción explícitos: concisos, puntuales y asertivos.

Formato:
- **Título / Asunto:** `<type>: <qué cambió, máx. 72 chars>`
- **Descripción / Cuerpo (Body):** Cada commit debe incluir una descripción clara en el cuerpo del commit (separada del título por una línea en blanco) detallando el *por qué* de la modificación, las razones técnicas y el alcance del cambio, manteniendo un lenguaje conciso y con criterio sin redundancias.

Types: `feature`, `fix`, `hotfix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`

Buenos ejemplos:
```text
feature: add file type validation middleware

- Valida tipos de archivo permitidos para imágenes del catálogo (PNG, JPG, WEBP).
- Retorna 400 Bad Request si el formato no coincide con el mime-type esperado.
- Evita procesamiento innecesario antes de enviar el buffer a Cloudinary.
```

Malos patrones:
```text
feature: add comprehensive order management system with validation   <- título demasiado largo
fix: resolved an issue where the file was not being validated        <- storytelling
chore: various improvements and cleanup                              <- vago y sin cuerpo descriptivo
```

### Stash Workflow

Al iterar o recuperar cambios con `git stash`, preferir siempre `git stash apply` o restauración puntual dirigida vía `git checkout stash@{...} -- <ruta>` en lugar de `git stash pop`. 

`git stash pop` elimina el stash de forma destructiva inmediatamente después de aplicarlo. En operaciones automatizadas por agentes, un fallo durante el aplique o interrupción puede derivar en pérdida de cambios o estados del working tree difíciles de recuperar. Usar `apply` o `checkout` selectivo preserva la fuente de verdad en el stash hasta verificar los cambios.

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
| Seed o reset de MongoDB | Mutación de datos; irreversible en producción |
| Editar `.env` o `.env.example` | Contiene secretos |
| Editar módulos de auth o JWT | Cualquier cambio afecta todas las rutas autenticadas |
| Git push, merge o deploy | Operaciones remotas irreversibles |
| Instalar nuevas dependencias | Requiere npm install + lockfile commit |

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

### Test conventions

- Framework: Vitest en client (jsdom + Testing Library, setup en `client/src/test/setup.ts`) y en server (entorno node).
- Ubicación: `*.test.ts(x)` junto al archivo que prueban. Helpers compartidos en `src/test/`.
- Mocking de DB: mongodb-memory-server como `MongoMemoryReplSet` de un nodo (`server/src/test/mongo.ts`), un `beforeAll`/`afterAll` por archivo y `limpiarColecciones()` en `afterEach`. Un standalone rechaza transacciones y `crearPedido` usa una.
- Mocking de Cloudinary: interceptar el módulo de integración completo con `vi.mock('../../lib/cloudinary.js')`; nunca hacer llamadas reales en tests.
- Cobertura objetivo: por definir.
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

El texto en este repositorio sigue: sin emojis (se permite ASCII art discreto o caracteres ANSI cuando aportan claridad visual), sin relleno, sin vocabulario corporativo. Prosa por defecto. Separadores: coma o `|` preferidos sobre `—`; reservar `—` solo cuando ninguna alternativa cabe. Los comentarios de código explican el *por qué* y el *qué no obvio*, nunca el *cómo*. Marcadores ASCII: `[!]` peligroso, `[?]` incierto, `[x]` deprecado, `-->` redirección.

JSDoc documenta el contrato de la función: qué hace, parámetros, valor de retorno, excepciones.

### Comment style

Los comentarios suenan como un colega dejando una nota rápida: breves, conceptuales, sin explicar lo obvio.

```ts
// el cliente manda el token en memoria; si recarga, pierde la sesión — es intencional
// esDimensionPersonalizada bloquea el avance a "en produccion" hasta confirmación del admin
// subdocumento embebido intencional: preserva snapshot de categoría al momento del pedido
```

No describir lo que el código ya dice. Comentar solo cuando el contexto, la intención o una trampa no son evidentes a primera vista.

### UI copy

Fuente completa: `.docs/branding/03-voz-de-marca.md`. Reglas obligatorias para cualquier texto visible por el usuario.

Tutear siempre, sin excepción. Hablar en primera persona del plural: "te confirmamos", nunca "se confirmará" ni "TaJú confirma".

**Nunca culpar al usuario.** El error es del sistema o de la marca, jamás de quien escribe.

Los mensajes de error siguen la estructura: qué pasó, por qué importa, qué hacer. Sin signos de exclamación.

```text
MAL:  Campo obligatorio
BIEN: Nos falta el diámetro de tu torta. Sin ese dato no podemos calcular la proporción del topper.

MAL:  Ingresaste una fecha inválida
BIEN: Esa fecha ya pasó. Elige una a partir del lunes, que es lo mínimo que necesitamos para producir.

MAL:  Su pedido ha sido procesado exitosamente
BIEN: Listo, recibimos tu pedido. Te escribimos por WhatsApp para confirmarte la fecha.
```

Las etiquetas de campo dicen **qué** se pide, sin puntuación final. El texto de ayuda dice **por qué** importa.

Los botones describen la acción concreta: "Enviar mi pedido", no "Enviar". "Ver el detalle", no "Aceptar".

Prohibido: anglicismos con equivalente natural (order, checkout, cart, shipping), lenguaje corporativo vacío (soluciones integrales, calidad garantizada), lenguaje de sistema expuesto al usuario (procesar, validar, registro, transacción), voz pasiva refleja, más de un signo de exclamación por pantalla.

Excepción única: **cake topper** se mantiene en inglés. Es el término que los clientes del negocio ya usan.

Las medidas se traducen a referencia reconocible: "22 cm, el tamaño de una torta de media libra", no "22 cm" solo. Precios con separador de miles de punto y sin decimales. Medidas con espacio antes de la unidad.

En el panel de Taller el tono se apaga: funcional y neutro. Quien usa ese panel trabaja contra una fecha de entrega y cualquier ingenio verbal es ruido.
