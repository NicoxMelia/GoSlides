import { useState } from 'react';
import { ICON_LIBRARIES, ICON_NAMES, IconGlyph } from '../components/IconLibrary';
import { TECH_ICONS, TECH_ICON_BY_ID, TECH_ICON_CATEGORIES } from '../components/TechIcons';
import { ORIGINAL_TECH_ICONS } from '../components/OriginalTechIcons';
import type { CanvasElement, IconLibrary } from '../types';

type IconElement = Extract<CanvasElement, { type: 'icon' }>;
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function IconPicker({ element, onChange }: { element: IconElement; onChange: (element: IconElement) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const library = element.library ?? 'lucide';
  const tech = library === 'tech';
  const icons = tech ? TECH_ICONS : ICON_NAMES.map(id => ({ id, name: id, category: '', keywords: '' }));
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  const matches = icons.filter(icon => (!tech || !category || icon.category === category)
    && tokens.every(token => normalize(`${icon.name} ${icon.id} ${icon.category} ${icon.keywords}`).includes(token)));
  const selected = tech ? TECH_ICON_BY_ID.get(element.name)?.name ?? element.name : element.name;
  function changeLibrary(next: IconLibrary) {
    const name = next === 'tech'
      ? (TECH_ICON_BY_ID.has(element.name) ? element.name : 'grafana')
      : (ICON_NAMES.includes(element.name as typeof ICON_NAMES[number]) ? element.name : 'sparkles');
    setQuery(''); setCategory('');
    onChange({ ...element, library: next, name });
  }

  return <div className="technology-icon-picker">
    <label>Biblioteca<select value={library} onChange={event => changeLibrary(event.target.value as IconLibrary)}>
      {ICON_LIBRARIES.map(lib => <option key={lib.id} value={lib.id}>{lib.name} · {lib.description}</option>)}
    </select></label>
    <label>Buscar iconos<input type="search" value={query} placeholder={tech ? 'Grafana, k8s, Python, AWS…' : 'cloud, server, code…'} onChange={event => setQuery(event.target.value)}/></label>
    {tech && <label>Pack<select value={category} onChange={event => setCategory(event.target.value)}>
      <option value="">Todos los packs ({TECH_ICONS.length})</option>
      {TECH_ICON_CATEGORIES.map(name => <option key={name} value={name}>{name} ({TECH_ICONS.filter(icon => icon.category === name).length})</option>)}
    </select></label>}
    <p className="icon-picker-summary" role="status">{matches.length} iconos · Seleccionado: {selected}</p>
    <div className="technology-icon-grid" role="group" aria-label="Catálogo de iconos">
      {matches.map(icon => <button type="button" className={icon.id === element.name ? 'active' : ''} key={icon.id}
        aria-label={icon.name} aria-pressed={icon.id === element.name} title={icon.name}
        onClick={() => onChange({ ...element, name: icon.id })}>
        <IconGlyph name={icon.id} library={library} size={28} brandColors={element.brandColors}/>
        <span>{icon.name}</span>
      </button>)}
    </div>
    {matches.length === 0 && <p className="icon-picker-summary">Sin resultados. Probá otro nombre o seleccioná todos los packs.</p>}
    {tech && <label className="check-label"><input type="checkbox" checked={element.brandColors !== false}
      onChange={event => onChange({ ...element, brandColors: event.target.checked })}/> {ORIGINAL_TECH_ICONS.has(element.name) ? 'Usar colores originales' : 'Usar color de marca'}</label>}
    {tech && ORIGINAL_TECH_ICONS.has(element.name) && element.brandColors !== false && <small>Logo a todo color · {element.name === 'horusec' ? 'Repositorio oficial de Horusec' : 'Devicon'}</small>}
    <label>Etiqueta<input value={element.label ?? ''} onChange={event => onChange({ ...element, label: event.target.value })}/></label>
    <small>Redimensioná desde la esquina del icono o con W y H en Posición y tamaño. El SVG conserva su proporción.</small>
  </div>;
}
