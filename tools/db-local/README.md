# db-local

Prepara una base MongoDB local para desarrollo. Modulo externo al flujo principal: no forma parte del build, del CI ni del server.

```sh
pnpm db:local           # muestra el plan y pide confirmacion
pnpm db:local --yes     # sin preguntar
pnpm db:local --uri mongodb://127.0.0.1:27017/taju_test
```

Destino: `--uri`, si no `MONGO_URI` de la shell o de `server/.env`, si no `mongodb://127.0.0.1:27017/taju`. `--uri` sin valor es un error, no cae al siguiente.

Confirmacion: solo `--yes`/`-y` la saltan. Si se corre sin entrada interactiva (por ejemplo desde un script) y sin ese flag, el comando aborta sin aplicar nada — nunca asume un "si" implicito.

Pasos: destino, conexion, plan, aplicar. En la conexion exige que MongoDB corra como replica set: `crearPedido` usa transacciones y un standalone las rechaza ("Transaction numbers are only allowed on a replica set member"). Ademas de la URI de conexion, valida que el propio replica set (segun `hello`: `me`, `primary`, `hosts`, `passives`, `arbiters`) no anuncie ningun miembro remoto antes de tocar la base — el discovery del driver puede llegar a hosts que la URI original no listaba. Crea las colecciones que falten y los indices declarados en `server/src/models`. Idempotente: correrlo dos veces no cambia nada la segunda vez. No borra ni modifica datos, no hace seed.

[!] Rechaza cualquier destino no local (`mongodb+srv://` o algun host remoto, en URIs con varios hosts se revisan todos, y tambien la topologia real del replica set una vez conectado). Atlas nunca se toca desde aqui.

Mantenimiento: los indices salen de los schemas, asi que solo hay que tocar este modulo si se agrega o mueve un modelo (lista `MODELOS` en `setup.ts`).

Sin MongoDB instalado, replica set de un nodo en Docker, publicado solo en loopback:

```sh
docker run -d --name taju-mongo -p 127.0.0.1:27017:27017 mongo:8 --replSet rs0
# una sola vez, cuando mongod ya acepta conexiones (si falla, esperar unos segundos y repetir)
docker exec taju-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
```

El miembro se declara como `127.0.0.1:27017` y no con el hostname del contenedor: el driver se reconecta a los hosts que lista el replica set, y el hostname interno no resuelve desde la maquina. Por eso el puerto publicado tiene que ser el mismo 27017 de adentro. El `rs.initiate` queda guardado en el volumen del contenedor, un `docker start taju-mongo` posterior no lo repite.

Con Mongo instalado sin Docker: arrancar `mongod --replSet rs0` y correr el mismo `rs.initiate(...)` en `mongosh`.
