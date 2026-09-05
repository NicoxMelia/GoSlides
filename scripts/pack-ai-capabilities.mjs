import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import JSZip from 'jszip';

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const studioFile = path.join(root, 'src', 'studio', 'StudioEditor.tsx');

function extractLiteralConst(file, variableName) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initializer;
  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === variableName) initializer = declaration.initializer;
    }
  });
  if (!initializer) throw new Error(`No se encontró ${variableName} en ${path.relative(root, file)}.`);
  return vm.runInNewContext(`(${initializer.getText(source)})`, Object.create(null), { timeout: 1000 });
}

function extractStandaloneFunction(file, functionName) {
  const sourceText = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let declaration;
  source.forEachChild((node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === functionName) declaration = node;
  });
  if (!declaration) throw new Error(`No se encontró ${functionName} en ${path.relative(root, file)}.`);
  const sourceWithExport = `${declaration.getText(source)}\nglobalThis.__extracted = ${functionName};`;
  const javascript = ts.transpileModule(sourceWithExport, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;
  const context = vm.createContext({ exports: {}, module: { exports: {} } });
  vm.runInContext(javascript, context, { timeout: 1000 });
  return context.__extracted;
}

const blockTypes = extractLiteralConst(studioFile, 'blockTypes');
const blockLabels = extractLiteralConst(studioFile, 'blockLabels');
const slideTemplates = extractLiteralConst(studioFile, 'slideTemplates');
const fontFamilies = extractLiteralConst(studioFile, 'fontFamilies');
const themes = extractLiteralConst(studioFile, 'builtinThemes');
const elementStylePresets = extractLiteralConst(studioFile, 'elementStylePresets');
const defaultBlock = extractStandaloneFunction(path.join(root, 'src', 'studio', 'templates.ts'), 'defaultBlock');

const demoManifest = JSON.parse(fs.readFileSync(path.join(root, 'examples', 'demo-presentation', 'presentation.json'), 'utf8'));
const componentExamples = Object.fromEntries(blockTypes.map((type) => [type, []]));
function collectBlockExamples(block, relativeSlidePath) {
  if (componentExamples[block?.type] && !componentExamples[block.type].includes(relativeSlidePath)) componentExamples[block.type].push(relativeSlidePath);
  for (const nested of block?.blocks ?? []) collectBlockExamples(nested, relativeSlidePath);
  for (const key of ['tabs', 'items', 'points', 'nodes']) {
    for (const content of block?.[key] ?? []) for (const nested of content.blocks ?? []) collectBlockExamples(nested, relativeSlidePath);
  }
}
for (const slidePath of demoManifest.slides) {
  const slide = JSON.parse(fs.readFileSync(path.join(root, 'examples', 'demo-presentation', slidePath), 'utf8'));
  const relativeSlidePath = `examples/complete-demo/${slidePath}`;
  for (const block of slide.blocks ?? []) collectBlockExamples(block, relativeSlidePath);
  for (const element of slide.canvas ?? []) if (element.type === 'block') collectBlockExamples(element.block, relativeSlidePath);
}

const componentGuidance = {
  text: ['Explicación breve o idea principal', 'Contenido visual que necesita pocas palabras', false],
  markdown: ['Contenido técnico o documental con jerarquía, listas, tablas y código', 'Texto corto que no necesita formato', false],
  bullets: ['Lista de criterios, hallazgos u objetivos', 'Narrativa que depende de relaciones entre elementos', false],
  cards: ['Conjunto de conceptos equivalentes', 'Más de cuatro elementos extensos', false],
  stats: ['KPIs y números memorables', 'Datos que necesitan mostrar evolución', false],
  compare: ['Dos alternativas o estados contrapuestos', 'Tres o más alternativas', false],
  code: ['Implementación, API o ejemplo técnico', 'Código largo que pertenece a referencia', false],
  terminal: ['Comando y resultado observable', 'Secuencias de muchos comandos', false],
  image: ['Fotografía, captura o diagrama existente', 'Imagen decorativa sin aporte narrativo', false],
  timeline: ['Secuencia temporal corta', 'Proceso ramificado o navegable', false],
  quote: ['Testimonio o principio memorable', 'Párrafo explicativo sin autor o fuente', false],
  callout: ['Advertencia, hallazgo o conclusión destacada', 'Contenido principal completo', false],
  quadrant: ['Clasificación 2x2 con dos ejes', 'Datos continuos o más de cuatro categorías', false],
  columns: ['Composición paralela de bloques heterogéneos', 'Lectura estrictamente secuencial', false],
  tabs: ['Alternativas mutuamente excluyentes', 'Información esencial que debe verse junta', true],
  steps: ['Proceso que el usuario recorre por etapas', 'Cronología pasiva y breve', true],
  accordion: ['Varias explicaciones explorables', 'Mensaje esencial que debe estar expandido siempre', true],
  modal: ['Detalle puntual, definición o evidencia opcional', 'Información necesaria para comprender la slide', true],
  drawer: ['Deep dive, metodología o referencia extensa', 'Acción que necesita comparación simultánea', true],
  architecture: ['Servicios, nodos y relaciones dirigidas con detalle al hacer clic (drawer, modal o inline)', 'Lista simple sin relaciones', true],
  tooltip: ['Definición corta o aclaración contextual', 'Contenido accesible sólo mediante hover', true],
  flipcard: ['Pregunta-respuesta o antes de revelar una conclusión', 'Texto largo o navegación primaria', true],
  beforeAfter: ['Transformación entre dos estados', 'Comparación con más de dos dimensiones', true],
  hotspots: ['Exploración guiada de una imagen', 'Imagen sin texto alternativo o puntos claros', true],
  chart: ['Comparación, evolución, proporción o progreso cuantitativo', 'Valores sin escala o fuente', false],
  simulation: ['Explorar cómo un parámetro modifica un resultado', 'Cálculos que el componente no modela', true],
};

const blockRequiredFields = {
  text: ['text'], markdown: ['markdown'], bullets: ['items'], cards: ['items'], stats: ['items'], compare: ['left', 'right'],
  code: ['code'], terminal: ['command'], image: ['src'], timeline: ['items'], tabs: ['tabs'], steps: ['items'],
  architecture: ['nodes', 'edges'], quote: ['text'], callout: ['text'], quadrant: ['rowLabels', 'colLabels', 'cells'],
  columns: ['items'], tooltip: ['label', 'text'], modal: ['buttonLabel', 'title'], accordion: ['items'],
  drawer: ['buttonLabel', 'title'], flipcard: ['frontTitle', 'backTitle', 'backText'], beforeAfter: ['beforeText', 'afterText'],
  hotspots: ['src', 'points'], chart: ['chart', 'labels', 'values'], simulation: [],
};

const components = blockTypes.map((type) => {
  const [recommendedFor, avoidWhen, interactive] = componentGuidance[type] ?? ['', '', false];
  return {
    type,
    label: blockLabels[type] ?? type,
    category: interactive ? 'interactive' : ['chart', 'stats', 'simulation'].includes(type) ? 'data' : ['image', 'architecture'].includes(type) ? 'visual' : 'content',
    interactive,
    supportsNestedBlocks: ['architecture', 'tabs', 'steps', 'accordion', 'modal', 'drawer', 'hotspots', 'columns'].includes(type),
    recommendedFor,
    avoidWhen,
    requiredFields: blockRequiredFields[type] ?? [],
    schema: 'schema/slide.schema.json#/$defs/block',
    examples: [`examples/components/${type}.json`, ...componentExamples[type]],
  };
});

const enums = {
  layouts: ['default', 'title', 'center', 'split', 'free'],
  transitions: ['none', 'fade', 'slide', 'zoom', 'wipe', 'flip', 'morph'],
  animations: ['none', 'fade', 'slide-up', 'slide-left', 'slide-right', 'zoom', 'bounce', 'blur', 'rotate', 'motion-path'],
  animationEasing: ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'spring'],
  smartLayouts: ['none', 'row', 'column', 'grid'],
  chartKinds: ['bar', 'line', 'area', 'donut', 'pie', 'radar', 'progress', 'gauge', 'funnel'],
  markdownAppearances: ['modern', 'paper', 'minimal', 'card', 'notebook', 'contrast', 'terminal'],
  codeFrameStyles: ['classic', 'carbon', 'carbon-glass', 'carbon-light', 'minimal', 'neon', 'terminal', 'paper', 'notebook'],
  codeThemes: ['seti', 'night-owl', 'dracula', 'nord', 'github-dark', 'monokai', 'one-dark', 'tokyo-night', 'catppuccin', 'gruvbox', 'solarized-dark', 'synthwave', 'github-light', 'solarized-light', 'ayu-light'],
  iconLibraries: ['lucide', 'phosphor', 'tabler', 'heroicons'],
  visualStyles: ['modern', 'sketch'],
  authoring: {
    density: ['visual', 'balanced', 'detailed', 'documentary'],
    depth: ['summary', 'class', 'workshop', 'reference'],
    interaction: ['none', 'occasional', 'frequent'],
    overflowStrategy: ['split', 'reveal', 'appendix', 'preserve'],
  },
};

const animationProperties = {
  fragment: { type: 'integer', minimum: 0 },
  animation: { enum: enums.animations },
  animationDuration: { type: 'number', exclusiveMinimum: 0 },
  animationDelay: { type: 'number', minimum: 0 },
  animationEasing: { enum: enums.animationEasing },
  motionPathX: { type: 'number' },
  motionPathY: { type: 'number' },
};

const progressiveContent = {
  type: 'object',
  properties: { text: { type: 'string' }, blocks: { type: 'array', items: { $ref: '#/$defs/block' } } },
  anyOf: [{ required: ['text'] }, { required: ['blocks'] }],
  additionalProperties: true,
};

const blockSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://goslides.local/schema/slide.schema.json',
  title: 'GoSlides slide v2',
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 }, sectionId: { type: 'string' }, masterId: { type: 'string' },
    layout: { enum: enums.layouts }, eyebrow: { type: 'string' }, title: { type: 'string' }, subtitle: { type: 'string' },
    footer: { type: 'string' }, notes: { type: 'array', items: { type: 'string' } }, transition: { enum: enums.transitions },
    background: { type: 'string' },
    smartLayout: { type: 'object', required: ['mode'], properties: { mode: { enum: enums.smartLayouts }, gap: { type: 'number' }, padding: { type: 'number' } }, additionalProperties: false },
    blocks: { type: 'array', items: { $ref: '#/$defs/block' } },
    canvas: { type: 'array', items: { $ref: '#/$defs/canvasElement' } },
  },
  additionalProperties: false,
  $defs: {
    progressiveContent,
    block: {
      type: 'object', required: ['type'],
      properties: {
        type: { enum: blockTypes }, ...animationProperties,
        text: { type: 'string' }, lead: { type: 'boolean' }, markdown: { type: 'string' }, appearance: { enum: enums.markdownAppearances },
        title: { type: 'string' }, label: { type: 'string' }, buttonLabel: { type: 'string' }, items: { type: 'array' }, tabs: { type: 'array' },
        columns: { enum: [2, 3, 4] }, ratio: { type: 'array', items: { type: 'number', exclusiveMinimum: 0 } }, gap: { type: 'number' },
        left: { type: 'object' }, right: { type: 'object' }, language: { type: 'string' }, code: { type: 'string' }, command: { type: 'string' }, output: { type: 'string' },
        frameStyle: { enum: enums.codeFrameStyles }, codeTheme: { enum: enums.codeThemes }, showLineNumbers: { type: 'boolean' }, showWindowControls: { type: 'boolean' },
        src: { type: 'string' }, alt: { type: 'string' }, caption: { type: 'string' }, fit: { enum: ['contain', 'cover'] },
        nodes: { type: 'array', items: { type: 'object', required: ['id', 'label', 'x', 'y'], properties: { id: { type: 'string' }, label: { type: 'string' }, caption: { type: 'string' }, text: { type: 'string' }, blocks: { type: 'array', items: { $ref: '#/$defs/block' } }, x: { type: 'number' }, y: { type: 'number' }, kind: { enum: ['client', 'service', 'data', 'cloud'] } }, additionalProperties: false } }, edges: { type: 'array' }, detailView: { enum: ['drawer', 'modal', 'inline'] }, author: { type: 'string' }, tone: { enum: ['info', 'success', 'warning', 'danger'] },
        rowAxis: { type: 'string' }, colAxis: { type: 'string' }, rowLabels: { type: 'array', minItems: 2, maxItems: 2 }, colLabels: { type: 'array', minItems: 2, maxItems: 2 }, cells: { type: 'array', minItems: 4, maxItems: 4 },
        allowMultiple: { type: 'boolean' }, blocks: { type: 'array', items: { $ref: '#/$defs/block' } }, side: { enum: ['left', 'right'] }, width: { enum: ['sm', 'md', 'lg'] },
        frontTitle: { type: 'string' }, frontText: { type: 'string' }, backTitle: { type: 'string' }, backText: { type: 'string' },
        beforeLabel: { type: 'string' }, afterLabel: { type: 'string' }, beforeText: { type: 'string' }, afterText: { type: 'string' }, points: { type: 'array' },
        chart: { enum: enums.chartKinds }, labels: { type: 'array', items: { type: 'string' } }, values: { type: 'array', items: { type: 'number' } }, suffix: { type: 'string' }, showValues: { type: 'boolean' }, showLegend: { type: 'boolean' }, xLabel: { type: 'string' }, yLabel: { type: 'string' },
        min: { type: 'number' }, max: { type: 'number' }, initial: { type: 'number' }, unit: { type: 'string' }, metricLabel: { type: 'string' }, podsBase: { type: 'number' }, podsStep: { type: 'number' },
      },
      allOf: blockTypes.map((type) => ({ if: { properties: { type: { const: type } }, required: ['type'] }, then: { required: blockRequiredFields[type] ?? [] } })),
      additionalProperties: false,
    },
    canvasElement: {
      type: 'object', required: ['id', 'type', 'x', 'y', 'w', 'h'],
      properties: {
        id: { type: 'string' }, type: { enum: ['text', 'shape', 'vector', 'image', 'arrow', 'code', 'emoji', 'icon', 'freehand', 'table', 'connector', 'block'] },
        layerName: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number', exclusiveMinimum: 0 }, h: { type: 'number', exclusiveMinimum: 0 },
        rotation: { type: 'number' }, zIndex: { type: 'number' }, groupId: { type: 'string' }, locked: { type: 'boolean' }, hidden: { type: 'boolean' }, morphId: { type: 'string' }, styleRef: { type: 'string' }, triggerId: { type: 'string' },
        style: { type: 'object' }, comments: { type: 'array' }, text: { type: 'string' }, shape: { type: 'string' }, fill: { type: 'string' }, stroke: { type: 'string' }, strokeWidth: { type: 'number' }, vectorStyle: { enum: ['solid', 'outline', 'duotone', 'sketch'] },
        src: { type: 'string' }, alt: { type: 'string' }, fit: { enum: ['contain', 'cover', 'stretch', 'auto'] }, originalSrc: { type: 'string' }, mask: { enum: ['none', 'circle', 'rounded', 'star', 'hexagon'] },
        objectPositionX: { type: 'number' }, objectPositionY: { type: 'number' }, cropZoom: { type: 'number', exclusiveMinimum: 0 }, grayscale: { type: 'number' }, brightness: { type: 'number' }, contrast: { type: 'number' }, saturate: { type: 'number' }, flipX: { type: 'boolean' }, flipY: { type: 'boolean' },
        direction: { enum: ['right', 'left', 'down', 'up'] }, thickness: { type: 'number' }, arrowStyle: { enum: ['classic', 'modern', 'rounded', 'minimal', 'double', 'sketch', 'dotted', 'wedge', 'blunt'] },
        language: { type: 'string' }, code: { type: 'string' }, title: { type: 'string' }, frameStyle: { enum: enums.codeFrameStyles }, codeTheme: { enum: enums.codeThemes }, showLineNumbers: { type: 'boolean' }, showWindowControls: { type: 'boolean' },
        emoji: { type: 'string' }, shortcode: { type: 'string' }, description: { type: 'string' }, name: { type: 'string' }, label: { type: 'string' }, library: { enum: enums.iconLibraries }, points: { type: 'array' }, rows: { type: 'array' }, headerRow: { type: 'boolean' }, striped: { type: 'boolean' }, compact: { type: 'boolean' }, from: { type: 'string' }, to: { type: 'string' }, dashed: { type: 'boolean' }, block: { $ref: '#/$defs/block' },
        ...animationProperties,
      },
      additionalProperties: false,
    },
  },
};

const manifestSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://goslides.local/schema/presentation.schema.json',
  title: 'GoSlides presentation manifest v2', type: 'object', required: ['format', 'version', 'id', 'title', 'slides'],
  properties: {
    format: { const: 'goslides' }, version: { const: 2 }, id: { type: 'string', minLength: 1 }, publicId: { type: 'string' }, title: { type: 'string', minLength: 1 }, subtitle: { type: 'string' }, description: { type: 'string' }, author: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, cover: { type: 'string' },
    slides: { type: 'array', minItems: 1, items: { type: 'string', pattern: '^slides/.+\\.json$' } },
    theme: { type: 'object', properties: { mode: { enum: ['light', 'dark'] }, accent: { type: 'string' }, fontFamily: { type: 'string' }, headingFontFamily: { type: 'string' }, slideBackground: { type: 'string' }, surfaceColor: { type: 'string' }, textColor: { type: 'string' }, mutedColor: { type: 'string' }, radius: { type: 'number', minimum: 0 }, visualStyle: { enum: enums.visualStyles }, iconLibrary: { enum: enums.iconLibraries }, tokens: { type: 'object' } }, additionalProperties: false },
    authoring: { type: 'object', properties: { density: { enum: enums.authoring.density }, depth: { enum: enums.authoring.depth }, interaction: { enum: enums.authoring.interaction }, overflowStrategy: { enum: enums.authoring.overflowStrategy }, durationMinutes: { type: 'integer', minimum: 1 }, preserveSourceMaterial: { type: 'boolean' } }, additionalProperties: false },
    masters: { type: 'array' }, componentStyles: { type: 'array' }, sections: { type: 'array' },
  }, additionalProperties: false,
};

const readme = `# GoSlides AI Capability Pack v${packageJson.version}\n\nEste ZIP es el contrato de autoría para una IA. Describe qué puede renderizar GoSlides, cómo elegir cada componente y cómo producir un ZIP importable. No es una presentación ni contiene material del usuario.\n\n## Orden de lectura recomendado\n\n1. \`manifest.json\` — versión e inventario del paquete.\n2. \`authoring-guide.md\` — estrategia narrativa y de densidad.\n3. \`catalog/components.json\` — cuándo usar cada bloque.\n4. \`catalog/themes.json\` y \`catalog/design-system.json\` — sistema visual disponible.\n5. \`schema/*.json\` — contrato estructural de salida.\n6. \`examples/complete-demo/\` — ejemplos reales y combinaciones.\n7. \`brief-template.md\` — información que debe aportar el usuario.\n\n## Contrato de salida\n\nLa IA debe entregar un ZIP GoSlides v2 con \`presentation.json\`, archivos \`slides/*.json\` y assets referenciados bajo \`assets/\`. Antes de entregar, debe ejecutar \`npm run audit\`, \`npm run regression\` y revisar visualmente el Viewer.\n`;

const briefTemplate = `# Brief de presentación\n\n## Objetivo\n\n## Audiencia\n\n## Mensaje principal\n\n## Duración y cantidad aproximada de slides\n\n## Contenido obligatorio\n\n## Fuentes de verdad y prioridad\n\n## Densidad\nvisual | balanced | detailed | documentary\n\n## Profundidad\nsummary | class | workshop | reference\n\n## Interacción\nnone | occasional | frequent\n\n## Estrategia de overflow\nsplit | reveal | appendix | preserve\n\n## Estilo o tema preferido\nDejar vacío para que la IA elija desde catalog/themes.json.\n\n## Restricciones\n`;

const canvasCatalog = [
  ['text', 'Texto libre'], ['shape', 'Rectángulo, rounded o círculo'], ['vector', 'Formas vectoriales'], ['image', 'Imagen con crop, filtros y máscaras'],
  ['arrow', 'Flecha con nueve estilos'], ['code', 'Código posicionable'], ['emoji', 'Emoji/Gitmoji'], ['icon', 'Icono semántico intercambiable'],
  ['freehand', 'Dibujo libre'], ['table', 'Tabla libre'], ['connector', 'Conector entre objetos'], ['block', 'Cualquier SlideBlock dentro del canvas'],
].map(([type, description]) => ({ type, description, coordinateSystem: 'percent', supportsAnimation: true, supportsGrouping: type !== 'connector', supportsTrigger: type !== 'connector' }));

const zip = new JSZip();
const json = (name, value) => zip.file(name, `${JSON.stringify(value, null, 2)}\n`);
const copy = (source, destination) => zip.file(destination, fs.readFileSync(path.join(root, source)));
function copyDirectory(source, destination) {
  const absolute = path.join(root, source);
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const childSource = path.join(source, entry.name);
    const childDestination = path.posix.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(childSource, childDestination);
    else copy(childSource, childDestination);
  }
}

const packManifest = {
  format: 'goslides-ai-capabilities', version: 1, goslidesVersion: packageJson.version, presentationFormatVersion: 2,
  purpose: 'Describe all authoring, visual and interactive capabilities available to an AI presentation generator.',
  outputContract: { format: 'goslides', version: 2, manifest: 'presentation.json', slides: 'slides/*.json', assets: 'assets/*' },
  catalogs: ['catalog/components.json', 'catalog/canvas-elements.json', 'catalog/themes.json', 'catalog/design-system.json', 'catalog/layouts-and-motion.json'],
  schemas: ['schema/presentation.schema.json', 'schema/slide.schema.json'],
  examples: ['examples/complete-demo', 'examples/basic-template', 'examples/sketch-template'],
};

zip.file('README.md', readme);
zip.file('brief-template.md', briefTemplate);
json('manifest.json', packManifest);
json('catalog/components.json', { version: 1, count: components.length, components });
json('catalog/canvas-elements.json', { version: 1, coordinateSystem: 'percent', elements: canvasCatalog });
json('catalog/themes.json', { version: 1, note: 'Presets exactos disponibles en Studio.', groups: [...new Set(themes.map((item) => item.group))], themes });
json('catalog/design-system.json', { version: 1, fontPolicy: 'Las familias son referencias CSS con fallbacks. El paquete no redistribuye fuentes.', fontFamilies, iconLibraries: enums.iconLibraries, markdownAppearances: enums.markdownAppearances, codeFrameStyles: enums.codeFrameStyles, codeThemes: enums.codeThemes, elementStylePresets });
json('catalog/layouts-and-motion.json', { version: 1, ...enums, slideTemplates });
json('schema/presentation.schema.json', manifestSchema);
json('schema/slide.schema.json', blockSchema);
for (const type of blockTypes) json(`examples/components/${type}.json`, defaultBlock(type));
copy('docs/AI_AUTHORING.md', 'authoring-guide.md');
copy('docs/FORMAT.md', 'format-reference.md');
copy('src/types.ts', 'reference/types.ts');
copyDirectory('examples/demo-presentation', 'examples/complete-demo');
copyDirectory('examples/template-presentation', 'examples/basic-template');
copyDirectory('examples/sketch-presentation', 'examples/sketch-template');

const outDir = path.join(root, 'templates');
fs.mkdirSync(outDir, { recursive: true });
const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
const stableOut = path.join(outDir, 'goslides-ai-capabilities.zip');
const versionedOut = path.join(outDir, `goslides-ai-capabilities-v${packageJson.version}.zip`);
fs.writeFileSync(stableOut, bytes);
fs.writeFileSync(versionedOut, bytes);
if (components.some((item) => !item.recommendedFor || !item.avoidWhen || !zip.file(item.examples[0]))) throw new Error('El catálogo de componentes quedó incompleto.');
console.log(`Created ${path.relative(root, stableOut)} and ${path.relative(root, versionedOut)} (${components.length} blocks, ${themes.length} themes, ${fontFamilies.length} fonts)`);
