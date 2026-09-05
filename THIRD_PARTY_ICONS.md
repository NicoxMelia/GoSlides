# Iconos de tecnología

El catálogo `src/components/TechIcons.ts` contiene 131 iconos SVG, organizados en
Lenguajes, Cloud, DevOps, Observabilidad, Datos, Frameworks, Seguridad y Herramientas.
Se incluyen en el bundle; no se descargan iconos desde servicios externos al presentar.

Los iconos se consumen mediante la dependencia existente `react-icons`:

- Simple Icons: https://simpleicons.org/ — CC0-1.0.
- Devicons: https://github.com/vorillaz/devicons — MIT (Java, CSS3, Heroku).
- Font Awesome: https://fontawesome.com/ — CC-BY-4.0 (AWS).
- VS Code Codicons: https://github.com/microsoft/vscode-codicons — CC-BY-4.0
  (Azure, Azure DevOps, Visual Studio Code).
- Tabler Icons: https://github.com/tabler/tabler-icons — MIT (C#, nube genérica).

Se conservan las geometrías de estos iconos. Los colores son valores de presentación
editables; algunos tonos se aclaran para facilitar su lectura sobre fondos oscuros.
Los nombres y logotipos pertenecen a sus respectivos titulares y no implican afiliación.

## Horusec

Fuente: https://github.com/ZupIT/horusec-platform/blob/main/manager/src/assets/logos/horusec_minimized.svg

Copyright ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA.
Licencia Apache-2.0 incluida en `licenses/horusec-Apache-2.0.txt`.
`src/components/HorusecIcon.tsx` conserva las geometrías y el viewBox del SVG original;
se adapta a React y se sustituyen sus degradados por `currentColor` para permitir
la edición de color sin IDs SVG compartidos.

## Uso y persistencia

En Studio, pulsar **Tecnología** y elegir un pack o buscar por nombre/alias
(por ejemplo `k8s`, `golang`, `gcp`, `cpp`). Los iconos también están disponibles
como biblioteca **Tecnología** dentro de las propiedades de cualquier icono.

El elemento guarda `type: 'icon'`, `library: 'tech'`, `name` (ID estable del catálogo),
`brandColors` (opcional; por defecto true), `label` y la geometría habitual `x/y/w/h`.
Desactivar **Usar color de marca** permite usar el color personalizado del elemento.
La selección, el tamaño y el color se guardan en el proyecto y en el ZIP GoSlides.
