# taju.platform

Plataforma web para **TaJú** — taller de corte y grabado láser en Neiva (Huila) que produce
papelería y objetos personalizados para celebraciones y eventos. Centraliza la exhibición del
catálogo, la captura parametrizada de pedidos y la gestión interna de producción.

Proyecto Integrador II | Ingeniería de Software, Universidad Surcolombiana.

[![CI](https://github.com/trbureiyan/taju.platform/actions/workflows/ci.yml/badge.svg)](https://github.com/trbureiyan/taju.platform/actions/workflows/ci.yml)
[![CodeQL](https://github.com/trbureiyan/taju.platform/actions/workflows/codeql.yml/badge.svg)](https://github.com/trbureiyan/taju.platform/actions/workflows/codeql.yml)

---

## Stack

| Capa              | Tecnología                                                              |
|-------------------|-------------------------------------------------------------------------|
| Frontend          | React 18, TypeScript, Vite, Tailwind CSS 4, React Router               |
| Movimiento        | `motion` (springs M3 Expressive), `lucide-react`                       |
| Backend           | Node.js 20 LTS, TypeScript, Express.js                                 |
| Base de datos     | MongoDB Atlas, Mongoose ODM                                             |
| Almacenamiento    | Cloudinary                                                              |
| Autenticación     | JWT en memoria del cliente (sin localStorage)                          |
| Seguridad         | bcrypt, Zod, validación de entradas en servidor                        |
| Analítica         | Vercel Web Analytics                                                    |
| Package manager   | pnpm 11, workspaces monorepo                                            |
| Testing           | Vitest, Supertest, mongodb-memory-server, React Testing Library        |

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

## Módulos

**Vitrina**
Landing pública en `/`. Promesa de marca, familias de producto y llamado a la acción
diferenciado por audiencia (cliente final / profesional).

**Catálogo**
Exhibición categorizada de productos — toppers, superficies, señalética, papelería.
Accesible sin autenticación.

**Pedido**
Formulario parametrizado con captura de dimensiones, materiales, acabado e imágenes de
referencia. "Pedir de nuevo" precarga un pedido anterior.

**Mis pedidos**
Seguimiento del cliente: código compartido con el taller, línea de tiempo con historial
de estados y fecha de entrega.

**Taller**
Panel del administrador con gestión de órdenes, transición de estados y seguimiento de
producción.

---

## Roles

Dos roles diferenciados mediante JWT: `cliente` y `administrador`. Las rutas del panel de
Taller requieren rol `administrador`; cualquier acceso no autorizado recibe `401` o `403`.

---

## Calidad y CI/CD

| Herramienta                          | Función                                                                        |
|--------------------------------------|--------------------------------------------------------------------------------|
| GitHub Actions — `ci.yml`            | Lint + typecheck + test + build en cada push y PR a `main` y `dev`             |
| GitHub Actions — `codeql.yml`        | Análisis estático de seguridad JS/TS (XSS, injection, JWT)                     |
| GitHub Actions — `keep-alive.yml`    | Ping a `/health` cada 10 min para evitar el cold start del free tier de Render |
| GitGuardian                          | Escaneo de secretos hardcodeados en cada PR                                    |
| Dependabot                           | Actualizaciones semanales de dependencias agrupadas por workspace               |
| CodeRabbit                           | Revisión automática de PRs con contexto del dominio taju                       |

---

## Equipo

Manuel Felipe Rojas Yasnó · Brayan Toro Bustos · Carlos Esteban Pérez Roso
