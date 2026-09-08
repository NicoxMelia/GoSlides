import { Check, Copy, Play, Terminal, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { CodeFrameStyle, CodeSimulationOptions, CodeTheme } from '../types';

function SimulationTerminal({ output, id, onClose }: { output: string; id: string; onClose: () => void }) {
  const [visible, setVisible] = useState(0);
  const scrollRef = useRef<HTMLPreElement>(null);
  const characters = Array.from(output);
  const finished = visible >= characters.length;
  useEffect(() => {
    const length = Array.from(output).length;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(length);
      return;
    }
    // Bound playback to five seconds even for long output; never evaluate code.
    const step = Math.max(1, Math.ceil(length / 125));
    let count = 0;
    const timer = window.setInterval(() => {
      count = Math.min(length, count + step);
      setVisible(count);
      if (count >= length) window.clearInterval(timer);
    }, 40);
    return () => window.clearInterval(timer);
  }, [output]);
  useEffect(() => {
    const panel = scrollRef.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [visible]);

  return <section id={id} className="code-simulation-terminal" aria-label="Terminal bash — simulación"
    onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}
    onKeyDown={event => { event.stopPropagation(); if (event.key === 'Escape') onClose(); }}>
    <div className="code-simulation-header">
      <span><Terminal size={14} aria-hidden="true"/> bash <small>Simulación</small></span>
      <button type="button" aria-label="Cerrar terminal" onClick={onClose}><X size={16}/></button>
    </div>
    <pre ref={scrollRef} tabIndex={0} aria-label="Salida de la simulación"><code>{characters.slice(0, visible).join('')}</code></pre>
    <div className="code-simulation-status" role="status">{finished ? 'Simulación finalizada' : 'Simulando…'}</div>
  </section>;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function keywordsFor(language: string) {
  const lang = language.toLowerCase();
  if (lang.includes('python')) return ['def','class','return','if','else','elif','for','while','in','import','from','as','True','False','None','and','or','not','with','lambda','print','try','except','finally','raise'];
  if (lang.includes('json')) return ['true','false','null'];
  return ['const','let','var','function','return','if','else','for','while','class','new','import','from','export','default','async','await','interface','type','public','private','protected','static','void','int','char','float','double','struct','include','define','switch','case','break','continue','true','false','null','undefined','try','catch','finally','throw','extends','implements'];
}

/**
 * Tiny dependency-free highlighter. Important: we tokenize the ORIGINAL line and
 * only then emit HTML. Earlier versions highlighted already-generated <span>
 * markup, which corrupted class="tok-*" and made that markup visible on screen.
 */
export function highlightCodeLine(line: string, language = '') {
  const keywordSet = new Set(keywordsFor(language));
  const hashComments = /python|py|bash|shell|sh|zsh|yaml|yml/i.test(language);
  const tokenPattern = hashComments
    ? /(\/\/.*$|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/gm
    : /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/gm;
  let cursor = 0;
  let html = '';
  for (const match of line.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) html += escapeHtml(line.slice(cursor, index));
    const token = match[0];
    let cls = '';
    if (token.startsWith('//') || token.startsWith('#')) cls = 'tok-comment';
    else if (/^["'`]/.test(token)) cls = 'tok-string';
    else if (/^\d/.test(token)) cls = 'tok-number';
    else if (keywordSet.has(token)) cls = 'tok-keyword';
    html += cls ? `<span class="${cls}">${escapeHtml(token)}</span>` : escapeHtml(token);
    cursor = index + token.length;
  }
  if (cursor < line.length) html += escapeHtml(line.slice(cursor));
  return html || ' ';
}

export function CodeBlockView({
  code,
  language='text',
  title='Código',
  frameStyle='classic',
  codeTheme='seti',
  showLineNumbers=false,
  showWindowControls=true,
  simulationEnabled=false,
  simulationOutput='',
  compact=false,
}: CodeSimulationOptions & {
  code: string;
  language?: string;
  title?: string;
  frameStyle?: CodeFrameStyle;
  codeTheme?: CodeTheme;
  showLineNumbers?: boolean;
  showWindowControls?: boolean;
  compact?: boolean;
}) {
  const [copied,setCopied]=useState(false);
  const [run, setRun] = useState(0);
  const terminalId = useId();
  const runButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { setRun(0); }, [code, simulationEnabled, simulationOutput]);
  const closeTerminal = () => { setRun(0); runButton.current?.focus(); };
  const lines=(code || '').replace(/\r\n/g,'\n').split('\n');
  async function copy(){
    try{await navigator.clipboard?.writeText(code);setCopied(true);window.setTimeout(()=>setCopied(false),1200);}catch{/* presentation remains usable */}
  }
  return <div className={`code-frame code-frame-${frameStyle} code-theme-${codeTheme} ${compact?'code-compact':''}`}>
    {(frameStyle.startsWith('carbon') || frameStyle === 'neon') && <div className="carbon-backdrop" aria-hidden="true"/>}
    <div className="code-window">
      <div className="code-window-header">
        <div className="code-window-left">
          {showWindowControls && <span className="window-dots" aria-hidden="true"><i/><i/><i/></span>}
          <strong>{title}</strong>
        </div>
        <div className="code-window-actions"><span className="code-language-badge">{language}</span>
          {simulationEnabled && <button ref={runButton} type="button" className="code-run" aria-expanded={run > 0} aria-controls={run > 0 ? terminalId : undefined}
            onPointerDown={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}
            onClick={event => { event.stopPropagation(); setRun(value => value + 1); }}><Play size={13} aria-hidden="true"/> Run code</button>}
          <button type="button" className="code-copy" onClick={copy} title="Copiar código" aria-label="Copiar código">{copied?<Check size={13}/>:<Copy size={13}/>}</button></div>
      </div>
      <pre className="code-lines"><code>{lines.map((line,index)=><span className="code-line" key={index}>{showLineNumbers&&<i className="code-line-number">{index+1}</i>}<span className="code-line-content" dangerouslySetInnerHTML={{__html:highlightCodeLine(line,language)}}/></span>)}</code></pre>
      {simulationEnabled && run > 0 && <SimulationTerminal key={run} id={terminalId} output={simulationOutput} onClose={closeTerminal}/>}
    </div>
  </div>;
}
