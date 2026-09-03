import JSZip from 'jszip';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { PresentationDocument } from '../types';

export async function exportPresentationZip(document: PresentationDocument): Promise<Blob> {
  const zip = new JSZip();
  const slidePaths = document.slides.map((_, index) => `slides/${String(index + 1).padStart(2, '0')}.json`);
  const manifest = { ...document.manifest, version: 2 as const, slides: slidePaths };
  zip.file('presentation.json', `${JSON.stringify(manifest, null, 2)}\n`);
  document.slides.forEach((slide, index) => zip.file(slidePaths[index], `${JSON.stringify(slide, null, 2)}\n`));
  Object.entries(document.assetFiles ?? {}).forEach(([path, bytes]) => zip.file(path, bytes));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function mimeForPath(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/png';
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export async function exportOfflineWeb(document: PresentationDocument): Promise<Blob> {
  const zip = new JSZip();
  const assets: Record<string, string> = {};
  Object.entries(document.assetFiles ?? {}).forEach(([path, bytes]) => { assets[path] = `data:${mimeForPath(path)};base64,${bytesToBase64(bytes)}`; });
  const payload = JSON.stringify({ manifest: document.manifest, slides: document.slides, assets }).replace(/</g, '\\u003c');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${document.manifest.title.replace(/[<>&]/g,'')}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#090c14;color:#f7f8fc;font-family:Inter,system-ui,sans-serif;overflow:hidden}.stage{height:100vh;display:grid;place-items:center;padding:3vh}.slide{position:relative;width:min(94vw,177.77vh);aspect-ratio:16/9;overflow:hidden;border-radius:18px;background:var(--bg,#111522);box-shadow:0 30px 100px #0008}.free{position:absolute;inset:0}.el{position:absolute;overflow:hidden}.el img{width:100%;height:100%;object-fit:cover}.title{padding:8%;font-size:5vw}.blocks{padding:2% 8%;display:grid;gap:1rem}.nav{position:fixed;inset:auto 20px 20px auto;display:flex;gap:8px}.nav button{width:44px;height:44px;border-radius:50%;border:1px solid #ffffff22;background:#151a29;color:white}.counter{position:fixed;left:20px;bottom:28px;color:#9aa4bd;font-size:12px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.card{padding:1rem;border:1px solid #ffffff22;border-radius:16px;background:#ffffff0b}.shape{display:grid;place-items:center}.txt{white-space:pre-wrap}.code{white-space:pre-wrap;font-family:monospace;background:#070a10;padding:1rem;border-radius:12px}.mask-circle{border-radius:50%}.mask-rounded{border-radius:22px}.mask-star{clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 94%,50% 72%,21% 94%,32% 57%,2% 35%,39% 35%)}.mask-hexagon{clip-path:polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0 50%)}.md{line-height:1.55}.md h2,.md h3,.md h4{margin:.5em 0 .25em}.md blockquote{border-left:3px solid #7c5cff;padding:.4em .8em;background:#ffffff08}.md code{font-family:monospace;background:#ffffff12;padding:.1em .3em;border-radius:4px}
  </style></head><body><div id="app"></div><div class="counter" id="counter"></div><div class="nav"><button id="prev">←</button><button id="next">→</button></div><script>const P=${payload};let i=0;const app=document.getElementById('app'),counter=document.getElementById('counter');const esc=s=>String(s??'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));const md=s=>{let x=esc(s||''),tick=String.fromCharCode(96);x=x.replace(new RegExp(tick+'{3}([\\w+#.-]*)\\n([\\s\\S]*?)'+tick+'{3}','g'),(_,l,c)=>'<pre class=\"code\"><code>'+c+'</code></pre>');x=x.replace(/^#### (.+)$/gm,'<h5>$1</h5>').replace(/^### (.+)$/gm,'<h4>$1</h4>').replace(/^## (.+)$/gm,'<h3>$1</h3>').replace(/^# (.+)$/gm,'<h2>$1</h2>');x=x.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(new RegExp(tick+'([^'+tick+']+)'+tick,'g'),'<code>$1</code>').replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>').replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href=\"$2\" target=\"_blank\">$1</a>');return x.split(/\n{2,}/).map(v=>/^<(h|pre|blockquote)/.test(v)?v:'<p>'+v.replace(/\n/g,'<br>')+'</p>').join('')};function style(e){const s=e.style||{};return 'left:'+e.x+'%;top:'+e.y+'%;width:'+e.w+'%;height:'+e.h+'%;transform:rotate('+(e.rotation||0)+'deg);z-index:'+(e.zIndex||1)+';color:'+(s.color||'inherit')+';background:'+(s.background||'transparent')+';border-radius:'+(s.borderRadius||0)+'px;opacity:'+(s.opacity??1)+';font-size:'+((s.fontSize||26)/10)+'cqw;font-weight:'+(s.fontWeight||500)+';text-align:'+(s.textAlign||'left')+';';}function element(e){if(e.hidden||e.type==='connector')return '';if(e.type==='image')return '<div class="el mask-'+(e.mask||'none')+'" style="'+style(e)+'"><img src="'+(P.assets[e.src]||'')+'" style="object-fit:'+(e.fit||'cover')+';object-position:'+(e.objectPositionX||50)+'% '+(e.objectPositionY||50)+'%;transform:scale('+(e.cropZoom||1)+')"></div>';if(e.type==='shape')return '<div class="el shape" style="'+style(e)+'">'+esc(e.text||'')+'</div>';if(e.type==='code')return '<pre class="el code" style="'+style(e)+'">'+esc(e.code)+'</pre>';return '<div class="el txt" style="'+style(e)+'">'+esc(e.text||e.label||e.name||'')+'</div>';}function block(b){if(b.type==='text')return '<p>'+esc(b.text)+'</p>';if(b.type==='markdown')return '<div class="card md">'+md(b.markdown)+'</div>';if(b.type==='bullets')return '<ul>'+b.items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';if(b.type==='cards')return '<div class="cards">'+b.items.map(x=>'<div class="card"><b>'+esc(x.title)+'</b><p>'+esc(x.text)+'</p></div>').join('')+'</div>';if(b.type==='code')return '<pre class="code">'+esc(b.code)+'</pre>';if(b.type==='image')return '<img style="max-width:100%;max-height:55vh" src="'+(P.assets[b.src]||'')+'">';return '<div class="card">'+esc(b.title||b.text||b.type)+'</div>';}function render(){const s=P.slides[i];const bg=s.background||P.manifest.theme?.slideBackground||'#111522';app.innerHTML='<div class="stage"><section class="slide" style="--bg:'+bg+'">'+(s.layout==='free'?'<div class="free">'+(s.canvas||[]).map(element).join('')+'</div>':'<div class="title">'+(s.eyebrow?'<small>'+esc(s.eyebrow)+'</small>':'')+(s.title?'<h1>'+esc(s.title)+'</h1>':'')+(s.subtitle?'<p>'+esc(s.subtitle)+'</p>':'')+'</div><div class="blocks">'+(s.blocks||[]).map(block).join('')+'</div>')+'</section></div>';counter.textContent=(i+1)+' / '+P.slides.length;}function go(d){i=Math.max(0,Math.min(P.slides.length-1,i+d));render()}document.getElementById('prev').onclick=()=>go(-1);document.getElementById('next').onclick=()=>go(1);addEventListener('keydown',e=>{if(['ArrowRight','PageDown',' '].includes(e.key))go(1);if(['ArrowLeft','PageUp'].includes(e.key))go(-1)});render();</script></body></html>`;
  zip.file('index.html', html);
  zip.file('README.txt', 'GoSlides Offline Package v12\nAbrí index.html en un navegador moderno. No requiere servidor ni conexión a Internet.\n');
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

async function waitForExportReady(element: HTMLElement) {
  if ('fonts' in document) {
    try { await document.fonts.ready; } catch { /* fallback fonts are fine */ }
  }
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return;
    try { await image.decode(); } catch { /* html-to-image will still attempt the capture */ }
  }));
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function captureElementPng(element: HTMLElement, pixelRatio = 1.2) {
  await waitForExportReady(element);
  const background = getComputedStyle(element).backgroundColor;
  return toPng(element, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: background && background !== 'rgba(0, 0, 0, 0)' ? background : undefined,
    preferredFontFormat: 'woff2',
    style: {
      margin: '0',
      transform: 'none',
    },
  });
}

export async function exportElementAsPng(element: HTMLElement, filename: string) {
  const dataUrl = await captureElementPng(element, 1.2); // 1600×900 source -> 1920×1080 PNG
  const response = await fetch(dataUrl);
  downloadBlob(await response.blob(), filename);
}

export async function exportSlidesAsPdf(elements: HTMLElement[], filename: string) {
  if (!elements.length) throw new Error('No hay slides disponibles para exportar.');
  // 960×540 pt keeps an exact 16:9 page. Viewers can scale it to any physical paper size.
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [960, 540], compress: true });
  for (let index = 0; index < elements.length; index++) {
    const dataUrl = await captureElementPng(elements[index], 1.2);
    if (index > 0) pdf.addPage([960, 540], 'landscape');
    pdf.addImage(dataUrl, 'PNG', 0, 0, 960, 540, undefined, 'FAST');
    // Let the browser breathe during long decks.
    if (index % 3 === 2) await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  pdf.save(filename);
}
