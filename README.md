# taju.platform

Plataforma web para **Taju Studio**, estudio creativo dedicado al diseño y fabricación de artículos personalizados para eventos y marcas. Centraliza la exhibición del portafolio, la captura parametrizada de pedidos y la gestión interna de producción.

Proyecto Integrador II | Ingeniería de Software, Universidad Surcolombiana.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, React Hook Form, React Router |
| Backend | Node.js 20 LTS, TypeScript, Express.js |
| Base de datos | MongoDB Atlas (Mongoose ODM) |
| Almacenamiento de imágenes | Cloudinary |
| Autenticación | JWT (almacenado en memoria, sin localStorage) |
| Seguridad | bcrypt, validación de entradas en servidor |

---

## Estructura del repositorio

```
taju.platform/
├── client/       # Frontend React
├── server/       # API REST Express
└── .env.example  # Variables de entorno requeridas
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
# Instalar dependencias
cd client && npm install
cd ../server && npm install

# Iniciar ambos servicios
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

---

## Módulos principales

**Vitrina** - catálogo categorizado de productos, accesible sin autenticación.

**Pedido** - formulario parametrizado con captura de dimensiones, materiales, paleta de colores e imágenes de referencia (JPG, máx. 5 MB).

**Taller** - panel del Administrador con gestión de órdenes, transición de estados y calendario visual de entregas.

---

## Roles

El sistema diferencia dos roles mediante JWT: `cliente` y `administrador`. Las rutas del panel de gestión requieren rol `administrador`; cualquier acceso no autorizado recibe `401` o `403`.

---

## Equipo

Manuel Felipe Rojas Yasnó · Brayan Toro Bustos · Carlos Esteban Pérez Roso
