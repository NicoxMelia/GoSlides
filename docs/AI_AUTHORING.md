# GoSlides AI Authoring Kit

Esta guía define cómo una IA debe transformar material fuente en una presentación
GoSlides rica, legible e interactiva. El objetivo no es resumir todo de manera
agresiva: es distribuir la profundidad en capas.

## Principio central

Cada idea puede ocupar hasta cuatro capas:

1. **Superficie**: lo imprescindible para comprender la slide sin interactuar.
2. **Progresión**: fragments que construyen la explicación durante la exposición.
3. **Exploración**: tabs, acordeones, hotspots, modales o drawers que el usuario abre.
4. **Referencia**: apéndice y notas del presentador.

Nunca resolver exceso de contenido achicando tipografía indefinidamente. Ante
overflow, aplicar en este orden:

1. mover evidencia o implementación a un componente progresivo;
2. dividir la slide conservando la narrativa;
3. crear un deep dive o apéndice;
4. resumir sólo cuando el usuario haya pedido síntesis.

## Brief de generación

Antes de diseñar, inferir o solicitar estas decisiones:

| Campo | Valores sugeridos | Efecto |
|---|---|---|
| Densidad | visual, equilibrada, detallada, documental | Cantidad visible por slide |
| Profundidad | resumen, clase, workshop, referencia | Cantidad de capas y ejemplos |
| Interacción | ninguna, ocasional, frecuente | Uso de componentes explorables |
| Duración | minutos | Ritmo y cantidad de slides |
| Audiencia | descripción libre | Vocabulario y conocimiento previo |
| Overflow | dividir, revelar, apéndice, conservar | Tratamiento del material excedente |

Si el usuario no lo especifica, usar densidad equilibrada, profundidad clase,
interacción ocasional y estrategia de overflow revelar.

Studio persiste estas decisiones en `presentation.json.authoring`. Los valores del
formato son `visual|balanced|detailed|documentary`,
`summary|class|workshop|reference`, `none|occasional|frequent` y
`split|reveal|appendix|preserve`. El panel **IA** permite editarlos, copiar un brief
natural y revisar la presión de contenido de cada slide.

El diagnóstico combina límites orientativos del perfil con mediciones reales del
DOM. Si encuentra contenido recortado, lo informa aunque la cantidad de caracteres
sea baja. En slides estructuradas con al menos dos bloques, Studio ofrece dos
transformaciones reversibles desde el historial: dividir la slide o mover la mitad
del material a un drawer.

## Selección de componentes

| Necesidad narrativa | Componente |
|---|---|
| Explicación lineal breve | text, bullets, timeline |
| Texto técnico con tablas o código | markdown |
| Comparar alternativas | compare, columns, quadrant |
| Mostrar datos | stats, chart |
| Alternativas mutuamente excluyentes | tabs |
| Proceso navegable | steps |
| Varias explicaciones que pueden coexistir | accordion |
| Material complementario extenso | drawer |
| Detalle puntual o definición | tooltip, modal |
| Explorar una imagen | hotspots |
| Explicar relaciones | architecture |
| Variar parámetros | simulation |

No usar tabs sólo para decorar. Cada pestaña debe representar una dimensión
realmente alternativa. No usar un modal para información necesaria para entender la
idea principal: esa información debe permanecer visible.

## Contenido progresivo

Tabs, steps, accordion, modal, drawer y hotspots aceptan texto simple compatible
con versiones anteriores o una lista de bloques enriquecidos. Cuando existen ambos,
blocks tiene prioridad.

Ejemplo:

~~~json
{
  "type": "accordion",
  "title": "Cómo funciona",
  "allowMultiple": true,
  "items": [
    {
      "title": "Concepto",
      "text": "Resumen accesible sin composición adicional."
    },
    {
      "title": "Implementación",
      "blocks": [
        {
          "type": "markdown",
          "appearance": "minimal",
          "markdown": "### Detalle\n\nExplicación completa con **énfasis**."
        },
        {
          "type": "code",
          "language": "typescript",
          "code": "const enabled = true;"
        }
      ]
    }
  ]
}
~~~

Drawer para una segunda capa:

~~~json
{
  "type": "drawer",
  "buttonLabel": "Ver evidencia",
  "title": "Datos y metodología",
  "side": "right",
  "width": "lg",
  "blocks": [
    {
      "type": "chart",
      "chart": "bar",
      "labels": ["A", "B", "C"],
      "values": [42, 71, 88],
      "showValues": true
    },
    {
      "type": "callout",
      "tone": "info",
      "title": "Fuente",
      "text": "Indicar origen, fecha y alcance de los datos."
    }
  ]
}
~~~

## Recetas de composición

### Resumen más evidencia

- Superficie: título, conclusión y chart.
- Drawer: metodología, fuente y tabla detallada.
- Notas: interpretación para el presentador.

### Concepto más implementación

- Superficie: definición y diagrama.
- Tabs: arquitectura, código y operación.
- Modal: advertencia o edge case opcional.

### Clase exploratoria

- Superficie: pregunta inicial.
- Accordion: hipótesis, explicación y ejemplo.
- Fragments: revelar la conclusión después de discutir.

### Caso práctico

- Superficie: contexto y restricciones.
- Steps: preparación, ejecución y validación.
- Hotspots: señalar detalles de una captura o diagrama.
- Drawer: solución completa y referencias.

## Restricciones de calidad

- Una slide debe conservar una idea principal identificable.
- Todo control interactivo necesita una etiqueta que describa qué abrirá.
- El contenido esencial no puede depender de hover.
- Imágenes y hotspots necesitan texto alternativo.
- Los bloques anidados no deben superar ocho niveles.
- Evitar más de seis controles interactivos visibles en una sola slide.
- PDF y PNG representan el estado inicial: la primera sección de un acordeón debe
  contener un resumen útil.
- Mantener compatibilidad: text puede seguir usándose sin blocks.

## Verificación antes de entregar

1. Ejecutar npm run audit.
2. Ejecutar npm run regression.
3. Construir Studio y Viewer.
4. Revisar que no haya overflow o texto ilegible.
5. Probar cada tab, accordion, modal, drawer y hotspot con mouse y teclado.
6. Confirmar que el estado inicial exportado siga comunicando la idea principal.
