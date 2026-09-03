import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GITMOJIS, type GitmojiItem } from '../lib/gitmoji';

export function EmojiPicker({onSelect,onClose}:{onSelect:(item:GitmojiItem)=>void;onClose:()=>void}){
  const [query,setQuery]=useState('');
  const items=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return GITMOJIS;return GITMOJIS.filter(item=>`${item.emoji} ${item.code} ${item.description} ${item.keywords.join(' ')}`.toLowerCase().includes(q));},[query]);
  return <div className="emoji-picker-backdrop" onPointerDown={onClose}><div className="emoji-picker" onPointerDown={e=>e.stopPropagation()}>
    <div className="emoji-picker-head"><div><strong>Emoji / Gitmoji</strong><small>Unicode · sin assets pagos</small></div><button onClick={onClose}><X size={16}/></button></div>
    <label className="emoji-search"><Search size={15}/><input autoFocus placeholder="Buscar feature, bug, deploy…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="emoji-grid">{items.map(item=><button key={item.code} onClick={()=>onSelect(item)} title={`${item.code} · ${item.description}`}><span>{item.emoji}</span><strong>{item.code.replace(/:/g,'')}</strong><small>{item.description}</small></button>)}</div>
    {!items.length&&<div className="empty-mini">No hay coincidencias.</div>}
  </div></div>;
}
