# GoSlides Format v2 — usado por GoSlides v15

GoSlides v15 conserva `presentation.json.version = 2`. Las funciones nuevas son extensiones opcionales, por lo que las presentaciones creadas con versiones anteriores continúan siendo válidas.

```text
presentacion.zip
├── presentation.json
├── slides/
│   ├── 01.json
│   └── 02.json
└── assets/
    └── imagen.png
```

## Manifest

```json
{
  "format": "goslides",
  "version": 2,
  "id": "keda-clase",
  "publicId": "A6PMkEq7rXws9Qn2VtK5Lf",
  "title": "KEDA Autoscaling",
  "authoring": {
    "density": "balanced",
    "depth": "class",
    "interaction": "occasional",
    "overflowStrategy": "reveal",
    "durationMinutes": 20,
    "preserveSourceMaterial": true
  },
  "theme": {
    "mode": "dark",
    "accent": "#7c5cff",
    "fontFamily": "Inter, sans-serif",
    "headingFontFamily": "Inter, sans-serif",
    "slideBackground": "#0b1020",
    "surfaceColor": "#171d30",
    "textColor": "#f7f8fc",
    "mutedColor": "#aeb6cb",
    "radius": 22
  },
  "masters": [],
  "slides": ["slides/01.json"]
}
```

`publicId` es el identificador utilizado en `/p/<publicId>`. No representa autenticación.

### Perfil de autoría para IA

`authoring` es opcional y no cambia el render del Viewer. Studio lo utiliza para
diagnosticar densidad y la IA puede leerlo como contrato de generación:

- `density`: `visual`, `balanced`, `detailed` o `documentary`;
- `depth`: `summary`, `class`, `workshop` o `reference`;
- `interaction`: `none`, `occasional` o `frequent`;
- `overflowStrategy`: `split`, `reveal`, `appendix` o `preserve`;
- `durationMinutes`: entero positivo con la duración objetivo;
- `preserveSourceMaterial`: indica si el contenido secundario debe conservarse en
  capas progresivas o puede sintetizarse.

Studio persiste el perfil dentro del ZIP. Las presentaciones sin `authoring`
mantienen los defaults `balanced`, `class`, `occasional`, `reveal`, 20 minutos y
conservación del material fuente.

## Theme

Todos los campos salvo `mode` y `accent` son opcionales:

```json
{
  "mode": "dark",
  "accent": "#8b6cff",
  "fontFamily": "Inter, sans-serif",
  "headingFontFamily": "Inter, sans-serif",
  "slideBackground": "#0b1020",
  "surfaceColor": "#171d30",
  "textColor": "#f7f8fc",
  "mutedColor": "#aeb6cb",
  "radius": 22
}
```

Studio v9 incluye presets integrados y permite guardar presets personales localmente.

## Master Slides

El manifest puede incluir `masters`:

```json
{
  "masters": [
    {
      "id": "master-tech",
      "name": "Tech Header",
      "background": "linear-gradient(135deg,#0a1020,#17152f)",
      "footer": "Arquitectura · 2026",
      "canvas": [
        {
          "id": "accent",
          "type": "shape",
          "shape": "rounded",
          "x": 5,
          "y": 5,
          "w": 2,
          "h": 8,
          "locked": true,
          "style": { "background": "#8b6cff" }
        }
      ]
    }
  ]
}
```

Una slide aplica el master con:

```json
{ "id": "arquitectura", "masterId": "master-tech" }
```

`background`, `footer` y `canvas` del master se renderizan detrás del contenido de la slide.

## Slides estructuradas

Mantienen `eyebrow`, `title`, `subtitle`, `footer`, `notes` y `blocks`. Los layouts siguen siendo `default`, `title`, `center`, `split` y `free`.

Cada bloque puede usar fragments y animaciones:

```json
{
  "fragment": 1,
  "animation": "slide-left",
  "animationDuration": 0.7,
  "animationDelay": 0.1,
  "animationEasing": "ease-out"
}
```

Animaciones disponibles:

- `none`
- `fade`
- `slide-up`
- `slide-left`
- `slide-right`
- `zoom`
- `bounce`
- `blur`
- `rotate`

Easing: `ease`, `ease-in`, `ease-out`, `ease-in-out`, `spring`.

Los bloques incluyen texto, bullets, cards, stats, compare, code, terminal, image, timeline, tabs, steps, architecture, quote, callout, tooltip, modal, accordion, drawer, flipcard, beforeAfter, hotspots, chart y simulation.

El bloque `architecture` abre el detalle de cada nodo al hacer clic (también con Enter o Espacio). `detailView` permite elegir `drawer` (panel lateral, predeterminado), `modal` (centrado) o `inline` (debajo del diagrama). Cada nodo admite `blocks: SlideBlock[]` con uno o varios bloques de cualquier tipo (texto, Markdown, imágenes, código, gráficos, tabs, columnas, otros diagramas, etc.). Se muestran en orden al abrir el nodo, con desplazamiento si el contenido es largo. `text` con RichText se usa únicamente cuando `blocks` está vacío o ausente. Los bloques del panel se revelan completos al abrirlo; sus componentes interactivos mantienen sus propios controles. El detalle muestra conexiones entrantes y salientes navegables; se cierra con ×, Escape o clic en el fondo para modal/panel lateral. Sin `blocks` ni `text`, se muestran el subtítulo y las conexiones disponibles. En Studio, «Bloques del panel» permite agregar, elegir el tipo, editar, ordenar y eliminar bloques por nodo. Estas opciones y el contenido anidado se conservan en el ZIP.

```json
{
  "type": "architecture",
  "detailView": "drawer",
  "nodes": [
    { "id": "analysis", "label": "Análisis", "x": 25, "y": 50, "blocks": [{ "type": "text", "text": "Revisá los hallazgos antes de continuar." }, { "type": "bullets", "items": ["Revisar el contexto", "Registrar la decisión"] }] },
    { "id": "review", "label": "Revisión", "x": 75, "y": 50, "text": "Documentá la decisión y los próximos pasos." }
  ],
  "edges": [{ "from": "analysis", "to": "review", "label": "Hallazgos" }]
}
```

## Contenido progresivo y bloques anidados

Tabs, steps, modal, accordion, drawer, cada punto de hotspots y cada nodo de architecture aceptan dos
representaciones compatibles:

- text para contenido simple y presentaciones existentes;
- blocks para anidar cualquier lista de SlideBlock.

Si ambos están presentes, el Viewer prioriza blocks. Esto permite reservar la
superficie de la slide para el mensaje principal y ofrecer código, Markdown,
gráficos o evidencia al interactuar.

~~~json
{
  "type": "tabs",
  "tabs": [
    {
      "label": "Resumen",
      "text": "Descripción breve."
    },
    {
      "label": "Código",
      "title": "Implementación",
      "blocks": [
        {
          "type": "code",
          "language": "typescript",
          "code": "const ready = true;"
        }
      ]
    }
  ]
}
~~~

Accordion permite abrir una o varias secciones:

~~~json
{
  "type": "accordion",
  "title": "Explorar por tema",
  "allowMultiple": true,
  "items": [
    { "title": "Concepto", "text": "Resumen" },
    { "title": "Detalle", "blocks": [{ "type": "markdown", "markdown": "## Desarrollo" }] }
  ]
}
~~~

Drawer abre un panel lateral dentro de la slide:

~~~json
{
  "type": "drawer",
  "buttonLabel": "Ver evidencia",
  "title": "Material complementario",
  "side": "right",
  "width": "lg",
  "blocks": [{ "type": "markdown", "markdown": "Contenido ampliado" }]
}
~~~

side admite left o right. width admite sm, md o lg. La profundidad máxima
recomendada para bloques anidados es ocho.

## Charts

```json
{
  "type": "chart",
  "chart": "radar",
  "title": "Madurez",
  "labels": ["Diseño", "Datos", "Presentación"],
  "values": [92, 86, 94],
  "suffix": "%",
  "showValues": true
}
```

`chart` puede ser:

- `bar`
- `line`
- `area`
- `donut`
- `pie`
- `radar`
- `progress`

## Slide libre

```json
{
  "id": "arquitectura",
  "layout": "free",
  "transition": "wipe",
  "masterId": "master-tech",
  "canvas": [
    {
      "id": "title",
      "layerName": "Título",
      "type": "text",
      "x": 8,
      "y": 8,
      "w": 60,
      "h": 14,
      "text": "Arquitectura",
      "style": {
        "color": "#ffffff",
        "fontSize": 54,
        "fontWeight": 800,
        "textAlign": "left"
      }
    }
  ]
}
```

`x`, `y`, `w` y `h` son porcentajes sobre el canvas 16:9.

Tipos libres: `text`, `shape`, `image`, `arrow`, `code`, `icon`, `table`, `connector` y `vector`.

También pueden usar `rotation`, `zIndex`, `fragment`, animación, `groupId`, `locked`, `hidden`, `layerName`, `comments` y `style`.

## Vector editable

```json
{
  "id": "star",
  "type": "vector",
  "shape": "star",
  "x": 10,
  "y": 30,
  "w": 18,
  "h": 30,
  "fill": "#8b6cff",
  "stroke": "#d9d0ff",
  "strokeWidth": 2
}
```

`shape`: `star`, `triangle`, `hexagon`, `chevron` o `diamond`.

## Rich text seguro

- `**texto**` → negrita
- `*texto*` → cursiva
- `__texto__` → subrayado
- `~~texto~~` → tachado
- `==texto==` → accent
- `^^texto^^` → highlight
- `` `texto` `` → código inline
- `{#ff5c8a|texto}` → color
- `{bg:#503a21|texto}` → fondo
- `{size:130|texto}` → tamaño relativo en porcentaje
- `~^texto^~` → superíndice
- `~_texto_~` → subíndice
- `[texto](https://example.com)` → enlace

No se ejecuta HTML arbitrario.

## Imágenes y SVG

```json
{
  "type": "image",
  "src": "assets/arquitectura.svg",
  "fit": "cover",
  "objectPositionX": 65,
  "objectPositionY": 40,
  "grayscale": 0,
  "brightness": 110,
  "contrast": 105,
  "saturate": 120,
  "flipX": false,
  "flipY": false
}
```

Los valores numéricos de filtros son porcentajes CSS.

## Capas y comentarios privados

Un elemento puede definir:

```json
{
  "layerName": "Título principal",
  "hidden": false,
  "locked": false,
  "zIndex": 8,
  "comments": [
    {
      "id": "comment-abc",
      "text": "Revisar antes de la clase",
      "createdAt": "2026-08-28T16:00:00.000Z",
      "resolved": false
    }
  ]
}
```

Los comentarios y las capas ocultas son datos de autoría y no se publican.

## Conector inteligente

```json
{
  "id": "edge-front-api",
  "type": "connector",
  "from": "frontend",
  "to": "api",
  "label": "HTTPS",
  "thickness": 3,
  "dashed": false,
  "x": 0,
  "y": 0,
  "w": 100,
  "h": 100
}
```

El renderer recalcula la geometría a partir de los IDs conectados.

## Transiciones

Una slide puede definir:

- `none`
- `fade`
- `slide`
- `zoom`
- `wipe`
- `flip`

## Sanitización pública

`scripts/build-public-library.mjs` crea una copia destinada al Viewer y:

1. elimina `notes` de cada slide;
2. elimina `comments` de elementos;
3. elimina elementos con `hidden: true`;
4. elimina conectores hacia elementos ocultos;
5. repite la sanitización sobre el `canvas` de cada Master Slide.

El Viewer desplegado en GitHub Pages consume sólo las copias sanitizadas.

## Extensiones v7

### Timeline y motion path

La Timeline de Studio edita los mismos metadatos de animación del elemento; no agrega un archivo separado al ZIP. Para un recorrido animado:

```json
{
  "id": "service",
  "type": "shape",
  "shape": "rounded",
  "x": 40, "y": 35, "w": 20, "h": 18,
  "animation": "motion-path",
  "fragment": 2,
  "animationDuration": 0.65,
  "animationDelay": 0,
  "animationEasing": "spring",
  "motionPathX": -12,
  "motionPathY": 8
}
```

`motionPathX` y `motionPathY` representan desplazamientos relativos al canvas en puntos porcentuales. El elemento termina siempre en su `x/y` normal.

### Vectores v7

`vector.shape` admite además `pentagon`, `octagon`, `cross`, `parallelogram` y `trapezoid`.

### Charts v7

`chart` admite además `gauge` y `funnel`. Ambos reutilizan `labels`, `values`, `suffix` y `showValues`, por lo que siguen siendo compatibles con el mismo bloque declarativo.



## Extensiones v9

### Visual style e icon library

El theme acepta dos campos nuevos opcionales:

```json
{
  "visualStyle": "sketch",
  "iconLibrary": "phosphor"
}
```

`visualStyle` admite `modern` o `sketch`. `iconLibrary` admite `lucide`, `phosphor`, `tabler` o `heroicons`.

### Slides híbridas

`canvas` puede coexistir con `blocks` en cualquier layout. Sólo `layout: "free"` elimina deliberadamente la capa estructurada. Studio no cambia el layout al insertar un objeto libre.

### Flechas y vectores

Las flechas pueden declarar:

```json
{ "type": "arrow", "arrowStyle": "rounded" }
```

Valores: `classic`, `modern`, `rounded`, `minimal`, `double`, `sketch`, `dotted`, `wedge`, `blunt`.

Los vectores pueden declarar `vectorStyle`: `solid`, `outline`, `duotone` o `sketch`.

### Iconos multi-biblioteca

```json
{
  "type": "icon",
  "name": "database",
  "library": "tabler"
}
```

El nombre es semántico; el renderer resuelve la variante equivalente dentro de la biblioteca elegida.

### Dibujo libre

```json
{
  "type": "freehand",
  "x": 10, "y": 10, "w": 30, "h": 20,
  "points": [{"x":0,"y":20},{"x":30,"y":5},{"x":100,"y":80}],
  "stroke": "#6d5bd0",
  "strokeWidth": 3
}
```

Los puntos están normalizados dentro del bounding box del elemento. Esto permite mover, escalar, agrupar, bloquear y animar un trazo como cualquier otro objeto de canvas.

### Sketch por elemento

`style.sketch = true` aplica tratamiento whiteboard a un elemento puntual aunque la presentación use el estilo `modern`.

## Extensiones v8

### Theme Tokens

```json
{"theme":{"tokens":{"spacing":16,"cardRadius":18,"shadowStrength":28,"borderColor":"#343a50"}}}
```

### Component Styles

El manifest puede incluir estilos reutilizables:

```json
{"componentStyles":[{"id":"style-glass","name":"Glass Card","style":{"background":"rgba(255,255,255,.08)","borderRadius":22}}]}
```

Un elemento se vincula con `"styleRef":"style-glass"`. Studio puede actualizar todas las instancias vinculadas.

### Secciones y Smart Layout

```json
{"sections":[{"id":"intro","name":"Introducción"}]}
```

Una slide puede usar `sectionId` y configuración declarativa de Smart Layout:

```json
{"sectionId":"intro","smartLayout":{"mode":"grid","gap":2,"padding":5}}
```

### Morph

Una slide puede usar `"transition":"morph"`. Los elementos equivalentes usan el mismo `morphId`:

```json
{"id":"node-a","type":"shape","morphId":"backend","x":10,"y":20,"w":25,"h":20}
```

La siguiente slide puede mover/redimensionar ese elemento manteniendo `morphId: "backend"`.

### Trigger por click

`triggerId` hace que un objeto espere el click sobre otro objeto del mismo canvas:

```json
{"id":"detail","type":"text","triggerId":"button-info","text":"Detalle revelado al hacer click"}
```

### Imágenes v8

Campos nuevos: `cropZoom` y `mask`. `mask` admite `none`, `circle`, `rounded`, `star`, `hexagon`.

### Tablas v8

`striped` activa filas alternadas y `compact` reduce el padding de celdas.

### Charts v8

Los charts pueden definir `showLegend`, `xLabel` y `yLabel`. Studio incluye un editor visual fila por fila para labels y valores.

### Exportaciones de Studio

Las salidas PDF, PNG y web offline son funciones de Studio; el formato ZIP v2 no cambia y continúa siendo el archivo editable/canónico.

## v10 — código visual y emojis

Un bloque de código puede configurar su marco y tema:

```json
{
  "type": "code",
  "language": "typescript",
  "title": "example.ts",
  "frameStyle": "carbon-glass",
  "codeTheme": "night-owl",
  "showLineNumbers": true,
  "showWindowControls": true,
  "code": "const ok = true;"
}
```

`frameStyle`: `classic`, `carbon`, `carbon-glass`, `carbon-light`, `minimal`, `neon`, `terminal`, `paper`, `notebook`.

`codeTheme`: `seti`, `night-owl`, `dracula`, `nord`, `github-dark`, `monokai`, `one-dark`, `tokyo-night`, `catppuccin`, `gruvbox`, `solarized-dark`, `synthwave`, `github-light`, `solarized-light`, `ayu-light`.

Los emojis se guardan como objetos normales de canvas:

```json
{
  "id": "emoji-feature",
  "type": "emoji",
  "emoji": "✨",
  "shortcode": ":sparkles:",
  "description": "Nueva funcionalidad",
  "x": 80,
  "y": 10,
  "w": 10,
  "h": 15
}
```

## v11 — bloque Markdown y exportación fiel

Una slide estructurada puede insertar un bloque Markdown junto a cualquier otro bloque:

```json
{
  "type": "markdown",
  "appearance": "modern",
  "markdown": "## Título\n\nTexto con **negrita** y `código`.\n\n- Item 1\n- Item 2"
}
```

`appearance` admite `modern`, `paper`, `minimal`, `card`, `notebook`, `contrast` y `terminal`.

El renderer Markdown no ejecuta HTML arbitrario. Soporta headings, párrafos, listas ordenadas/no ordenadas, task lists, blockquotes, enlaces HTTP/HTTPS/mailto, tablas tipo pipe, código inline y fenced code blocks. Los fenced code blocks se renderizan con el componente de código visual de GoSlides.

### PNG/PDF en v11

PNG y PDF ya no capturan el canvas editable ni dependen del diálogo de impresión. Studio mantiene un renderer de exportación off-screen de 1600×900 por slide:

- PNG: captura del renderer a 1920×1080.
- PDF: una página 16:9 por slide, generada con jsPDF.
- Se espera a `document.fonts.ready` y a las imágenes antes de capturar.
- Masters, layouts estructurados, canvas libre, overlays híbridos, Markdown y assets usan el mismo `SlideRenderer` del Viewer.


## v13 — matriz 2x2 y columnas

Dos bloques nuevos, agregados para presentaciones técnicas con contenido de clasificación
(verdadero/falso positivo/negativo) y comparaciones lado a lado que antes sólo podían
armarse a mano en un canvas libre.

### Bloque `quadrant`

Matriz 2x2 con dos ejes rotulados y cuatro celdas con tono semántico. Pensado para matrices
de confusión, decisiones binarias cruzadas o cualquier clasificación en dos dimensiones.

```json
{
  "type": "quadrant",
  "title": "Positivos, negativos y errores de clasificación",
  "rowAxis": "HERRAMIENTA",
  "colAxis": "RIESGO REAL",
  "colLabels": ["Existe", "No existe"],
  "rowLabels": ["Reporta", "No reporta"],
  "cells": [
    { "title": "Verdadero positivo", "text": "La alerta corresponde a un defecto real.", "tone": "success" },
    { "title": "Falso positivo", "text": "La alerta no representa un defecto real.", "tone": "danger" },
    { "title": "Falso negativo", "text": "El defecto existe pero no fue señalado.", "tone": "danger" },
    { "title": "Verdadero negativo", "text": "No hay defecto y no se reportó nada.", "tone": "success" }
  ]
}
```

`cells` sigue siempre el orden `[arriba-izquierda, arriba-derecha, abajo-izquierda, abajo-derecha]`.
`tone` admite `success`, `danger` o `neutral`.

### Bloque `columns`

Layout de N columnas dentro de una slide estructurada (`default`, `title`, `center`, `split`),
cada una con su propia pila independiente de bloques. Resuelve comparaciones lado a lado —
por ejemplo dos bloques `code` (inseguro vs. seguro) — sin recurrir a posicionamiento libre
manual en `canvas`.

```json
{
  "type": "columns",
  "ratio": [1, 1],
  "gap": 1.4,
  "items": [
    { "title": "Inseguro", "blocks": [{ "type": "code", "language": "python", "code": "os.system('ping ' + host)" }] },
    { "title": "Seguro", "blocks": [{ "type": "code", "language": "python", "code": "subprocess.run(['ping', host])" }] }
  ]
}
```

`ratio` es opcional (por defecto todas las columnas pesan igual) y debe tener la misma
longitud que `items` para tomar efecto. Cada columna admite cualquier tipo de bloque,
incluyendo otro `columns` anidado.

### Tono `danger` en `callout`

`callout.tone` admite ahora `danger` además de `info`, `success` y `warning`, para alertas de
riesgo real (p.ej. secretos embebidos, `eval` sobre entrada externa) diferenciadas de simples
advertencias operativas. Los cuatro tonos muestran además un ícono propio (`Info`,
`CheckCircle2`, `AlertTriangle`, `ShieldAlert`) y `callout.text`/`callout.title` aceptan el
mismo rich text seguro que el resto de los bloques.

## v12 — estabilización

La v12 conserva el formato de presentación v2 y no requiere una migración de ZIP. Los cambios son de renderer/editor:

- canvas animado con wrapper absoluto estable;
- conectores calculados hasta el borde del nodo;
- IDs SVG locales por instancia para evitar colisiones entre Viewer, thumbnails y superficie de exportación;
- rich-text preview sin mutar el valor fuente;
- bloques de código con tokenización previa al HTML;
- safe-area y overflow de texto ajustados;
- auditoría estructural mediante `npm run audit`.
