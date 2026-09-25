# seed-dev

Puebla `taju-dev` con categorias, productos y usuarios de muestra de las 4 familias
del catalogo (toppers, superficies, senaletica, papeleria). Modulo externo, igual
que `tools/db-local`: no forma parte del build, del CI ni del server.

```sh
pnpm seed:dev                              # muestra el plan y pide confirmacion
pnpm seed:dev --yes                        # sin preguntar
pnpm seed:dev --uri mongodb+srv://.../taju-dev
pnpm seed:dev --uri mongodb+srv://.../taju-prod --permitir-prod   # solo catalogo, ver abajo
```

Destino: `--uri`, si no `MONGO_URI` de la shell o de `server/.env`. A diferencia de
`db-local`, no hay default local — sin destino explicito, aborta.

[!] Sin `--permitir-prod`, rechaza incondicionalmente cualquier URI cuya base sea
`taju-prod`. Con la bandera, la confirmacion cambia: hay que tipear el nombre exacto
de la base (no alcanza con "s"), y `--yes` nunca aplica en produccion aunque se
pase junto con `--permitir-prod` - siempre pide confirmacion interactiva.

**En produccion solo se siembra el catalogo (categorias y productos), nunca los
usuarios de muestra** - `PASSWORD_SEED` esta versionada en este mismo repo publico,
asi que crear el usuario `admin@taju.test` en produccion publicaria una cuenta de
administrador con contrasena conocida. Pensado para cargar el catalogo real antes
de un lanzamiento, no para poblar produccion con datos ficticios.

Idempotente via `$setOnInsert`: un documento que ya existe (por `nombre` en
categorias/productos, por `email` en usuarios) nunca se sobreescribe. Correrlo
varias veces no duplica ni pisa datos que ya estaban.

Usuarios de muestra (solo fuera de produccion): `cliente@taju.test` (rol `cliente`) y
`admin@taju.test` (rol `administrador`), ambos con la contrasena en `PASSWORD_SEED`
(`tools/seed-dev/datos.ts`) - no es un secreto real, solo sirve para loguearse contra
datos de muestra en dev.

Mantenimiento: agregar o ajustar muestras en `datos.ts`, no en `seed.ts`.
