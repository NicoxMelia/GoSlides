import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

const renderer = read('src/components/SlideRenderer.tsx');
const editorCanvas = read('src/studio/VisualCanvas.tsx');
const code = read('src/components/CodeBlock.tsx');
const rich = read('src/studio/RichTextInput.tsx');
const css = read('src/styles.css');

check(code.includes('tokenize the ORIGINAL line'), 'CodeBlock debe tokenizar el source antes de emitir spans.');
check(!code.includes("html = html.replace"), 'CodeBlock no debe volver a aplicar regex sobre HTML ya generado.');
check(code.includes('hashComments'), 'CodeBlock debe distinguir # comentario de preprocesador C/C++.');
check(rich.includes("onClick={()=>setPreview(v=>!v)}"), 'Preview Rich Text debe ser un toggle local.');
check(!/rich-preview-toggle[^>]*onClick=\{[^}]*onChange/.test(rich), 'Preview Rich Text no puede llamar onChange.');
check(renderer.includes('wrapperStyle={canvasWrapperStyle(element)}'), 'Canvas animado necesita wrapper absoluto estable.');
check(renderer.includes('<CanvasItem element={element} assets={assets} embedded/>'), 'El elemento animado debe ocupar el wrapper y no reposicionarse solo.');
check(renderer.includes('useId') && !renderer.includes('id="arch-arrow"'), 'Los markers SVG del Viewer deben tener IDs locales por instancia.');
check(editorCanvas.includes('useId'), 'Los markers SVG de Studio deben tener IDs locales por instancia.');
check(css.includes("[data-theme='dark'] { color-scheme: dark; }"), 'Dark mode debe declarar color-scheme para selects nativos.');
check(css.includes('.canvas-text,.vc-text { line-height:1.08; overflow:visible; }'), 'Text boxes no deben recortarse silenciosamente.');
check(css.includes('.rich-bg { color:inherit; }'), 'Highlight Rich Text debe conservar el color de texto del contexto.');
check(css.includes('.canvas-toolbar button { min-width:54px;'), 'Toolbar debe mantener hit-area legible.');

if (failures.length) {
  console.error(`Regression checks: ${failures.length} fallo(s)`);
  failures.forEach((item) => console.error(`  - ${item}`));
  process.exit(1);
}
console.log('Regression checks: OK');
