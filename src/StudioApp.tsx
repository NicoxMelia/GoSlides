import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Edit3, Eye, FileText, Import, LayoutTemplate, Link2, Plus, Presentation, Search, Settings2, Sparkles, Trash2 } from 'lucide-react';
import type { LibraryEntry, LoadedPresentation, PresentationDocument } from './types';
import { Brand } from './components/Brand';
import { PresentationPlayer } from './components/PresentationPlayer';
import { loadPresentationFromFile, loadPresentationFromUrl, loadedToDocument } from './lib/presentationLoader';
import { createPublicId } from './lib/ids';
import { deleteProject, getViewerBaseUrl, loadProjectAssets, loadProjects, setViewerBaseUrl } from './lib/studioStorage';
import { StudioEditor } from './studio/StudioEditor';
import { createBlankDocument } from './studio/templates';
import { createPresentationFromTemplate, presentationTemplates, type PresentationTemplateCategory, type PresentationTemplateDefinition } from './studio/presentationTemplates';
import { SlideThumbnail } from './components/SlideThumbnail';
import './styles.css';

const base = import.meta.env.BASE_URL;

type Screen = 'home' | 'create' | 'templates' | 'drafts' | 'published' | 'editor' | 'preview';

const templateCategories: Array<'Todas' | PresentationTemplateCategory> = ['Todas', 'Educación', 'Negocios', 'Informes', 'Creatividad', 'Tecnología'];

function templateThemeStyle(template: PresentationTemplateDefinition): CSSProperties {
  const theme = template.theme;
  return {
    '--accent': theme.accent,
    '--slide-bg': theme.slideBackground,
    '--text': theme.textColor,
    '--muted': theme.mutedColor,
    '--panel': theme.surfaceColor,
    '--heading-font': theme.headingFontFamily,
    '--theme-radius': `${theme.radius ?? 18}px`,
    '--gs-card-radius': `${theme.tokens?.cardRadius ?? theme.radius ?? 18}px`,
    '--gs-token-border': theme.tokens?.borderColor,
    fontFamily: theme.fontFamily,
  } as CSSProperties;
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function documentToLoaded(doc: PresentationDocument, assets: Record<string, string> = {}): LoadedPresentation {
  return { manifest: doc.manifest, slides: doc.slides, assets, assetFiles: doc.assetFiles ?? {}, sourceLabel: 'Studio preview' };
}

export default function StudioApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [drafts, setDrafts] = useState(loadProjects());
  const [published, setPublished] = useState<LibraryEntry[]>([]);
  const [editorDoc, setEditorDoc] = useState<PresentationDocument | null>(null);
  const [editorAssets, setEditorAssets] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<LoadedPresentation | null>(null);
  const [previewPresenterTools, setPreviewPresenterTools] = useState(false);
  const [previewReturn, setPreviewReturn] = useState<Screen>('editor');
  const [viewerUrl, setViewerUrl] = useState(getViewerBaseUrl());
  const [message, setMessage] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'Todas' | PresentationTemplateCategory>('Todas');
  const [selectedTemplateId, setSelectedTemplateId] = useState(presentationTemplates[0]?.id ?? '');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${base}presentations/index.json`).then((r) => r.ok ? r.json() : []).then((data) => setPublished(Array.isArray(data) ? data : [])).catch(() => setPublished([]));
  }, []);

  function refreshDrafts() { setDrafts(loadProjects()); }

  function openBlank() {
    setEditorDoc(createBlankDocument()); setEditorAssets({}); setScreen('editor');
  }

  function openNew() {
    setMessage(''); setScreen('create');
  }

  function openTemplate(templateId: string) {
    setEditorDoc(createPresentationFromTemplate(templateId)); setEditorAssets({}); setScreen('editor');
  }

  async function openDraft(doc: PresentationDocument) {
    const assetFiles = await loadProjectAssets(doc.manifest.id);
    const assetUrls: Record<string,string> = {};
    Object.entries(assetFiles).forEach(([path, bytes]) => { assetUrls[path] = URL.createObjectURL(new Blob([bytes])); });
    setEditorDoc({ ...doc, manifest: { ...doc.manifest, version: 2, publicId: doc.manifest.publicId ?? createPublicId() }, assetFiles });
    setEditorAssets(assetUrls); setScreen('editor');
  }

  async function importZip(file?: File) {
    if (!file) return;
    try {
      const loaded = await loadPresentationFromFile(file);
      const doc = loadedToDocument(loaded);
      if (!doc.manifest.publicId) doc.manifest.publicId = createPublicId();
      setEditorDoc(doc); setEditorAssets(loaded.assets); setScreen('editor'); setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo importar el ZIP.');
    }
  }

  async function openPublished(entry: LibraryEntry, edit = false) {
    try {
      const loaded = await loadPresentationFromUrl(`${base}presentations/${entry.zip}`, entry.title);
      if (edit) {
        const doc = loadedToDocument(loaded);
        if (!doc.manifest.publicId) doc.manifest.publicId = entry.publicId;
        setEditorDoc(doc); setEditorAssets(loaded.assets); setScreen('editor');
      } else {
        setPreview(loaded); setPreviewPresenterTools(false); setPreviewReturn('published'); setScreen('preview');
      }
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo abrir la presentación.');
    }
  }

  function previewDocument(doc: PresentationDocument, assets: Record<string, string>, presenterTools = false) {
    setEditorDoc(doc); setEditorAssets(assets);
    setPreview(documentToLoaded(doc, assets)); setPreviewPresenterTools(presenterTools); setPreviewReturn('editor'); setScreen('preview');
  }

  async function copyPublicLink(publicId: string) {
    if (!viewerUrl) { setMessage('Configurá primero la URL pública del Viewer en la pantalla principal.'); return; }
    const url = `${viewerUrl}/p/${publicId}`;
    await navigator.clipboard.writeText(url);
    setMessage(`Enlace copiado: ${url}`);
  }

  const filteredTemplates = useMemo(() => {
    const query = normalizeSearch(templateSearch.trim());
    return presentationTemplates.filter((template) => {
      const categoryMatch = templateCategory === 'Todas' || template.category === templateCategory;
      const searchMatch = !query || normalizeSearch(`${template.name} ${template.description} ${template.category}`).includes(query);
      return categoryMatch && searchMatch;
    });
  }, [templateCategory, templateSearch]);

  const selectedTemplate = filteredTemplates.find((template) => template.id === selectedTemplateId) ?? filteredTemplates[0];

  const playerNode = preview ? <PresentationPlayer presentation={preview} onClose={() => setScreen(previewReturn)} showPresenterTools={previewPresenterTools} audienceUrl={previewPresenterTools && viewerUrl && preview.manifest.publicId ? `${viewerUrl.replace(/\/$/, '')}/p/${preview.manifest.publicId}` : undefined} /> : null;

  // El preview lanzado desde el editor se monta ENCIMA del editor: si desmontáramos
  // StudioEditor perderíamos su estado local (doc en curso, historial de undo, selección).
  const previewingFromEditor = screen === 'preview' && Boolean(preview) && previewReturn === 'editor';
  if (editorDoc && (screen === 'editor' || previewingFromEditor)) {
    return <>
      <StudioEditor initial={editorDoc} assets={editorAssets} suspended={previewingFromEditor} onBack={() => { refreshDrafts(); setScreen('home'); }} onStudentPreview={(doc, assets) => previewDocument(doc, assets, false)} onPresenterPreview={(doc, assets) => previewDocument(doc, assets, true)} />
      {previewingFromEditor && playerNode}
    </>;
  }

  if (screen === 'preview' && playerNode) {
    return playerNode;
  }

  return <div className="studio-page" data-theme="dark">
    <header className="topbar"><Brand /><div className="studio-badge">STUDIO · LOCAL ONLY</div></header>
    <main className="studio-shell">
      {screen !== 'home' && <button className="back-link" onClick={() => setScreen(screen === 'templates' ? 'create' : 'home')}><ArrowLeft size={16} /> {screen === 'templates' ? 'Volver a elegir' : 'Volver al inicio'}</button>}
      {message && <div className="studio-message">{message}</div>}

      {screen === 'home' && <>
        <section className="studio-hero">
          <span className="hero-kicker"><Presentation size={16} /> GOSLIDES STUDIO</span>
          <h1>Creá acá.<br/><em>Publicá sólo el Viewer.</em></h1>
          <p>El editor queda en tu máquina. GitHub Pages recibe únicamente el reproductor de alumnos y presentaciones accesibles por un ID aleatorio.</p>
        </section>

        <section className="studio-action-grid">
          <button className="studio-action primary-card" onClick={openNew}><div className="action-icon"><Plus /></div><span>CREAR</span><h2>Nueva presentación</h2><p>Empezá desde cero o elegí una presentación lista del catálogo.</p></button>
          <button className="studio-action" onClick={() => setScreen('published')}><div className="action-icon"><Eye /></div><span>VIEWER</span><h2>Ver las existentes</h2><p>Abrí exactamente el reproductor que usarán los estudiantes.</p></button>
          <button className="studio-action" onClick={() => setScreen('drafts')}><div className="action-icon"><BookOpen /></div><span>LOCAL</span><h2>Borradores</h2><p>Continuá presentaciones guardadas automáticamente en este navegador.</p></button>
          <button className="studio-action" onClick={() => fileRef.current?.click()}><div className="action-icon"><Import /></div><span>ZIP</span><h2>Importar presentación</h2><p>Abrí y editá un ZIP GoSlides existente sin escribir JSON.</p></button>
          <a className="studio-action" href={`${base}capabilities/goslides-ai-capabilities.zip`} download><div className="action-icon"><Sparkles /></div><span>KIT IA</span><h2>Exportar capacidades</h2><p>Descargá temas, fuentes, componentes, esquemas y ejemplos para que una IA elija cómo construir la presentación.</p></a>
        </section>

        <section className="viewer-settings-card">
          <div><Settings2 /><div><strong>URL pública del Viewer</strong><span>Se usa para generar y copiar enlaces `/p/&lt;publicId&gt;`.</span></div></div>
          <input placeholder="https://usuario.github.io/repositorio" value={viewerUrl} onChange={(e) => setViewerUrl(e.target.value)} onBlur={() => setViewerBaseUrl(viewerUrl)} />
        </section>
      </>}

      {screen === 'create' && <section className="creation-section">
        <div className="creation-heading"><span>NUEVA PRESENTACIÓN</span><h1>¿Cómo querés empezar?</h1><p>Podés abrir un lienzo limpio o usar una estructura completa y personalizarla.</p></div>
        <div className="creation-choice-grid">
          <button className="creation-choice blank-choice" onClick={openBlank}>
            <div className="creation-choice-visual"><span className="blank-page"><i/><i/><i/></span></div>
            <div className="creation-choice-copy"><span>LIENZO LIMPIO</span><h2>Crear desde cero</h2><p>Una portada inicial y libertad total para definir contenido, tema y estructura.</p><strong>Empezar en blanco <ArrowRight size={17}/></strong></div>
          </button>
          <button className="creation-choice template-choice" onClick={() => setScreen('templates')}>
            <div className="creation-choice-visual"><span className="template-stack"><i/><i/><i/></span><Sparkles className="choice-sparkle" size={22}/></div>
            <div className="creation-choice-copy"><span>CATÁLOGO</span><h2>Usar una plantilla</h2><p>Elegí una narrativa y un estilo listos. Después podés editar absolutamente todo.</p><strong>Explorar plantillas <ArrowRight size={17}/></strong></div>
          </button>
        </div>
        <p className="creation-footnote"><Check size={15}/> Las dos opciones crean un borrador local editable y exportable.</p>
      </section>}

      {screen === 'templates' && <section className="template-catalog-section">
        <div className="catalog-heading">
          <div><span><LayoutTemplate size={15}/> CATÁLOGO DE PLANTILLAS</span><h1>Elegí un buen punto de partida</h1><p>Cada plantilla incluye una historia completa, contenido de ejemplo y un sistema visual editable.</p></div>
          <label className="template-search"><Search size={17}/><input value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Buscar plantillas…" aria-label="Buscar plantillas"/></label>
        </div>
        <div className="template-filters" aria-label="Filtrar plantillas por categoría">{templateCategories.map((category) => <button key={category} className={templateCategory === category ? 'active' : ''} aria-pressed={templateCategory === category} onClick={() => setTemplateCategory(category)}>{category}</button>)}</div>
        {filteredTemplates.length ? <div className="template-catalog-grid">{filteredTemplates.map((template) => {
          const selected = selectedTemplate?.id === template.id;
          return <button className={`presentation-template-card ${selected ? 'selected' : ''}`} key={template.id} aria-pressed={selected} onClick={() => setSelectedTemplateId(template.id)}>
            <div className="template-preview" data-theme={template.theme.mode ?? 'dark'} data-visual-style={template.theme.visualStyle ?? 'modern'} style={templateThemeStyle(template)}>
              <SlideThumbnail slide={template.previewSlide} assets={{}} slideNumber={1} total={template.slideCount}/>
              <span className="template-badge">{template.badge}</span>
              {selected && <span className="template-selected-mark"><Check size={15}/></span>}
            </div>
            <div className="template-card-copy"><span>{template.category} · {template.slideCount} slides</span><h2>{template.name}</h2><p>{template.description}</p></div>
          </button>;
        })}</div> : <div className="empty-state template-empty"><FileText size={24}/><span>No encontramos plantillas con esos filtros.</span><button onClick={() => { setTemplateSearch(''); setTemplateCategory('Todas'); }}>Ver todo el catálogo</button></div>}
        {selectedTemplate && <div className="template-selection-bar"><div><span>PLANTILLA SELECCIONADA</span><strong>{selectedTemplate.name}</strong><small>{selectedTemplate.slideCount} slides listas para editar</small></div><button className="primary-button" onClick={() => openTemplate(selectedTemplate.id)}>Usar esta plantilla <ArrowRight size={17}/></button></div>}
      </section>}

      {screen === 'drafts' && <section className="studio-list-section">
        <div className="section-heading"><div><span>BORRADORES LOCALES</span><h2>Tu trabajo en Studio</h2></div><button className="small-button" onClick={openNew}><Plus size={16} /> Nueva</button></div>
        <div className="studio-card-grid">{drafts.length ? drafts.map((doc) => <article className="studio-deck-card" key={doc.manifest.id}><div><span>{doc.slides.length} slides</span><h3>{doc.manifest.title}</h3><p>{doc.manifest.subtitle}</p><small>{new Date(doc.updatedAt).toLocaleString()}</small></div><footer><button onClick={() => void openDraft(doc)}><Edit3 size={15} /> Editar</button><button onClick={() => { deleteProject(doc.manifest.id); refreshDrafts(); }}><Trash2 size={15} /> Eliminar</button></footer></article>) : <div className="empty-state">Todavía no hay borradores locales.</div>}</div>
      </section>}

      {screen === 'published' && <section className="studio-list-section">
        <div className="section-heading"><div><span>PUBLICADAS / VIEWER</span><h2>Lo que pueden abrir los estudiantes</h2></div></div>
        <p className="section-note">La raíz pública no enumera estas presentaciones. Cada una se comparte mediante su URL aleatoria.</p>
        <div className="studio-card-grid">{published.length ? published.map((entry) => <article className="studio-deck-card published-card" key={entry.publicId}><div><span>{entry.slideCount ?? '?'} slides</span><h3>{entry.title}</h3><p>{entry.subtitle}</p><code>/p/{entry.publicId}</code></div><footer><button onClick={() => void openPublished(entry)}><Eye size={15} /> Ver como alumno</button><button onClick={() => void copyPublicLink(entry.publicId)}><Link2 size={15} /> Copiar enlace</button><button onClick={() => void openPublished(entry, true)}><Edit3 size={15} /> Abrir en Studio</button></footer></article>) : <div className="empty-state">No hay ZIPs publicados todavía. Copiá uno a <code>presentations/</code> y ejecutá el build.</div>}</div>
      </section>}

      <input ref={fileRef} hidden type="file" accept=".zip,application/zip" onChange={(e) => void importZip(e.target.files?.[0])} />
    </main>
  </div>;
}
