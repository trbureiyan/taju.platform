# seed-dev

Puebla `taju-dev` con categorias, productos y usuarios de muestra de las 4 familias
del catalogo (toppers, superficies, senaletica, papeleria). Modulo externo, igual
que `tools/db-local`: no forma parte del build, del CI ni del server.

```sh
pnpm seed:dev           # muestra el plan y pide confirmacion
pnpm seed:dev --yes     # sin preguntar
pnpm seed:dev --uri mongodb+srv://.../taju-dev
```

Destino: `--uri`, si no `MONGO_URI` de la shell o de `server/.env`. A diferencia de
`db-local`, no hay default local — sin destino explicito, aborta.

[!] Rechaza incondicionalmente cualquier URI cuya base sea `taju-prod`. No hay flag
para saltarse esto: este script crea datos reales y nunca debe poder tocar produccion.

Idempotente via `$setOnInsert`: un documento que ya existe (por `nombre` en
categorias/productos, por `email` en usuarios) nunca se sobreescribe. Correrlo
varias veces no duplica ni pisa datos que ya estaban.

Usuarios de muestra: `cliente@taju.test` (rol `cliente`) y `admin@taju.test` (rol
`administrador`), ambos con la contrasena en `PASSWORD_SEED` (`tools/seed-dev/datos.ts`)
- no es un secreto real, solo sirve para loguearse contra datos de muestra en dev.

Mantenimiento: agregar o ajustar muestras en `datos.ts`, no en `seed.ts`.
