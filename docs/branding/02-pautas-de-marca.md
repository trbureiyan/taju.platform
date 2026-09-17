---
documento: Pautas de Marca
marca: TaJú
version: 1.1
estado: borrador para validación con el cliente
fecha: 2026-09-17
autor: Equipo Proyecto Integrador II, Universidad Surcolombiana
alcance: Sistema visual normativo. Depende de 01-identidad-de-marca.md y alimenta 04-tokens-de-diseno.md.
metodo: Valores cromáticos y tipográficos extraídos del archivo vectorial original de la marca, fuente autoritativa. Ratios de contraste calculados según WCAG 2.1.
documentos_relacionados:
  - 01-identidad-de-marca.md
  - 03-voz-de-marca.md
  - 04-tokens-de-diseno.md
---

# Pautas de Marca — TaJú

## 0. Naturaleza de este documento

Este documento es normativo, no sugerente. Define qué está permitido y qué está prohibido en la expresión visual de TaJú. Su función es eliminar la decisión estética individual de la ecuación: cuando una regla existe aquí, se aplica, aunque alguien crea que otra opción se ve mejor.

Los valores cromáticos de este documento fueron extraídos por muestreo de píxeles sobre los archivos originales de la marca. No son aproximaciones. Cuando un valor difiere de lo que aparece en una pieza histórica, este documento prevalece.

---

## 1. Sistema cromático

### 1.1 Colores de marca

Estos tres colores constituyen la identidad. Ninguno es negociable y ninguno puede reemplazarse por un tono cercano.

| Rol | Nombre | HEX | RGB | HSL |
|---|---|---|---|---|
| Primario | Amarillo TaJú | `#F5D447` | 245, 212, 71 | 49°, 90%, 62% |
| Sombra del primario | Oro TaJú | `#BD9E27` | 189, 158, 39 | 48°, 66%, 45% |
| Sombra profunda | Oro Profundo | `#A7912F` | 167, 145, 47 | 49°, 56%, 42% |
| Tinta | Negro TaJú | `#2B2B2A` | 43, 43, 42 | 60°, 1%, 17% |

Estos valores provienen del archivo vectorial original de la marca y son la fuente autoritativa. Reemplazan cualquier valor obtenido por muestreo de imágenes rasterizadas, que sufren compresión y perfilado de color.

El Amarillo TaJú es el relleno del cuerpo del gato. El Oro y el Oro Profundo son los dos niveles de sombra volumétrica dentro de la misma ilustración, por lo que no son colores independientes sino la profundidad del primario. El Negro TaJú no es negro puro: tiene una desviación cálida mínima que evita la dureza del `#000000` y mantiene la coherencia con el contorno del logotipo.

**Prohibición explícita.** No se usa `#000000` en ningún texto ni contorno de marca. El negro puro aparece en algunas piezas históricas y es un error a corregir.

### 1.2 Colores de soporte

El turquesa no está en el logotipo pero domina toda la comunicación de la marca, por lo que es funcionalmente un color de marca de segundo orden. El material existente presenta dos versiones y hay que resolverlo.

| Nombre | HEX | RGB | HSL | Estado |
|---|---|---|---|---|
| Turquesa TaJú | `#7CC9CF` | 124, 201, 207 | 184°, 46%, 65% | **Canónico** |
| Cian saturado | `#5CE1E6` | 92, 225, 230 | 182°, 73%, 63% | **Retirado** |
| Rosa TaJú | `#F195BD` | 241, 149, 189 | 334°, 77%, 76% | Acento, uso mínimo |

**Decisión y justificación.** Se adopta `#7CC9CF` como turquesa canónico y se retira `#5CE1E6`. El cian saturado es el valor por defecto de la herramienta de diseño con la que se produjo el contenido de redes, no una elección de marca. Su saturación de 73% compite con el amarillo primario en lugar de sostenerlo, vibra ópticamente al colocarse junto a él, y en superficies grandes de interfaz produce fatiga visual. El turquesa canónico conserva el mismo territorio cromático con 46% de saturación, lo que permite usarlo como fondo extenso sin que el producto fotografiado pierda protagonismo.

El Rosa TaJú proviene del hocico del gato. Es un acento de aparición escasa, no un color de interfaz. Se usa para señalar afecto o celebración, nunca para estados de sistema ni para elementos estructurales.

### 1.3 Neutros de superficie

| Nombre | HEX | Uso |
|---|---|---|
| Blanco | `#FFFFFF` | Superficie principal de contenido, tarjetas de producto |
| Crema | `#FDF8E7` | Superficie cálida alternativa, secciones destacadas |
| Hielo | `#EAF7F8` | Superficie fría alternativa, bloques informativos y educativos |

Crema y Hielo son derivados de luminosidad alta del Amarillo y el Turquesa respectivamente. Existen para dar variación de superficie sin introducir grises neutros, que romperían la calidez del sistema.

### 1.4 Matriz de contraste

Ratios calculados según WCAG 2.1. El umbral AA para texto normal es 4.5, para texto grande es 3.0, y AAA para texto normal es 7.0.

| Combinación | Ratio | Veredicto |
|---|---|---|
| Tinta sobre Blanco | 14.17 | AAA |
| Tinta sobre Crema | 13.33 | AAA |
| Tinta sobre Hielo | 12.93 | AAA |
| Tinta sobre Amarillo | 9.71 | AAA |
| Tinta sobre Turquesa | 7.50 | AAA |
| Tinta sobre Rosa | 6.60 | AA |
| Oro Profundo sobre Blanco | 3.12 | Solo texto grande |
| Oro sobre Blanco | 2.60 | **Falla** |
| Blanco sobre Oro | 2.60 | **Falla** |
| Blanco sobre Turquesa | 1.89 | **Falla** |
| Blanco sobre Amarillo | 1.46 | **Falla** |

### 1.5 Regla cromática fundamental

De la matriz anterior se desprende la regla más importante de todo el sistema visual y debe memorizarse.

**Sobre cualquier color de marca, el texto va en Tinta. Nunca en blanco.**

El amarillo y el turquesa son colores de luminosidad alta. El texto blanco sobre ellos es ilegible y falla accesibilidad por un margen amplio, no marginal. Esta regla no tiene excepción en interfaz. En piezas gráficas impresas, el texto blanco solo es admisible sobre fotografía oscura con superposición de contraste verificada.

Corolario: cuando se necesite un color de marca para texto sobre fondo blanco, ninguno de los colores de marca sirve. El Amarillo sobre blanco da 1.5 y el Oro da 2.81. En esos casos se usa Tinta.

---

## 2. Tipografía

### 2.1 Tipografías declaradas por la marca

El archivo vectorial original contiene una leyenda tipográfica explícita. La marca declara dos familias y esa declaración es autoritativa.

| Rol en la marca | Familia | Aplicación original |
|---|---|---|
| Wordmark | **Verona Bold** | La palabra "TaJú" del logotipo |
| Descriptor y texto | **Poppins** | "Papelería Creativa" y comunicación general |

Verona es una serif de sabor retro publicada por SoftMaker, con siete pesos. El peso Regular se distribuye de forma gratuita, pero el peso Bold que usa el wordmark es comercial y requiere licencia tanto de escritorio como web.

### 2.2 Sistema tipográfico definido

| Rol | Familia | Condición |
|---|---|---|
| Logotipo | Verona Bold | Trazado vectorial, nunca texto vivo |
| Titulares | Poppins SemiBold 600 | Google Fonts, libre |
| Interfaz y texto | Poppins Regular 400 y Medium 500 | Google Fonts, libre |
| Datos y códigos | JetBrains Mono | Google Fonts, libre. Exclusiva para códigos de pedido e identificadores que el usuario deba leer carácter por carácter |

**Rectificación respecto a la versión 1.0.** La versión anterior de este documento proponía sustituir Poppins por Fraunces y Nunito Sans, bajo el supuesto de que Poppins era una elección por defecto de la herramienta de diseño y no una decisión de marca. El archivo vectorial demuestra que sí es una decisión declarada. La propuesta anterior queda retirada. Cuando una marca ha fijado su tipografía, el equipo de desarrollo la respeta y trabaja dentro de esa restricción en lugar de sustituirla.

**Tratamiento de Verona.** El wordmark ya existe como trazado vectorial, por lo que reproducir el logotipo no requiere licencia de fuente. La restricción es no componer nunca texto vivo en Verona dentro de la plataforma, porque eso sí exigiría licencia web y además dejaría el sitio sin fuente de respaldo. Si en el futuro se desea usar la serif en titulares de marketing, debe adquirirse la licencia web de Verona Serial Bold. Mientras eso no ocurra, los titulares se componen en Poppins SemiBold.

### 2.3 Compensación de las limitaciones de Poppins

Poppins es una sans geométrica de construcción circular, con altura de x moderada y trazos de grosor casi uniforme. Es cálida y legible en tamaños medianos y grandes, pero pierde eficiencia en texto pequeño de formulario, que es precisamente donde la plataforma se juega la precisión del pedido. Como no se sustituye la familia, se compensa con reglas de composición.

Ningún texto de interfaz baja de 14 píxeles. Las etiquetas de campo se componen en peso 500 y no en 400, para ganar densidad sin aumentar tamaño. El interlineado de texto corrido se fija en 1.6 en lugar de 1.5, porque la geometría circular necesita más aire vertical para no compactarse. No se aplica espaciado entre letras negativo en ningún caso. Las cifras se componen con `font-variant-numeric: tabular-nums` para que precios y medidas alineen en columna.

### 2.4 Escala tipográfica

Escala modular de razón 1.25, base 16px.

| Token | Tamaño | Uso |
|---|---|---|
| `display` | 48px / 3rem | Titular principal de vitrina |
| `h1` | 39px / 2.441rem | Título de página |
| `h2` | 31px / 1.953rem | Título de sección |
| `h3` | 25px / 1.563rem | Subtítulo, nombre de producto en detalle |
| `body-lg` | 20px / 1.25rem | Texto introductorio, descripción destacada |
| `body` | 16px / 1rem | Texto general, valor de campo |
| `body-sm` | 14px / 0.875rem | Etiqueta de campo, texto auxiliar |
| `caption` | 12px / 0.75rem | Nota legal, metadato, marca temporal |

Los roles `display`, `h1`, `h2` y `h3` se componen en Poppins SemiBold 600. De `body-lg` hacia abajo se usa Poppins Regular 400, con la excepción de las etiquetas de campo, que usan Medium 500.

### 2.5 Reglas de composición

El interlineado es 1.2 para display y titulares, 1.5 para texto corrido, y 1.4 para etiquetas de interfaz. La longitud de línea de texto corrido no excede 70 caracteres. El texto nunca se justifica, siempre se alinea a la izquierda, porque la justificación genera ríos de espacio irregulares que contradicen el principio de claridad.

Los precios y medidas se componen siempre con cifras tabulares activadas mediante `font-variant-numeric: tabular-nums`, para que las columnas de la lista de precios alineen verticalmente.

---

## 3. Logotipo

### 3.1 Variantes del sistema

El sistema tiene cuatro variantes y cada una tiene un contexto de uso exclusivo.

**Vertical completa.** Rostro del gato sobre el wordmark con descriptor. Es la versión de presentación formal. Se usa en portadas, documentos, empaques y cualquier contexto donde la marca se presenta por primera vez.

**Horizontal.** Rostro a la izquierda, wordmark y descriptor a la derecha. Es la versión de navegación. Se usa en el encabezado del sitio, firmas de correo y cualquier franja de proporción ancha.

**Monocromática de contorno.** Versión en trazo sobre fondo claro, sin relleno de color. Se usa en aplicaciones de un solo color, grabado, sellos y cualquier soporte que no admita color.

**Isotipo.** Rostro del gato aislado, sin wordmark. Se usa en avatares, favicon, marcadores de mapa y cualquier espacio cuadrado menor a 64 píxeles donde el wordmark sería ilegible.

### 3.2 Área de protección

El área libre mínima alrededor del logotipo equivale a la altura de la oreja del gato, medida desde la punta hasta la base. Ningún elemento gráfico, texto ni borde puede invadir ese perímetro.

### 3.3 Tamaños mínimos

El logotipo horizontal no se reproduce por debajo de 120 píxeles de ancho en pantalla ni 30 milímetros en impresión. Por debajo de ese umbral el descriptor pierde legibilidad y debe usarse el isotipo. El isotipo no baja de 24 píxeles.

### 3.4 Usos prohibidos

No se deforma la proporción, no se rota, no se aplica contorno, sombra paralela ni degradado sobre el logotipo, no se recolorea fuera de las variantes definidas, no se coloca sobre fotografía de detalle sin superficie de contraste, no se reconstruye el wordmark con otra tipografía, no se separa el descriptor del wordmark para usarlo de forma independiente, y no se añade ningún elemento gráfico dentro del área de protección.

### 3.5 Estado del archivo vectorial

El SVG entregado es una hoja de marca, no un activo de producción. Contiene las cuatro variantes dispuestas sobre un mismo lienzo, una leyenda tipográfica en texto vivo, y una de las variantes recortada por el borde del lienzo. Sus 70 trazados están repartidos en 67 grupos sin nomenclatura semántica.

Para uso en la plataforma requiere el siguiente trabajo, que es de recorte y limpieza y no de rediseño.

Separar cada variante en su propio archivo: `taju-vertical.svg`, `taju-horizontal.svg`, `taju-contorno.svg`, `taju-isotipo.svg`. Ajustar el `viewBox` de cada uno al contenido real, eliminando el espacio vacío heredado del lienzo compartido. Eliminar la leyenda tipográfica y los dos elementos de texto vivo, que no pertenecen al logotipo. Eliminar las máscaras de recorte heredadas del original, que hoy cortan una de las variantes. Aplanar la matriz de transformación global, que actualmente invierte el eje vertical. Retirar los metadatos RDF y los atributos de Inkscape. Sustituir los rellenos literales por `currentColor` únicamente en la variante de contorno, para que pueda recolorearse desde CSS.

Este entregable bloquea el desarrollo del frontend y es prioridad inmediata.

---

## 4. Mascota

El gato es el activo diferencial de la marca. Su tratamiento en interfaz se rige por tres reglas.

**Inventario cerrado.** El proyecto trabaja únicamente con las representaciones ya producidas: rostro plano, pose de celebración con brazos elevados, y pose de señalamiento. No se producen ilustraciones nuevas.

**Asignación funcional.** El rostro se usa como avatar, favicon e indicador de carga. La pose de celebración se usa exclusivamente en confirmación de pedido enviado. La pose de señalamiento se usa en estados vacíos y en guías de especificación.

**Restricción de frecuencia.** La mascota aparece como máximo una vez por pantalla. Su valor depende de la escasez: repetida pierde el efecto de sorpresa y satura la interfaz. No aparece nunca en el panel de taller, donde el criterio es legibilidad operativa.

---

## 5. Fotografía e imagen

La marca se comunica con fotografía de producto real. No usa render, no usa banco de imágenes y no usa mockups genéricos. La prueba de capacidad técnica es el objeto terminado.

El producto se fotografía sobre superficie plana, con luz difusa y fondo de color liso tomado de la paleta o de madera clara. El encuadre privilegia el detalle del corte y del grabado, porque ahí está el valor que justifica el precio.

Se admite y se recomienda la fotografía de proceso: la máquina trabajando, la pieza recién cortada, el material en bruto junto al producto terminado. Refuerza el arquetipo de Artesano definido en el documento de identidad.

Se prohíbe la fotografía con filtro de color intenso, la sobreexposición que elimina el detalle del grabado, y la composición que muestra el producto sin contexto de escala cuando la escala es relevante para la decisión de compra.

---

## 6. Espaciado y geometría

El sistema de espaciado se construye sobre una base de 4 píxeles. Los valores admitidos son 4, 8, 12, 16, 24, 32, 48, 64 y 96. Ningún espaciado se define fuera de esta escala.

El radio de esquina del sistema es de 12 píxeles para tarjetas y contenedores, 8 píxeles para campos de formulario y botones, y completo para elementos con forma de píldora como etiquetas de estado y filtros. El radio generoso es coherente con las terminaciones redondeadas del logotipo y de la tipografía elegida.

Las sombras son suaves y de baja opacidad, construidas sobre el Negro TaJú con transparencia y nunca sobre negro puro. Su función es separar planos, no decorar.

---

## 7. Aplicación en interfaz

El Amarillo TaJú es el color de acción. Los botones primarios usan fondo amarillo con texto en Tinta. Es el color que dirige la atención hacia la conversión y por eso su uso debe ser escaso: una sola acción primaria visible por pantalla.

El Turquesa TaJú es el color de contexto. Se usa en fondos de sección, bloques informativos, franjas de ayuda y cualquier superficie cuyo propósito sea orientar sin exigir acción.

La Tinta es el color de todo el texto y de los bordes estructurales, aplicada en opacidad completa para texto principal y reducida para texto secundario.

Los colores de estado del sistema no pertenecen a la paleta de marca y se definen en el documento de tokens. Esto es deliberado: un mensaje de error en amarillo de marca sería ambiguo y un mensaje de éxito en turquesa competiría con el color de contexto. Los estados necesitan su propio vocabulario cromático, sin ambigüedad semántica.

---

## 8. Errores presentes en el material actual

Registro de inconsistencias detectadas en los activos existentes, con su corrección.

El banner de Facebook usa un sistema visual paralelo con tipografía de burbuja en cian y magenta, tratamiento ilustrativo del gato ajeno al logotipo, y fondo fuera de paleta. Se retira por completo y se reemplaza.

Las piezas de Instagram usan el cian saturado `#5CE1E6` en lugar del turquesa canónico. Las piezas futuras adoptan `#7CC9CF`. Las existentes no se reeditan por costo de oportunidad, pero no se replican.

La lista de precios contiene un error tipográfico en la nota final, donde "cantidad" aparece partido como "cantid ad". Debe corregirse antes de cualquier reutilización de la pieza.

La lista de precios usa un azul de línea divisoria fuera de paleta. Las líneas divisorias futuras usan Tinta con opacidad reducida.

Coexisten negro puro y Negro TaJú en distintas piezas. Se unifica en `#2B2B2A`.

---

## 9. Control de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-09-16 | Versión inicial. Extracción y fijación de paleta desde activos originales, resolución del conflicto de turquesa, definición del sistema tipográfico, normativa de logotipo y mascota, matriz de contraste verificada. |
| 1.1 | 2026-09-17 | Corrección de la paleta con los valores autoritativos del archivo vectorial. Retirada de la propuesta tipográfica de la v1.0 y adopción de Verona y Poppins, tipografías declaradas por la marca. Reglas de compensación para Poppins en interfaz. Auditoría técnica del SVG y especificación de limpieza. |
