import { useRef, useState } from 'react';
import { Bold, Code2, Eye, EyeOff, Highlighter, Italic, Link2, Palette, Strikethrough, Underline, Superscript, Subscript, CaseUpper, PaintBucket } from 'lucide-react';
import { RichText } from '../components/RichText';

export function RichTextInput({ value, onChange, label = 'Texto enriquecido' }: { value: string; onChange: (value: string) => void; label?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview,setPreview]=useState(true);

  function keepSelection(event: React.PointerEvent<HTMLButtonElement>) { event.preventDefault(); }
  function wrap(before:string,after=before,placeholder='texto'){
    const el=ref.current;if(!el)return;
    const start=el.selectionStart??value.length,end=el.selectionEnd??start,selected=value.slice(start,end)||placeholder;
    const next=`${value.slice(0,start)}${before}${selected}${after}${value.slice(end)}`;
    if(next!==value) onChange(next);
    requestAnimationFrame(()=>{el.focus();el.setSelectionRange(start+before.length,start+before.length+selected.length);});
  }
  function addLink(){const url=window.prompt('URL (https://...)','https://');if(!url)return;const el=ref.current,start=el?.selectionStart??value.length,end=el?.selectionEnd??start,selected=value.slice(start,end)||'enlace';onChange(`${value.slice(0,start)}[${selected}](${url})${value.slice(end)}`);}
  function addColor(){const color=window.prompt('Color HEX','#8b6cff');if(!color||!/^#[0-9a-fA-F]{3,8}$/.test(color))return;wrap(`{${color}|`,'}','texto');}
  function addBackground(){const color=window.prompt('Color de fondo HEX','#ffd166');if(!color||!/^#[0-9a-fA-F]{3,8}$/.test(color))return;wrap(`{bg:${color}|`,'}','texto');}
  function addSize(){const size=Number(window.prompt('Tamaño relativo en % (50–250)','135'));if(!Number.isFinite(size))return;wrap(`{size:${Math.max(50,Math.min(250,size))}|`,'}','texto');}
  const formatButton=(title:string,action:()=>void,icon:React.ReactNode)=><button type="button" title={title} onPointerDown={keepSelection} onClick={action}>{icon}</button>;

  return <label className="rich-editor-label">{label}
    <div className="rich-editor-toolbar" role="toolbar" aria-label="Formato de texto">
      {formatButton('Negrita',()=>wrap('**'),<Bold size={14}/>)}
      {formatButton('Cursiva',()=>wrap('*'),<Italic size={14}/>)}
      {formatButton('Subrayado',()=>wrap('__'),<Underline size={14}/>)}
      {formatButton('Tachado',()=>wrap('~~'),<Strikethrough size={14}/>)}
      {formatButton('Accent',()=>wrap('=='),<Palette size={14}/>)}
      {formatButton('Resaltado',()=>wrap('^^'),<Highlighter size={14}/>)}
      {formatButton('Código inline',()=>wrap('`'),<Code2 size={14}/>)}
      {formatButton('Superíndice',()=>wrap('~^','^~'),<Superscript size={14}/>)}
      {formatButton('Subíndice',()=>wrap('~_','_~'),<Subscript size={14}/>)}
      {formatButton('Tamaño relativo',addSize,<CaseUpper size={14}/>)}
      {formatButton('Color personalizado',addColor,<span className="color-dot"/>)}
      {formatButton('Fondo de texto',addBackground,<PaintBucket size={14}/>)}
      {formatButton('Enlace',addLink,<Link2 size={14}/>)}
    </div>
    <textarea ref={ref} value={value} onChange={event=>onChange(event.target.value)}/>
    <button type="button" className="rich-preview-toggle" onClick={()=>setPreview(v=>!v)}>{preview?<EyeOff size={14}/>:<Eye size={14}/>} {preview?'Ocultar vista previa':'Mostrar vista previa'}</button>
    {preview&&<div className="rich-editor-preview"><span>Vista previa · no modifica el texto</span><p><RichText text={value||'Escribí para ver el resultado…'}/></p></div>}
  </label>;
}
