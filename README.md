# GoSlides v0.13 — Studio visual + Viewer público

GoSlides está dividido en dos aplicaciones independientes dentro del mismo proyecto:

- **Studio** (`studio.html`): editor individual del docente, pensado para ejecutarse localmente.
- **Viewer** (`index.html`): reproductor read-only; es lo único que GitHub Pages publica.

No hay colaboración en tiempo real ni backend obligatorio. El flujo sigue siendo local-first: editás, exportás un ZIP, lo versionás con Git y GitHub Pages publica una copia sanitizada para los alumnos.

## Ejecutar

```bash
npm install
npm run dev:studio
```

Studio abre en `http://localhost:5173/studio.html`.

Para probar el Viewer:

```bash
npm run dev:viewer
```

La demo incluida usa:

```text
/p/jwiL_O4kFLdlBsEXs6yMZQ
```



## Nuevo en v13 — matriz 2x2 y columnas

Dos bloques nuevos pensados para contenido técnico de clasificación y comparaciones lado a
lado, que antes requerían armar el layout a mano en un canvas libre:

- `quadrant`: matriz 2x2 con ejes rotulados y cuatro celdas de tono `success`/`danger`/`neutral` — ideal para matrices de confusión (verdadero/falso positivo/negativo) u otras clasificaciones cruzadas;
- `columns`: N columnas dentro de una slide estructurada, cada una con su propia pila de bloques — permite, por ejemplo, dos bloques `code` uno junto al otro (inseguro vs. seguro);
- `callout` suma el tono `danger` (con ícono propio) además de `info`/`success`/`warning`, y su texto/título ya aceptan rich text seguro.

Ver `docs/FORMAT.md` para el detalle de ambos bloques.

## Nuevo en v12 — estabilización integral

GoSlides v12 es una versión de **corrección y estabilidad**. No agrega una capa grande de features: revisa Studio, Viewer, demos y renderers para corregir inconsistencias visuales y regresiones acumuladas.

- el highlighter de código deja de re-procesar el HTML generado, por lo que nunca imprime atributos internos como `class="tok-*"`;
- las animaciones/fragments del canvas libre mantienen la geometría absoluta: la animación se aplica sobre un wrapper posicionado y la rotación/estilo sobre el elemento interno;
- los dropdowns nativos respetan `color-scheme` y colores explícitos en temas oscuro/claro;
- el botón **Vista previa** de Rich Text sólo alterna el preview y nunca modifica el string fuente;
- headings estructurados usan una safe-area superior para evitar títulos recortados;
- los conectores de arquitectura y canvas terminan en los bordes de los nodos, usan curvas suaves y conservan el color de la flecha;
- arquitectura/sketch recibe tarjetas, labels y conectores con mayor contraste y espaciado;
- toolbar y panel lateral aumentan tamaño, contraste y hit-area;
- la demo y el template sketch fueron reajustados para evitar cajas de texto demasiado pequeñas;
- se agrega `npm run audit` para revisar manifests, IDs, referencias, límites del canvas, masters, sections, triggers, connectors y charts.

La prioridad de esta versión es que una misma slide se vea coherentemente en Studio, Viewer, thumbnail y exportación.

## Nuevo en v11

GoSlides v11 agrega **bloques Markdown** y reemplaza las exportaciones PNG/PDF anteriores por una ruta de captura dedicada:

- `Bloques → Insertar bloque → Markdown`;
- Markdown seguro renderizado con React, sin ejecutar HTML arbitrario;
- headings, párrafos, listas, task lists, quotes, links, tablas, inline code y fenced code blocks;
- tres apariencias: `Modern`, `Paper` y `Minimal`;
- los fenced code blocks reutilizan el renderer Carbon de GoSlides;
- preview Markdown directamente dentro del editor;
- PNG generado desde el renderer real de la slide a **1920×1080**, sin handles, grids ni chrome del editor;
- PDF generado programáticamente con una página **16:9 por slide**, en lugar de depender de `window.print()`;
- antes de capturar se espera a fuentes e imágenes para reducir exportaciones incompletas;
- la exportación PDF usa la misma slide off-screen de 1600×900 que el Viewer, por lo que layouts estructurados, canvas, masters, Markdown y assets mantienen geometría consistente.
- se incluye `templates/goslides-markdown-template.zip` como starter editable.

La exportación utiliza `html-to-image` y `jsPDF`, ambas dependencias gratuitas/open-source.

## Nuevo en v10

GoSlides v10 mejora especialmente las presentaciones técnicas y el modo sketch:

- bloques de código **Carbon-inspired** con marcos Classic, Carbon Gradient, Carbon Glass, Carbon Light y Minimal;
- temas de código Seti, Night Owl, Dracula, Nord y GitHub Dark;
- números de línea, controles de ventana y botón de copiar;
- los objetos de código del canvas usan exactamente el mismo renderer que el Viewer;
- selector de **Emoji / Gitmoji** con búsqueda por intención, shortcode y descripción;
- emoji como objeto libre redimensionable, animable y combinable con cualquier slide;
- **Virgil 3 YOFF / Virgil** como tipografía seleccionable y fuente principal de los presets Sketch;
- compatibilidad completa con los ZIP anteriores: el diseño de código previo se interpreta como `Classic`.

La implementación visual es propia: Carbon se usa como referencia de experiencia, no como dependencia ni servicio. Gitmoji se integra como catálogo Unicode y no requiere API en runtime. La fuente Virgil se referencia remotamente bajo su licencia abierta; el ZIP no redistribuye archivos de fuentes.

## Nuevo en v9

GoSlides v9 se concentra en **confiabilidad visual y libertad de diseño**. Corrige dos problemas de edición detectados en v8 y agrega un sistema de estilos modernos/sketch usando únicamente recursos gratuitos y de código abierto.

### Correcciones importantes

- Los thumbnails ya no renderizan una slide comprimida dentro de un contenedor pequeño: se dibujan sobre un escenario fijo de 960×540 y después se escalan, evitando títulos recortados o fuera de la miniatura.
- Agregar texto, una forma, una flecha, un icono, una imagen o un dibujo **ya no cambia el layout de la slide a `free`**. Las slides estructuradas pueden mezclar `blocks` y objetos libres de `canvas` sin que desaparezca el contenido anterior.
- Las inserciones usan el estado más reciente del documento para evitar reemplazos accidentales cuando se agregan componentes consecutivamente.

### Diseño moderno y bibliotecas de iconos

Studio permite elegir globalmente y por icono entre estas bibliotecas gratuitas:

- Lucide
- Phosphor
- Tabler Icons
- Heroicons

Los iconos se normalizan a un catálogo semántico común para poder cambiar de biblioteca sin rehacer la slide. Flechas y vectores agregan familias `modern`, `rounded`, `minimal`, `double`, `outline`, `duotone` y `sketch` según el tipo de elemento.

### Modo Sketch / estilo Excalidraw

Una presentación completa puede usar `theme.visualStyle = "sketch"`. El Studio y el Viewer aplican entonces:

- tipografía manuscrita;
- papel/cuadrícula sutil;
- bordes irregulares;
- formas y flechas estilo whiteboard;
- dibujo libre con puntero/mouse;
- vectores e iconos combinables con el estilo sketch.

Hay presets **Sketch Paper** y **Sketch Dark**. También se puede usar `style.sketch` sólo en objetos puntuales sin convertir toda la presentación.

El repositorio incluye además `templates/goslides-sketch-template.zip`, una presentación completa de ejemplo lista para importar y modificar.

### Más tipografías

La lista incluye familias sans, serif, monospace y manuscritas como Inter, Manrope, DM Sans, Poppins, Montserrat, Space Grotesk, Roboto, Lora, Merriweather, Playfair Display, Roboto Slab, JetBrains Mono, Fira Code, Caveat, Patrick Hand, Kalam y Architects Daughter, además de fallbacks del sistema. No se redistribuyen archivos de fuentes dentro del ZIP del proyecto.

### Slides híbridas

Una slide puede conservar su layout estructurado y, al mismo tiempo, tener objetos libres superpuestos:

```json
{
  "layout": "default",
  "title": "Arquitectura",
  "blocks": [{ "type": "cards", "items": [] }],
  "canvas": [{ "type": "arrow", "arrowStyle": "modern" }]
}
```

Esto permite comenzar con un template y luego dibujar/anotar encima sin perder el contenido original.

## Nuevo en v8

GoSlides v8 se concentra en productividad y salida profesional, sin agregar colaboración ni backend.

### Smart Layout + Theme Tokens

- Smart H, Smart V y Smart Grid para reacomodar la selección.
- Gap y padding configurables desde Slide Inspector.
- Theme Tokens para spacing, card radius, shadow y border.
- Secciones de presentación para organizar capítulos.

### Component Styles

Un elemento puede vincularse a un estilo reutilizable (`styleRef`). Desde Studio podés guardar el estilo actual, aplicarlo a otros objetos y actualizar globalmente todas sus instancias.

### Morph + triggers

- Nueva transición `morph`.
- Los elementos que comparten `morphId` entre slides usan View Transitions API cuando está disponible.
- `triggerId` permite ocultar un objeto hasta que el alumno haga click sobre otro elemento del canvas.
- Fallback automático cuando Morph no está soportado.

### Timeline visual 2.0

La barra de cada elemento se puede arrastrar horizontalmente para cambiar el delay. El handle derecho permite redimensionar visualmente la duración. Se conservan fragments y presets Sequence/Stagger/Cinematic.

### Asset Manager + imágenes

- Pestaña Asset Manager con búsqueda y thumbnails.
- Click en un asset para insertarlo en el canvas.
- Máscaras circle, rounded, star y hexagon.
- Zoom de crop además de focal point y filtros existentes.

### Charts y tablas

- Editor tabular de labels/valores para charts.
- Labels de eje X/Y y leyenda opcional.
- Tablas con filas alternadas y modo compacto.

### Exportación

Además del ZIP editable:

- **PDF** mediante layout de impresión 16:9 de todas las slides.
- **PNG** de la slide actual.
- **Web offline**: ZIP autocontenido con `index.html`, datos y assets embebidos para abrir sin servidor ni Internet.

### Canvas

- Selection marquee: arrastrá un rectángulo sobre el fondo para seleccionar varios objetos.
- La Command Palette incluye los nuevos formatos de exportación.

## Nuevo en v7

### Timeline de animación

Studio agrega una pestaña **Timeline** para slides libres. Cada elemento aparece como una pista con su fragment, delay y duración. Desde ahí podés seleccionar elementos y ajustar tiempos sin entrar uno por uno al panel de propiedades.

Presets disponibles:

- **Secuencia**: un fragment por elemento con entrada `slide-up`.
- **Stagger**: mismo fragment con delays escalonados.
- **Cinematic**: fragments secuenciales + `motion-path` + easing spring.
- **Reset**: elimina la configuración de animación de la selección.

### Motion paths

Los elementos de canvas pueden usar `animation: "motion-path"` junto con `motionPathX` y `motionPathY`. Studio dibuja una guía punteada desde la posición de entrada hasta la posición final para que el recorrido pueda ajustarse visualmente.

### Presets visuales

El panel de propiedades agrega estilos rápidos para elementos:

- Accent
- Glass
- Outline
- Minimal

Sirven como punto de partida y después siguen siendo completamente editables.

### Rich text con preview

El editor de rich text mantiene el formato seguro declarativo, pero ahora muestra un preview inmediato dentro de Studio mientras editás. No se habilita HTML arbitrario.

### Vectores ampliados

A las formas vectoriales de v6 se agregan:

- pentagon
- octagon
- cross
- parallelogram
- trapezoid

### Charts nuevos

Además de los charts existentes, v7 suma:

- `gauge`
- `funnel`

## Capacidades heredadas

GoSlides v7 mantiene todas las capacidades de v6: Master Slides, temas reutilizables, canvas libre 16:9, drag & drop, resize, capas, historial, snippets de rich text, imágenes y SVG, iconos, tablas, conectores, Presenter Mode sincronizado, fragments, animaciones, transiciones, interactividad tipo Genially, import/export ZIP y publicación estática en GitHub Pages.

## Nuevo en v6

### Master Slides

- Creá un Master a partir de elementos seleccionados de una slide libre.
- Un Master puede definir fondo, footer y elementos de canvas compartidos.
- Aplicá o quitá un Master por slide.
- Los elementos promovidos al Master dejan de duplicarse en cada slide.
- Los ZIP anteriores siguen funcionando porque `masters` es opcional.

### Temas reutilizables

Incluye presets listos para usar:

- Midnight
- Paper
- Ocean
- Sunset
- Academic

También podés guardar el tema actual como preset personal. El tema puede controlar modo, accent, tipografía general, tipografía de títulos, fondo, superficie, colores de texto y radio global.

### Edición vectorial

Nuevo elemento `vector` con formas editables:

- star
- triangle
- hexagon
- chevron
- diamond

Podés modificar `fill`, `stroke`, grosor, posición, tamaño, rotación, opacidad, animación y orden de capa.

### Animaciones y transiciones ampliadas

Animaciones de entrada:

- fade
- slide-up
- slide-left
- slide-right
- zoom
- bounce
- blur
- rotate

Cada elemento o bloque puede definir duración, delay y easing. Las slides también suman transiciones `wipe` y `flip` además de las existentes.

### Rich text ampliado

Además del formato de v5, se suman:

- fondo inline: `{bg:#503a21|texto}`
- tamaño relativo: `{size:130|texto}`
- superíndice: `~^texto^~`
- subíndice: `~_texto_~`

El renderer continúa sin aceptar HTML arbitrario.

### Imágenes

Los elementos de imagen agregan:

- contrast
- saturate
- flip horizontal
- flip vertical

Se mantienen focal point, contain/cover, grayscale y brightness.

### Charts

Disponibles:

- bar
- line
- area
- donut
- pie
- radar
- progress

### UX / productividad

- `Ctrl/Cmd + K`: Command Palette.
- `Ctrl/Cmd + A`: seleccionar todos los elementos visibles del canvas.
- `Ctrl/Cmd + D`: duplicar selección.
- Se mantienen Undo/Redo, multiselección, grupos, capas, historial, snapping, alineación/distribución, copy/paste y movimiento con teclado.

## Capacidades heredadas

GoSlides v6 conservaba las capacidades de v5: canvas libre 16:9, drag & drop, resize, layouts estructurados, imágenes y assets persistentes, tablas, iconos, conectores inteligentes, código/terminal, charts, simulaciones, fragments, tabs, steps, hotspots, modales, tooltips, flip cards, Presenter Mode sincronizado, templates personales, comentarios privados, historial visual e import/export ZIP.

## Privacidad docente

El build público elimina físicamente de la copia destinada al Viewer:

1. `notes` de las slides;
2. comentarios privados de elementos;
3. capas con `hidden: true`;
4. conectores que apuntan a capas eliminadas;
5. comentarios y capas ocultas dentro de Master Slides.

El `publicId` difícil de adivinar evita URLs triviales, pero **no es autenticación**. Cualquier persona que tenga el enlace puede abrir la presentación.

## Flujo recomendado

1. Abrí Studio.
2. Creá o importá una presentación.
3. Elegí un tema o guardá uno propio.
4. Diseñá slides estructuradas o libres.
5. Si tenés elementos recurrentes, convertí la selección en un Master Slide.
6. Usá Capas, Historial y plantillas personales para organizar el trabajo.
7. Previsualizá como alumno o usá Presenter Mode.
8. Exportá el ZIP.
9. Copialo a `presentations/`.
10. Hacé `git add`, `git commit` y `git push`.
11. GitHub Actions publica sólo el Viewer y las copias sanitizadas.

## Atajos principales

| Atajo | Acción |
|---|---|
| `Ctrl/Cmd + K` | Abrir Command Palette |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + A` | Seleccionar todos los elementos visibles |
| `Ctrl/Cmd + D` | Duplicar selección |
| `Shift/Ctrl/Cmd + click` | Multiselección |
| `Ctrl/Cmd + G` | Agrupar |
| `Ctrl/Cmd + Shift + G` | Desagrupar |
| `Ctrl/Cmd + C / V` | Copiar / pegar |
| `Delete` | Eliminar selección |
| `← ↑ → ↓` | Mover 0.5% |
| `Shift + flecha` | Mover 2% |

## Publicar

```bash
cp ~/Downloads/mi-presentacion.zip presentations/
git add .
git commit -m "Add presentation"
git push
```

GitHub Pages ejecuta `npm run build:viewer`; Studio no forma parte del artefacto público.

## Build manual

```bash
npm run build:viewer
npm run build:studio
```

## Formato

Ver [`docs/FORMAT.md`](docs/FORMAT.md). La demo editable está en `examples/demo-presentation/`, el ZIP demo en `presentations/demo-goslides.zip` y la plantilla en `templates/goslides-template.zip`.

## Recursos gratuitos y licencias

Las bibliotecas visuales seleccionadas y el criterio de licencias están documentados en `docs/OPEN_SOURCE.md`. GoSlides v9 no requiere assets ni servicios de pago.
