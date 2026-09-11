import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { listPresentationVersions, readPresentationVersion, savePresentationSnapshot } from './vite-presentation-repository.mjs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

const renderer = read('src/components/SlideRenderer.tsx');
const player = read('src/components/PresentationPlayer.tsx');
const editorCanvas = read('src/studio/VisualCanvas.tsx');
const code = read('src/components/CodeBlock.tsx');
const rich = read('src/studio/RichTextInput.tsx');
const css = read('src/styles.css');
const analysis = read('src/lib/contentAnalysis.ts');
const studio = read('src/studio/StudioEditor.tsx');
const types = read('src/types.ts');

check(code.includes('tokenize the ORIGINAL line'), 'CodeBlock debe tokenizar el source antes de emitir spans.');
check(!code.includes("html = html.replace"), 'CodeBlock no debe volver a aplicar regex sobre HTML ya generado.');
check(code.includes('hashComments'), 'CodeBlock debe distinguir # comentario de preprocesador C/C++.');
check(rich.includes("onClick={()=>setPreview(v=>!v)}"), 'Preview Rich Text debe ser un toggle local.');
check(!/rich-preview-toggle[^>]*onClick=\{[^}]*onChange/.test(rich), 'Preview Rich Text no puede llamar onChange.');
check(renderer.includes('wrapperStyle={canvasWrapperStyle(element)}'), 'Canvas animado necesita wrapper absoluto estable.');
check(renderer.includes('<CanvasItem element={element} assets={assets} embedded/>'), 'El elemento animado debe ocupar el wrapper y no reposicionarse solo.');
check(renderer.includes('useId') && !renderer.includes('id="arch-arrow"'), 'Los markers SVG del Viewer deben tener IDs locales por instancia.');
const architecture = read('src/components/ArchitectureBlock.tsx');
check(architecture.includes('className="arch-edge-labels"') && !architecture.includes('<text className="arch-edge-label"'), 'Los rótulos de arquitectura deben renderizarse como HTML para no deformarse con el SVG.');
check(!architecture.includes("'Recibe de'") && !architecture.includes("'Continúa hacia'"), 'El detalle de nodos no debe agregar navegación automática entre conexiones.');
check(renderer.includes("block.type === 'accordion'") && renderer.includes("block.type === 'drawer'"), 'Viewer debe conservar los componentes de profundidad progresiva.');
check(renderer.includes('content?.blocks?.length') && renderer.includes('<ProgressiveBody'), 'El contenido interactivo debe priorizar bloques anidados sobre texto simple.');
check(editorCanvas.includes('useId'), 'Los markers SVG de Studio deben tener IDs locales por instancia.');
check(css.includes("[data-theme='dark'] { color-scheme: dark; }"), 'Dark mode debe declarar color-scheme para selects nativos.');
check(css.includes('.canvas-text,.vc-text { line-height:1.08; overflow:visible; }'), 'Text boxes no deben recortarse silenciosamente.');
check(player.includes('className="slide-scroll-area"'), 'El Viewer debe separar el scroll de la navegación fija.');
check(player.includes('key={slide.id} className="slide-scroll-area"'), 'El scroll adaptativo debe volver al inicio al cambiar de slide.');
check(css.includes('.slide-scroll-area > .slide-stage') && css.includes('min-height:min(56.25cqw') && css.includes('flex:1 0 auto') && css.includes('overflow:visible'), 'La hoja del Viewer debe usar 16:9 como mínimo, crecer con el contenido y no recortarlo.');
check(css.includes('.rich-bg { color:inherit; }'), 'Highlight Rich Text debe conservar el color de texto del contexto.');
check(css.includes('.canvas-toolbar button { min-width:54px;'), 'Toolbar debe mantener hit-area legible.');
check(css.includes('.accordion-block') && css.includes('.slide-drawer'), 'Accordion y drawer necesitan estilos de Viewer.');
check(types.includes('authoring?: AuthoringPreferences'), 'El manifest debe persistir el perfil de autoría para IA.');
check(renderer.includes('resolveAsset(block.src, assets)'), 'Los bloques de imagen deben resolver assets empaquetados.');
const loader = read('src/lib/presentationLoader.ts');
check(loader.includes("'image/svg+xml'") && loader.includes('mimeForAssetPath(entry.name)'), 'El loader debe asignar MIME a SVG para evitar mostrar el texto alternativo.');
check(analysis.includes('analyzeSlideContent') && analysis.includes('rendered.clippedRegions'), 'El diagnóstico debe combinar densidad semántica y overflow renderizado.');
check(studio.includes("rightTab==='ai'") && studio.includes('<AuthoringPanel'), 'Studio debe exponer el panel IA.');
check(studio.includes('scrollHeight>region.clientHeight+2') && studio.includes('scrollWidth>region.clientWidth+2'), 'Studio debe medir overflow vertical y horizontal real.');
check(studio.includes('splitSlideForReadability') && studio.includes('convertOverflowToDrawer'), 'El diagnóstico debe ofrecer acciones de redistribución reversibles.');
check(studio.includes('Guardar en repo') && studio.includes('restoreRepositoryVersion'), 'Studio debe exponer guardado y restauración del historial versionado.');

const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'goslides-regression-repository-'));
try {
  fs.mkdirSync(path.join(repositoryRoot, 'presentations'));
  const original = fs.readFileSync('presentations/demo-goslides.zip');
  fs.writeFileSync(path.join(repositoryRoot, 'presentations', 'demo-goslides.zip'), original);
  const firstSave = await savePresentationSnapshot(repositoryRoot, original);
  const editedZip = await JSZip.loadAsync(original);
  const editedManifest = JSON.parse(await editedZip.file('presentation.json').async('text'));
  editedManifest.title = 'Demo guardada más reciente';
  editedZip.file('presentation.json', `${JSON.stringify(editedManifest, null, 2)}\n`);
  const edited = await editedZip.generateAsync({ type: 'nodebuffer' });
  const secondSave = await savePresentationSnapshot(repositoryRoot, edited);
  const versionHistory = listPresentationVersions(repositoryRoot, firstSave.presentationId);
  const initialVersion = readPresentationVersion(repositoryRoot, firstSave.presentationId, 1);
  const publicIndex = JSON.parse(fs.readFileSync(path.join(repositoryRoot, '.generated-public', 'presentations', 'index.json'), 'utf8'));
  check(firstSave.number === 2, 'El primer guardado de un ZIP publicado debe preservar el original como versión 1.');
  check(secondSave.number === 3 && versionHistory.totalVersions === 3, 'Cada guardado debe agregar una versión inmutable al historial.');
  check(initialVersion.bytes.length === original.length, 'Una versión guardada debe poder recuperarse completa.');
  check(fs.existsSync(path.join(repositoryRoot, firstSave.currentFile)), 'Guardar debe actualizar el ZIP vigente en presentations/.');
  check(publicIndex[0]?.title === editedManifest.title, 'Guardar debe regenerar la biblioteca que consume el panel Publicadas / Viewer.');
} catch (error) {
  check(false, `El repositorio versionado debe completar su ciclo de guardado y lectura: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  fs.rmSync(repositoryRoot, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`Regression checks: ${failures.length} fallo(s)`);
  failures.forEach((item) => console.error(`  - ${item}`));
  process.exit(1);
}
console.log('Regression checks: OK');
