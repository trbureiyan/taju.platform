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
| Package manager | pnpm 9 (monorepo con workspaces) |

---

## Estructura del repositorio

```
taju.platform/
├── client/          # Frontend React 18 + Vite + Tailwind
├── server/          # API REST Express + Mongoose
├── .docs/           # Documentación normativa y branding
├── .github/         # Workflows CI, CodeQL, Dependabot, plantilla de PR
├── .env.example     # Variables de entorno requeridas
└── AGENTS.md        # Guía de arquitectura y convenciones del proyecto
```

---

## Variables de entorno

Copia `.env.example` a `.env` en `server/` y completa los valores:

```env
PORT=
MONGO_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

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
pnpm typecheck    # tsc --noEmit en client y server
pnpm lint         # eslint en client y server
pnpm build:client # Build de producción del frontend
```

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
| GitHub Actions (`ci.yml`) | Lint + typecheck + build en cada push y PR a `main` y `dev` |
| GitHub Actions (`codeql.yml`) | Análisis estático de seguridad JS/TS (XSS, injection, JWT) |
| Dependabot | Actualizaciones semanales de dependencias agrupadas por workspace |
| CodeRabbit | Revisión automática de PRs con contexto del dominio taju |

---

## Equipo

Manuel Felipe Rojas Yasnó · Brayan Toro Bustos · Carlos Esteban Pérez Roso
