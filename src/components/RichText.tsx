import { Fragment } from 'react';

// Safe inline rich text for GoSlides v7.
// **bold** *italic* __underline__ ~~strike~~ ==accent== ^^highlight^^ `code`
// {#ff5c8a|color} {bg:#ffd166|background} {size:135|relative size}
// ~^superscript^~ ~_subscript_~ [label](https://example.com)
export function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return <>{lines.map((line, lineIndex) => <Fragment key={lineIndex}>{lineIndex > 0 && <br />}{parseInline(line)}</Fragment>)}</>;
}

function parseInline(value: string) {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\^\^[^^]+\^\^|==[^=]+==|`[^`]+`|\{#[0-9a-fA-F]{3,8}\|[^}]+\}|\{bg:#[0-9a-fA-F]{3,8}\|[^}]+\}|\{size:\d{2,3}\|[^}]+\}|~\^[^^]+\^~|~_[^_]+_~|\[[^\]]+\]\(https?:\/\/[^)]+\)|\*[^*]+\*)/g;
  const parts = value.split(pattern).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('__') && part.endsWith('__')) return <u key={index}>{part.slice(2, -2)}</u>;
    if (part.startsWith('~~') && part.endsWith('~~')) return <s key={index}>{part.slice(2, -2)}</s>;
    if (part.startsWith('^^') && part.endsWith('^^')) return <mark className="rich-highlight" key={index}>{part.slice(2, -2)}</mark>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('==') && part.endsWith('==')) return <span className="rich-accent" key={index}>{part.slice(2, -2)}</span>;
    if (part.startsWith('`') && part.endsWith('`')) return <code className="rich-code" key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith('~^') && part.endsWith('^~')) return <sup key={index}>{part.slice(2, -2)}</sup>;
    if (part.startsWith('~_') && part.endsWith('_~')) return <sub key={index}>{part.slice(2, -2)}</sub>;
    if (part.startsWith('{#')) { const divider=part.indexOf('|'); return <span style={{color:part.slice(1,divider)}} key={index}>{part.slice(divider+1,-1)}</span>; }
    if (part.startsWith('{bg:')) { const divider=part.indexOf('|'); return <span className="rich-bg" style={{background:part.slice(4,divider)}} key={index}>{part.slice(divider+1,-1)}</span>; }
    if (part.startsWith('{size:')) { const divider=part.indexOf('|'); const value=Math.max(50,Math.min(250,Number(part.slice(6,divider))||100)); return <span style={{fontSize:`${value}%`}} key={index}>{part.slice(divider+1,-1)}</span>; }
    if (part.startsWith('[')) { const match=/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(part); if(match)return <a className="rich-link" key={index} href={match[2]} target="_blank" rel="noreferrer">{match[1]}</a>; }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
