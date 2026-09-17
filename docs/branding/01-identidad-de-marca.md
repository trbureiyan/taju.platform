---
documento: Identidad de Marca
marca: TaJú
version: 1.0
estado: borrador para validación con el cliente
fecha: 2026-09-16
autor: Equipo Proyecto Integrador II, Universidad Surcolombiana
alcance: Documento fundacional. Rige sobre Pautas de Marca, Voz de Marca y Tokens de Diseño.
documentos_relacionados:
  - 02-pautas-de-marca.md
  - 03-voz-de-marca.md
  - 04-tokens-de-diseno.md
---

# Identidad de Marca — TaJú

## 0. Cómo usar este documento

Este es el documento raíz del sistema de marca de TaJú. Define quién es la marca, qué promete y qué territorio ocupa. Todo lo demás se deriva de aquí: si una decisión de color, tipografía, texto o interfaz contradice algo escrito en este archivo, la decisión está mal, no el documento.

Cuando exista una duda de diseño o de redacción que este documento no resuelva de forma explícita, la regla es consultar el apartado de Personalidad y Territorio y resolver por coherencia, nunca por preferencia estética individual.

---

## 1. Nomenclatura

La marca opera con tres nombres simultáneos y cada uno tiene un uso exclusivo. Confundirlos es el error más frecuente que ya presenta el material existente.

| Tipo | Nombre | Dónde se usa |
|---|---|---|
| Razón social | Tajú Neiva | RUT, facturación, contratos, documentos tributarios y legales, pie de página legal del sitio |
| Marca comercial | TaJú | Logotipo, interfaz, comunicación, empaques, publicidad, títulos de página |
| Descriptor | Papelería Creativa | Acompaña a la marca comercial en presentaciones formales y en el logotipo completo |
| Identificador digital | taju_neiva | Instagram, y por coherencia cualquier red social futura |

La forma canónica escrita es **TaJú**, con jota mayúscula intermedia y tilde en la u. La tilde no es opcional. Es el rasgo ortográfico que distingue a la marca y su omisión en interfaces o metadatos debilita el reconocimiento y fragmenta la búsqueda.

La forma completa es **TaJú · Papelería Creativa**. Se usa cuando la marca se presenta por primera vez ante una audiencia, en el encabezado del sitio, en documentos formales y en el pie de página.

### Nombres retirados

Las siguientes denominaciones aparecen en material histórico y quedan formalmente descontinuadas. No deben reproducirse en ningún activo nuevo.

- "TaJu Estudio Creativo" (banner de Facebook). El descriptor "Estudio Creativo" es genérico, no comunica categoría y compite con el descriptor oficial.
- "Taju Studio" (documentación académica previa). Anglicismo innecesario y sin respaldo en ningún activo real de la marca.
- Cualquier escritura sin tilde: "Taju", "TAJU", "Tajú" con jota minúscula.

---

## 2. Categoría de negocio

TaJú es un taller de **corte y grabado láser aplicado a papelería y objetos personalizados para celebraciones y eventos**, con sede en Neiva, Huila.

Esta definición es más precisa que "papelería" a secas y más honesta que "estudio creativo". El valor real del negocio no está en vender papel, está en transformar un archivo digital en un objeto físico personalizado con precisión milimétrica, en materiales como MDF, acrílico y vinilo. Esa capacidad técnica es la barrera de entrada y por lo tanto el centro de la identidad.

### Qué fabrica TaJú

El catálogo real, documentado a partir de la producción publicada, se organiza en cuatro familias.

**Toppers y apliques para torta.** Cake toppers en MDF y acrílico, con temáticas de personajes, nombres personalizados, edades y motivos temáticos. Es la línea más visible y la que genera mayor volumen de interacción.

**Superficies y bases.** Blondas de MDF grabadas en cara blanca, en escalas que van de quince a cuarenta centímetros, correspondientes a las medidas estándar de repostería desde octavo de libra hasta dos libras.

**Señalética y ambientación de evento.** Letreros de cumpleaños, banners, letras en vinilo, números y elementos decorativos de montaje.

**Papelería de invitación y detalle.** Tarjetas e invitaciones tipo pase VIP, llaveros personalizados, cajas, vasos y elementos de recordatorio.

### Qué no fabrica TaJú

Es igual de importante fijar el límite. TaJú no es repostería, no produce alimentos, no organiza eventos y no presta servicio de decoración en sitio. Fabrica los objetos que otros usan para decorar y celebrar. Cualquier comunicación que sugiera lo contrario genera expectativas que el negocio no puede cumplir.

---

## 3. Las dos audiencias

Este es el hallazgo estratégico más importante del diagnóstico y tiene consecuencias directas sobre la arquitectura de la plataforma web. TaJú atiende dos públicos con lógicas de compra completamente distintas, y hoy los mezcla en un mismo canal informal.

### Audiencia A: el cliente final

Madres, padres y familiares que organizan un cumpleaños, un grado, un baby shower o una celebración puntual. Compran una vez, por unidad o en cantidades pequeñas, con carga emocional alta y con urgencia. Su criterio de decisión es que el objeto se vea exactamente como lo imaginaron y llegue a tiempo. Su mayor punto de fricción es que no sabe especificar: desconoce medidas, no tiene claridad sobre proporciones y frecuentemente pide algo que no encaja con su torta o su montaje.

Esta audiencia necesita que la marca la guíe. La evidencia está en el propio contenido de TaJú, que ya produce piezas educativas explicando cómo medir el diámetro y la altura de una torta antes de encargar un topper. El 34.4 por ciento de reprocesos por especificación faltante documentado en el diagnóstico proviene mayoritariamente de aquí.

### Audiencia B: el cliente profesional

Reposteras, panaderías, organizadoras de eventos y otros negocios que compran insumos de forma recurrente. La lista de precios de blondas con escalas para más de doce y más de cien unidades, y con un mínimo de doce, confirma que esta línea ya existe y opera con lógica mayorista. Compran por volumen, con criterio de precio por unidad, repiten pedido y valoran la previsibilidad y el cumplimiento por encima de la sorpresa.

Esta audiencia no necesita ser educada. Necesita eficiencia: repetir un pedido anterior sin volver a explicarlo, ver precios por escala sin preguntar, y saber cuándo estará listo.

### Consecuencia para la plataforma

La Vitrina y el módulo de Pedido deben reconocer que estos dos recorridos son distintos. Un cliente final necesita acompañamiento, validación de medidas y referencias visuales. Un cliente profesional necesita catálogo con escalas de precio y repetición rápida de pedido. Forzar a ambos por el mismo flujo penaliza a los dos.

---

## 4. Propósito

TaJú existe para que cada celebración tenga objetos que se vean exactamente como la persona los imaginó.

El propósito no es fabricar. Fabricar es el medio. Lo que la marca resuelve es la distancia entre lo que alguien imagina para un momento importante y lo que efectivamente logra conseguir. Esa distancia se cierra con dos cosas: precisión técnica en la producción y claridad en la comunicación previa al pedido.

---

## 5. Promesa de marca

**Te ayudamos a pedir bien para que salga bien.**

Esta promesa es deliberadamente distinta a la de la competencia, que promete calidad o rapidez. TaJú promete algo anterior: que el cliente no va a equivocarse al encargar, porque la marca lo va a acompañar en la especificación.

La promesa tiene respaldo real en el comportamiento actual del negocio. TaJú ya produce contenido que enseña a medir, ya advierte sobre proporciones desbalanceadas, ya corrige al cliente antes de producir. Este documento no inventa una postura, formaliza la que la marca ya tiene.

La plataforma web es la extensión natural de esta promesa. Un formulario de pedido que valida medidas, muestra referencias visuales de escala y exige los datos correctos antes de permitir el envío no es una restricción burocrática, es la promesa de marca convertida en producto.

---

## 6. Arquetipo

El arquetipo dominante de TaJú es el **Artesano** (o Creador), con una capa secundaria de **Cuidador**.

El Artesano es el que hace las cosas bien hechas, el que domina un oficio técnico y disfruta la ejecución precisa. Explica el amarillo cálido, el trazo grueso y confiado del logotipo, y la exhibición constante del producto terminado en primer plano. La marca muestra lo que hace porque está orgullosa de cómo lo hace.

La capa de Cuidador aparece en la postura educativa y en el tono. TaJú no solo entrega el objeto, se preocupa por que el cliente no se equivoque. Explica, advierte, corrige con amabilidad. Esa es una conducta de cuidado, no de venta.

El arquetipo que TaJú debe evitar es el de **Mago** o el de **Sabio distante**. La marca no promete transformación mágica ni habla desde una autoridad inaccesible. Habla desde el taller, con las manos en el material.

---

## 7. Principios de marca

Estos cinco principios son el criterio de desempate cuando una decisión de diseño, texto o producto no tiene respuesta obvia.

**Primero la claridad, después el encanto.** Si un elemento decorativo compromete la comprensión de una medida, un precio o una fecha, el elemento decorativo se retira. La marca es cálida, pero nunca a costa de la precisión.

**La precisión es el producto.** Un topper con la medida equivocada no es un producto imperfecto, es un producto inservible. Toda la comunicación y toda la interfaz deben proteger la exactitud del dato.

**Enseñar antes de vender.** Cuando el cliente no sabe qué pedir, la respuesta correcta es explicarle, no adivinar por él. Esto aplica al contenido, al microcopy y a los estados de validación de la plataforma.

**Mostrar el trabajo real.** La marca se comunica con fotografía del producto terminado y del proceso, no con renders ni stock. La prueba de capacidad es el objeto mismo.

**Cumplir la fecha es parte del producto.** En celebraciones no existe la entrega tardía útil. Un pedido entregado después del evento vale cero. Toda promesa de tiempo debe ser conservadora y verificable.

---

## 8. Personalidad

La personalidad de TaJú se define mejor por tensión entre extremos que por adjetivos sueltos. En cada eje, la marca se ubica en un punto específico y no en el centro.

**Cálida, no meloza.** Tutea, celebra con el cliente, usa humor. No usa diminutivos excesivos ni emojis en cascada ni lenguaje infantilizado hacia el adulto que compra.

**Cercana, no informal hasta el descuido.** Escribe como una persona real y no como una empresa. Pero cuida la ortografía, la puntuación y la coherencia, porque el descuido en el texto sugiere descuido en la producción.

**Técnica, no fría.** Habla de medidas, materiales y tiempos con precisión. Pero traduce esa precisión a lenguaje humano. Dice "veintidós centímetros, el tamaño de una torta de media libra", no solo "22 cm".

**Confiada, no arrogante.** Afirma lo que sabe hacer y lo demuestra. No presume de ser la mejor ni descalifica alternativas.

**Alegre, no estridente.** El territorio es la celebración, así que la marca es festiva por naturaleza. Pero la alegría vive en el color y en el producto, no en signos de exclamación acumulados.

---

## 9. Activos de identidad existentes

Inventario de lo que la marca ya tiene construido, con su estado actual. Este apartado alimenta directamente el documento de Pautas de Marca.

### Logotipo

Existe un sistema de logotipo funcional y bien resuelto, disponible en archivo original de Illustrator. Incluye una versión vertical con el rostro del gato sobre el wordmark, una versión horizontal con el rostro a la izquierda, una versión monocromática de contorno, y el rostro aislado como isotipo para avatares. El wordmark usa una tipografía serif de peso alto con terminaciones redondeadas.

**Pendiente crítico.** Falta exportación a SVG con fondo transparente para uso web. Es el primer entregable técnico del proyecto y bloquea el desarrollo del frontend.

### Sistema cromático

La paleta opera de facto en todo el material sin haber sido formalizada. Amarillo mostaza como color de marca, turquesa como color de fondo y soporte, negro cálido como color de contorno y texto, y un rosa suave como acento mínimo proveniente del hocico del gato. Los valores exactos se fijan en el documento de Pautas.

### Mascota

El gato es el activo diferencial de la marca y hoy está subutilizado. Existen, como mínimo, tres representaciones ya producidas: el rostro aislado en versión plana, una pose de cuerpo entero con los brazos elevados en gesto de celebración, y una pose de cuerpo entero señalando hacia un elemento.

**Decisión de alcance.** El proyecto no producirá ilustraciones nuevas de la mascota. Se trabajará exclusivamente con recorte, limpieza y exportación de las piezas ya existentes. Ese set mínimo de tres es suficiente para cubrir los estados de interfaz que lo requieren: confirmación de pedido, estado vacío y guía de onboarding.

**Pendiente.** La mascota no tiene nombre propio. Nombrarla es una oportunidad de bajo costo y alto retorno, pero requiere decisión del propietario y queda fuera del alcance obligatorio del proyecto.

### Activos descontinuados

El banner de Facebook constituye un sistema visual paralelo e incompatible con la identidad oficial: tipografía de burbuja en cian y magenta ajena al wordmark, tratamiento ilustrativo del gato distinto al del logotipo, y fondo amarillo pálido fuera de paleta. Queda retirado y debe reemplazarse por una pieza construida con el sistema oficial.

---

## 10. Posicionamiento

Para quien organiza una celebración en Neiva y quiere que cada detalle se vea como lo imaginó, TaJú es el taller de corte y grabado láser que acompaña el pedido desde antes de producirlo, porque entiende que el error más caro no ocurre en la máquina sino en la especificación.

### Frente a la competencia

La competencia local directa compite por precio y por catálogo de personajes. La competencia digital, principalmente vendedores de plataformas de comercio electrónico, compite por precio y volumen sin ninguna capacidad de personalización real ni de asesoría.

El diferencial defendible de TaJú no es el precio ni el catálogo, porque ambos son copiables. Es la combinación de capacidad técnica propia de producción con acompañamiento en la especificación. Un vendedor de catálogo no puede validar si la medida que pediste corresponde a tu torta. TaJú sí, y ya lo hace.

---

## 11. Implicaciones para la plataforma web

Este apartado traduce la identidad en restricciones concretas de producto. Es el puente hacia el desarrollo del frontend.

La **Vitrina** debe mostrar producto real fotografiado, organizado por las cuatro familias de producto y no por una taxonomía inventada. Debe diferenciar visualmente la oferta por unidad de la oferta por escala mayorista, porque atiende a dos audiencias distintas.

El **módulo de Pedido** es donde la promesa de marca se vuelve producto. Debe exigir los datos que hoy generan reproceso, ofrecer referencias visuales de escala en lugar de pedir un número abstracto, y validar antes de permitir el envío. El vocabulario de los campos debe replicar el que el negocio ya usa con sus clientes: nombre, edad, tipo, medidas de torta con diámetro y altura, fecha de entrega y nota. No inventar terminología nueva donde ya existe una compartida.

El **panel de Taller** es la cara interna de la marca y su criterio rector es la legibilidad operativa bajo presión. Debe priorizar fecha de entrega, estado y especificación completa. La personalidad de marca se expresa aquí con contención: color de estado y jerarquía clara, sin decoración.

El **microcopy transversal** debe sostener la postura educativa. Los mensajes de error explican qué falta y por qué importa, no solo señalan un campo inválido. Los estados vacíos orientan hacia la siguiente acción. Las confirmaciones celebran sin exagerar.

---

## 12. Decisiones pendientes

Registro de lo que este documento no puede resolver por sí solo y requiere validación del propietario.

- Confirmación formal de la coexistencia entre razón social "Tajú Neiva" y marca comercial "TaJú · Papelería Creativa".
- Retiro efectivo del banner de Facebook y de la denominación "Estudio Creativo" en todos los canales activos.
- Nombre propio para la mascota. Opcional, no bloqueante.
- Confirmación de que las cuatro familias de producto cubren el catálogo completo y vigente.
- Definición de la política de tiempos de entrega por familia de producto, necesaria para que la plataforma pueda comprometer fechas.

---

## 13. Control de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-09-16 | Versión inicial. Consolidación de nomenclatura, definición de categoría real de negocio, identificación de doble audiencia, formalización de promesa y arquetipo, inventario de activos. |
