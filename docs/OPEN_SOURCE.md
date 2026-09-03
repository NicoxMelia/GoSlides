# Recursos visuales y licencias — GoSlides v12

GoSlides v9 está diseñado para funcionar sin assets, fuentes ni librerías de pago.

## Bibliotecas de iconos incluidas

Studio expone únicamente familias con licencias permisivas y gratuitas:

| Biblioteca | Uso en GoSlides | Licencia upstream |
| --- | --- | --- |
| Lucide | Iconos lineales modernos | ISC |
| Phosphor | Variantes geométricas y expresivas | MIT |
| Tabler Icons | Iconos outline modernos | MIT |
| Heroicons | Iconos outline/solid de Tailwind Labs | MIT |

La integración se realiza mediante `react-icons`. El wrapper `react-icons` es software libre, pero cada pack conserva la licencia de su proyecto de origen; por eso GoSlides limita el selector a las familias anteriores.

## Modo Sketch / Excalidraw-style

El modo Sketch de GoSlides es una implementación propia basada en CSS y SVG declarativo. Incluye formas, vectores, flechas y dibujo libre con estética whiteboard. No copia assets de Excalidraw y no necesita un servicio externo.

Excalidraw se usa sólo como referencia de experiencia visual: el proyecto Excalidraw original también es software libre bajo licencia MIT.

## Tipografías

Studio ofrece una selección de familias gratuitas disponibles mediante Google Fonts y fallbacks locales del sistema. El repositorio no empaqueta ni redistribuye archivos `.ttf`, `.otf`, `.woff` o `.woff2`.

Familias configuradas actualmente:

- Inter
- Manrope
- DM Sans
- Poppins
- Montserrat
- Space Grotesk
- Roboto
- Lora
- Merriweather
- Playfair Display
- Roboto Slab
- JetBrains Mono
- Fira Code
- Caveat
- Patrick Hand
- Kalam
- Architects Daughter

Además se mantienen fallbacks como Georgia, Trebuchet MS y Courier New cuando existen en el sistema del usuario.

> Nota: un paquete web offline puede caer al fallback local si no hay conexión y la fuente web todavía no está en caché. GoSlides no incrusta archivos de fuentes en los ZIP exportados.

## Flechas y vectores

Las familias `modern`, `rounded`, `minimal`, `double`, `outline`, `duotone` y `sketch` son SVG generados por el propio renderer de GoSlides. No dependen de una biblioteca comercial.

## Costos

Ninguna de estas funciones necesita una suscripción, API de pago o licencia comercial. El proyecto sigue pudiendo compilarse y publicarse como sitio estático en GitHub Pages.

## GoSlides v10 — Código, Gitmoji y Virgil

### Código Carbon-inspired

Los nuevos marcos de código son una implementación CSS propia inspirada en la experiencia de Carbon. GoSlides no integra Carbon como servicio, no realiza capturas remotas y no necesita una cuenta o API.

### Gitmoji

El selector Emoji/Gitmoji usa caracteres Unicode y un catálogo local curado a partir de la guía open-source Gitmoji. El proyecto Gitmoji publica su código bajo licencia MIT. No es necesaria una API en runtime.

### Virgil 3 YOFF / Virgil

GoSlides ofrece la familia `Virgil 3 YOFF` con fallbacks `Virgil`, `Patrick Hand` y `cursive`. La fuente Virgil original de Excalidraw está publicada bajo SIL Open Font License 1.1. Por política del proyecto, GoSlides **no empaqueta el archivo de fuente**: Studio/Viewer la referencian desde un CDN público open-source y caen a los fallbacks si no hay red.

## GoSlides v11 — exportación PNG/PDF

- `html-to-image`: captura DOM a imagen; licencia MIT.
- `jsPDF`: generación de PDF en el navegador; licencia MIT.

Ambas se usan localmente en Studio y no requieren un servicio pago ni un backend externo.


## GoSlides v12 — estabilización

La v12 no agrega dependencias comerciales ni servicios pagos. Las correcciones de renderer, animaciones, selectores, rich text, arquitectura y UI se implementan con el stack open-source ya documentado.
