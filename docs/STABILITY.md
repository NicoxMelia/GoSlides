# GoSlides v12 — checklist de estabilidad

Esta versión se valida contra los flujos que más regresiones habían acumulado.

## Render

- Slide estructurada: título/subtítulo dentro de safe-area.
- Slide híbrida: blocks + canvas sin reemplazar contenido previo.
- Slide libre: geometría absoluta estable con y sin animación.
- Master Slide: mismo resultado en Studio y Viewer.
- Thumbnail: render 960×540 escalado, sin tipografía desbordada.

## Componentes

- Código: syntax highlighting sin markup visible; estilos Carbon/Classic.
- Rich Text: Preview es read-only respecto del valor fuente.
- Arquitectura: conectores terminan en borde de nodos y labels no quedan atravesados.
- Smart connectors: color/arrowhead coherentes y curvas suaves.
- Markdown: no ejecuta HTML arbitrario.

## Interacción

- Fragments 0..N se revelan sin desplazar elementos.
- Animaciones v6+ conservan x/y/w/h y rotación.
- Triggers no apuntan a elementos privados después de sanitizar.
- Dropdowns legibles en light/dark.

## Publicación

- Notas y comentarios privados fuera del paquete público.
- Capas ocultas fuera del paquete público.
- Conectores/triggers inválidos limpiados.
- Studio no forma parte del Viewer desplegado.

## Auditoría automática

Ejecutar:

```bash
npm run audit
```

El script revisa manifests, slides, IDs duplicados, bounds, fragments, animaciones, conectores, triggers, arquitectura, masters, secciones y charts.
