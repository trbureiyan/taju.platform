# db-local

Prepara una base MongoDB local para desarrollo. Modulo externo al flujo principal: no forma parte del build, del CI ni del server.

```sh
pnpm db:local           # muestra el plan y pide confirmacion
pnpm db:local --yes     # sin preguntar (tambien si no hay TTY)
pnpm db:local --uri mongodb://127.0.0.1:27017/taju_test
```

Destino: `--uri`, si no `MONGO_URI` de la shell o de `server/.env`, si no `mongodb://127.0.0.1:27017/taju`.

Pasos: destino, conexion, plan, aplicar. Crea las colecciones que falten y los indices declarados en `server/src/models`. Idempotente: correrlo dos veces no cambia nada la segunda vez. No borra ni modifica datos, no hace seed.

[!] Rechaza cualquier destino no local (`mongodb+srv://` o host remoto). Atlas nunca se toca desde aqui.

Mantenimiento: los indices salen de los schemas, asi que solo hay que tocar este modulo si se agrega o mueve un modelo (lista `MODELOS` en `setup.ts`).

Sin MongoDB instalado: `docker run -d --name taju-mongo -p 27017:27017 mongo:8`.
