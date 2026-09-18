# taju.platform — Copilot Instructions

> Este archivo es documentación versionada. Cuando una decisión de arquitectura, convención o riesgo cambie, actualizar aquí en el mismo commit. Los `{por definir}` deben reemplazarse con la decisión tomada en cuanto se adopte.

taju.platform es la plataforma web de **TaJú · Papelería Creativa**, taller de corte y grabado láser en Neiva (Huila) que produce papelería y objetos personalizados para celebraciones y eventos. Centraliza la Vitrina de catálogo, el módulo parametrizado de Pedidos y el panel interno de Taller. Es el proyecto integrador II de la carrera de Ingeniería de Software, Universidad Surcolombiana.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, React Hook Form, React Router |
| Backend | Node.js 20 LTS, TypeScript, Express.js |
| Base de datos | MongoDB Atlas, Mongoose ODM |
| Almacenamiento | Cloudinary |
| Autenticación | JWT almacenado en memoria, sin localStorage |
| Seguridad | bcrypt, validación de entradas en servidor |

El repositorio es un monorepo de dos workspaces: `client/` (React) y `server/` (Express REST API).

## Arquitectura y convenciones

> [?] Flujo de datos y estructura de carpetas por definir cuando se inicie la implementación del servidor.

Los documentos normativos del proyecto viven en `.docs/`. Son versionados y autoritativos. Si una decisión de implementación contradice un documento de `.docs/`, la decisión está mal, no el documento. Para editar `.docs/branding/`, esperar confirmación explícita del usuario.

**Sistema visual:** Fuente única de verdad es `.docs/branding/04-tokens-de-diseno.md`. Los valores se implementarán como CSS custom properties consumidas por Tailwind mediante `var(--…)`. Los componentes consumirán tokens semánticos, nunca primitivos. Si un componente necesita una primitiva directamente, falta un token semántico y hay que crearlo primero.

**Autenticación:** JWT almacenado en memoria del cliente. Al recargar la página, el token se pierde — es intencional. Dos roles: `cliente` y `administrador`. Las rutas de taller requieren rol `administrador`; acceso no autorizado devuelve `401` o `403`.

**Imágenes de pedido:** archivos JPG, máx. 5 MB, servidos a través de Cloudinary.

## Dominio

El dominio se nombra en español. El término es idéntico en el modelo Mongoose, la ruta Express, el tipo TypeScript y el texto de interfaz. No hay capa de traducción. Si aparece una, es un error de diseño.

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
  | 'entregado';
```

Etiquetas de presentación: Recibido, En revisión, Confirmado, En producción, Listo para entrega, Entregado. La etiqueta se deriva del valor en un solo mapa, nunca se escribe suelta en un componente.

### Vocabulario de especificación

`diametro` y `altura` en centímetros, enteros. Campos canónicos: `medida`, `referencia`, `material`, `acabado`, `personalizacion`, `fechaEntrega`, `nota`.

### Dos audiencias

**Cliente final:** compra por unidad, carga emocional alta, necesita acompañamiento en la especificación. El módulo de Pedido debe validar medidas, mostrar referencias visuales de escala y guiar antes de permitir el envío.

**Cliente profesional:** volumen, escalas de precio por cantidad. Los productos de la familia `superficies` tienen precio por escala y cantidad mínima. Cualquier componente de precio debe soportar ambos modelos.

## Sistema visual

Reglas obligatorias antes de crear o modificar cualquier componente visual.

| Regla |
|---|
| Texto sobre color de marca siempre en tinta (`--tinta-900`). No usar blanco sobre el color de acción ni el de contexto. |
| No usar la paleta cruda de Tailwind (`bg-yellow-400`, `text-gray-600`, etc.). Todo a través de tokens semánticos. |
| No usar hexadecimales literales en componentes. Solo dentro del archivo de tokens. |
| Espaciado solo de la escala base 4. Valores admitidos: 1, 2, 3, 4, 6, 8, 12, 16, 24. Nada arbitrario. |
| Objetivo táctil mínimo 44px en botones y campos. |
| Foco visible en todo elemento interactivo. No anular con `outline: none` sin sustituto. |
| Cifras tabulares en precios y medidas (`font-variant-numeric: tabular-nums`). |
| Solo una acción primaria por pantalla. Amarillo pierde función de guía si se reparte. |
| Turquesa no es color de acción. Es color de contexto y orientación, nunca en botones primarios. |
| Rosa máximo una vez por pantalla. Solo en momentos de carga afectiva, nunca en elementos estructurales ni de sistema. |

> [!CAUTION]
> **Verona** es la serif del wordmark. Es comercial y sin licencia web. El logotipo existe como trazado vectorial en `public/brand/`, por lo que reproducirlo es válido. **Nunca componer texto vivo en Verona** ni declararla en CSS.

**Tipografía:** Poppins (400, 500, 600) para todo. JetBrains Mono exclusivamente para códigos de pedido e identificadores que el usuario deba leer carácter por carácter. Ambas vía Google Fonts.

**Activos de marca:** `public/brand/taju-vertical.svg`, `taju-horizontal.svg`, `taju-contorno.svg`, `taju-isotipo.svg`. Por debajo de 120px de ancho usar el isotipo, nunca el horizontal ni el vertical.

**Iconos:** Lucide React (`lucide-react`). Trazo uniforme de 2px coherente con el contorno del logotipo. No mezclar sets ni incrustar SVG sueltos de origen distinto.

**En el panel de Taller (admin):** sin acento rosa, sin mascota. Criterio rector: legibilidad operativa bajo presión de entrega.

**Mascota (gato):** máximo una aparición por pantalla. Pose de celebración → confirmación de pedido enviado. Pose de señalamiento → estados vacíos y guías de especificación. Nunca en el panel de taller.

## Convenciones de componentes

> [?] Estructura de carpetas de componentes por definir. Documentar aquí una vez acordada.

No usar `@apply` de Tailwind para abstraer clases repetidas. Si un patrón visual se repite, extraerlo a un componente React.

Respetar `prefers-reduced-motion` en cualquier transición o animación CSS; reducir duración a cero, no acortarla.

## Nomenclatura

- Componentes: PascalCase, archivos y exports (`OrderStatusBadge.tsx`)
- Hooks: camelCase con prefijo `use` (`useOrderHistory.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Tipos: interfaces PascalCase, archivos camelCase (`pedido.types.ts`)
- Rutas de API: lowercase con guiones (`/api/pedidos/:id/estado`)
- Variables de entorno: SCREAMING_SNAKE_CASE

## Comandos

| Comando | Propósito | Notas |
|---|---|---|
| `cd client && npm run dev` | Frontend dev server | Terminal 1 |
| `cd server && npm run dev` | Backend dev server | Terminal 2 |
| `npm run build` | Build de producción | Ejecutar antes de cada push |
| `npm run lint` | Linter | Pre-commit |
| `npm run typecheck` | Type-check solo | Pre-push |
| `npm test` | Suite completa | Antes de reportar done |

### Comandos peligrosos

> [!CAUTION]
> Los siguientes comandos modifican datos o esquema de base de datos. **Nunca ejecutar autónomamente sin confirmación explícita del usuario.** Declarar la intención y esperar aprobación.

| Acción | Razón |
|---|---|
| Operaciones de seed o reset de MongoDB | Mutación de datos |
| Editar `.env` o `.env.example` | Contiene secretos |
| Git push, merge o deploy | Operaciones remotas irreversibles |
| Instalar nuevas dependencias | Requiere install + lockfile commit |

Cuando alguna de estas acciones sea necesaria, generar un bloque explícito:

```text
MANUAL ACTION REQUIRED:
1. Run: {comando exacto}
2. Verify: {qué verificar}
3. Confirm before I continue
```

## Variables de entorno

Copiar `.env.example` a `.env` en `server/`:

```env
PORT=
MONGO_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Supply chain y dependencias

Versiones exactas en `package.json`: sin `^` ni `~`. Commitear el lockfile con cada cambio que toque el manifiesto de paquetes.

No hay código de terceros cargado desde CDN. Todo el código de terceros se instala como dependencia npm y se bundlea.

## Código

Variable y función descriptivos sin ser verbosos. Componentes modulares y de responsabilidad única.

Comentarios de código explican el *por qué* y el *qué no obvio*, nunca el *cómo*. Un comentario que reitera lo que hace una función bien nombrada es ruido.

Marcadores ASCII para urgencia: `[!]` efecto peligroso, `[?]` enfoque incierto, `[x]` ruta deprecada.

JSDoc documenta el contrato de una función pública: qué hace, parámetros, valor de retorno, excepciones. No documenta internals.

Decisiones de diseño no obvias junto al punto de decisión:

```ts
// [DECISION] {elección} — {por qué}. {tradeoff o acción futura}.
```

## Microcopy y UI

Fuente completa: `.docs/branding/03-voz-de-marca.md`.

Tutear siempre, sin excepción. Hablar en primera persona del plural: "te confirmamos", nunca "se confirmará" ni "TaJú confirma".

**Nunca culpar al usuario.** El error es del sistema o de la marca.

Los mensajes de error siguen: qué pasó → por qué importa → qué hacer. Sin signos de exclamación.

```text
MAL:  Campo obligatorio
BIEN: Nos falta el diámetro de tu torta. Sin ese dato no podemos calcular la proporción del topper.

MAL:  Ingresaste una fecha inválida
BIEN: Esa fecha ya pasó. Elige una a partir del lunes, que es lo mínimo que necesitamos para producir.
```

Los botones describen la acción concreta: "Enviar mi pedido", no "Enviar".

Prohibido: anglicismos con equivalente natural (order, checkout, cart, shipping), lenguaje corporativo vacío, voz pasiva refleja.

Excepción única: **cake topper** se mantiene en inglés. Es el término que los clientes ya usan.

En el panel de Taller el tono se apaga: funcional y neutro.

## Commits y PRs

Formato: `<type>: <qué cambió, máx. 72 chars>`

Types: `feature`, `fix`, `hotfix`, `refactor`, `test`, `chore`, `docs`, `style`, `perf`

```text
feature: add file type validation to order image upload
fix: block estado transition when esDimensionPersonalizada is true
refactor: extract order status logic to pedidos.service
test: cover JWT expiry rejection in auth middleware
docs: update AGENTS with domain language and brand rules
```

Malos patrones: mensaje > 72 chars, storytelling ("resolved an issue where…"), vagos ("various improvements").

Cada PR debe pasar: `lint` + `typecheck` + `build` + `test`.

## Verificar antes de corregir

1. Verificar el hallazgo: leer el código actual, no suposiciones sobre él.
2. Confirmar que el problema sigue siendo válido.
3. Si es inválido: saltar con una línea — `// [SKIP] Already handled in {file}:{line}`
4. Si es válido: corregir con cambios mínimos. No refactorizar código adyacente a menos que sea necesario.
5. Validar: ejecutar el test o comando de verificación relevante.
6. Reportar: qué se corrigió, qué se saltó y por qué.

## TDD y validación

**Flujo:** escribir el test → ejecutar (debe fallar) → escribir el código mínimo que lo pasa → refactorizar si es necesario → ejecutar la suite completa.

> [?] Convención de nombrado de tests y cobertura objetivo por definir al iniciar implementación.

**Antes de declarar el trabajo completo:**

1. `npm run typecheck` — sin errores de tipos.
2. `npm run lint` — sin errores de lint.
3. `npm run test` — todos los tests pasan.
4. `npm run build` — build de producción exitoso.

## Áreas de riesgo conocidas

- **Auth / JWT flow:** token en memoria del cliente, sin persistencia. Cualquier cambio afecta todas las rutas autenticadas.
- **RBAC:** middleware de Express valida el rol `administrador` en rutas de taller. Un cambio en la estructura del payload JWT rompe este middleware.
- **Cloudinary:** en tests, interceptar el módulo de integración con Cloudinary completo; nunca hacer llamadas reales.
- **MongoDB Atlas:** la cadena de conexión `MONGO_URI` define el entorno de destino. Un seed en producción es irreversible.
- **Tokens de diseño:** el archivo de tokens y `.docs/branding/04-tokens-de-diseno.md` deben coincidir. Una discrepancia entre ambos es un error, no una ambigüedad.
- **Estados de pedido:** el enum `EstadoPedido` en TypeScript, el campo en Mongoose y las etiquetas en la UI deben ser el mismo string. Cualquier divergencia genera inconsistencias silenciosas.
- **Escala de precios:** la familia `superficies` opera con precio por cantidad (mínimo 12 unidades). Lógica diferente al precio por unidad del resto del catálogo. Cualquier componente de precio debe soportar ambos modelos.
