# taju.platform

Plataforma web para **TaJú**, taller de corte y grabado láser en Neiva (Huila) que produce papelería y objetos personalizados para celebraciones y eventos. Centraliza la exhibición del catálogo, la captura parametrizada de pedidos y la gestión interna de producción.

Proyecto Integrador II | Ingeniería de Software, Universidad Surcolombiana.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js 20 LTS, TypeScript, Express.js |
| Base de datos | MongoDB Atlas (Mongoose ODM) |
| Almacenamiento de imágenes | Cloudinary |
| Autenticación | JWT (en memoria del cliente, sin localStorage) |
| Seguridad | bcrypt, Zod, validación de entradas en servidor |
| Package manager | pnpm 11 (monorepo con workspaces) |
| Testing | Vitest, Supertest, mongodb-memory-server (server), React Testing Library (client) |

---

## Estructura del repositorio

```
taju.platform/
├── client/          # Frontend React 18 + Vite + Tailwind
├── server/          # API REST Express + Mongoose
├── .docs/           # Documentación normativa y branding
├── .github/         # Workflows CI, CodeQL, Dependabot, plantilla de PR
└── AGENTS.md        # Guía de arquitectura y convenciones del proyecto
```

---

## Variables de entorno

Copia `server/.env.example` a `server/.env` (desarrollo) y completa los valores. Ver el archivo para la lista completa (`NODE_ENV`, `PORT`, `MONGO_URI`, `JWT_SECRET`/`JWT_EXPIRES_IN`, las tres de Cloudinary y `CLIENT_URL`).

---

## Desarrollo local

```bash
# Instalar dependencias (desde la raíz del monorepo)
pnpm install

# Iniciar ambos servicios en terminales separadas
pnpm dev:client   # Vite — http://localhost:5173
pnpm dev:server   # tsx watch — http://localhost:3001
```

---

## Comandos útiles

```bash
pnpm typecheck                    # tsc --noEmit en client y server
pnpm lint                         # eslint en client y server
pnpm --filter taju-server test    # Vitest + mongod en memoria
pnpm --filter taju-client test    # Vitest + jsdom
pnpm build:client                 # Build de producción del frontend
```

`husky` corre `typecheck` + `lint` automáticamente antes de cada `git push` (`.husky/pre-push`), instalado solo via `pnpm install`.

---

## Módulos principales

**Catálogo** — exhibición categorizada de productos (toppers, superficies, señalética, papelería), accesible sin autenticación.

**Pedido** — formulario parametrizado con captura de dimensiones, materiales, acabado e imágenes de referencia.

**Taller** — panel del administrador con gestión de órdenes, transición de estados y seguimiento de producción.

---

## Roles

Dos roles diferenciados mediante JWT: `cliente` y `administrador`. Las rutas del panel de Taller requieren rol `administrador`; cualquier acceso no autorizado recibe `401` o `403`.

---

## Calidad y CI/CD

| Herramienta | Función |
|---|---|
| GitHub Actions (`ci.yml`) | Lint + typecheck + test + build en cada push y PR a `main` y `dev` |
| GitHub Actions (`codeql.yml`) | Análisis estático de seguridad JS/TS (XSS, injection, JWT) |
| GitHub Actions (`keep-alive.yml`) | Ping a `/health` cada 10 min para evitar el cold start del free tier de Render |
| GitGuardian | Escaneo de secretos hardcodeados en cada PR |
| Dependabot | Actualizaciones semanales de dependencias agrupadas por workspace |
| CodeRabbit | Revisión automática de PRs con contexto del dominio taju |

---

## Equipo

Manuel Felipe Rojas Yasnó · Brayan Toro Bustos · Carlos Esteban Pérez Roso
