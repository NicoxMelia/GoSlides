import { Fragment, type ReactNode } from 'react';
import { CodeBlockView } from './CodeBlock';
import type { MarkdownAppearance } from '../types';

export type { MarkdownAppearance };

type Props = {
  markdown: string;
  appearance?: MarkdownAppearance;
};

function safeHref(href: string) {
  const value = href.trim();
  if (/^(https?:\/\/|mailto:|#)/i.test(value)) return value;
  return '#';
}

function inlineMarkdown(text: string): ReactNode[] {
  const pattern = /(\!\[[^\]]*\]\([^\s)]+(?:\s+"[^"]*")?\)|\[[^\]]+\]\([^\s)]+(?:\s+"[^"]*")?\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|_[^_]+_)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith('![')) {
      const parsed = /^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/.exec(token);
      if (parsed) parts.push(<img className="markdown-inline-image" key={key++} src={safeHref(parsed[2])} alt={parsed[1]} title={parsed[3]} />);
    } else if (token.startsWith('[')) {
      const parsed = /^\[([^\]]+)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/.exec(token);
      if (parsed) parts.push(<a key={key++} href={safeHref(parsed[2])} title={parsed[3]} target="_blank" rel="noreferrer">{parsed[1]}</a>);
    } else if (token.startsWith('`')) parts.push(<code key={key++}>{token.slice(1, -1)}</code>);
    else if (token.startsWith('**') || token.startsWith('__')) parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('~~')) parts.push(<del key={key++}>{token.slice(2, -2)}</del>);
    else parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    last = pattern.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function isTableSeparator(line: string) {
  const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function tableCells(line: string) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

export function MarkdownBlockView({ markdown, appearance = 'modern' }: Props) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = /^```\s*([\w+#.-]*)\s*$/.exec(line);
    if (fence) {
      const language = fence[1] || 'text';
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      nodes.push(<div className="markdown-code" key={key++}><CodeBlockView code={code.join('\n')} language={language} frameStyle="carbon-glass" codeTheme="github-dark" showLineNumbers showWindowControls /></div>);
      continue;
    }

    if (i + 1 < lines.length && line.includes('|') && isTableSeparator(lines[i + 1])) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(tableCells(lines[i++]));
      nodes.push(<div className="markdown-table-wrap" key={key++}><table><thead><tr>{headers.map((cell, c) => <th key={c}>{inlineMarkdown(cell)}</th>)}</tr></thead><tbody>{rows.map((row, r) => <tr key={r}>{headers.map((_, c) => <td key={c}>{inlineMarkdown(row[c] ?? '')}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = inlineMarkdown(heading[2]);
      if (level === 1) nodes.push(<h2 key={key++}>{content}</h2>);
      else if (level === 2) nodes.push(<h3 key={key++}>{content}</h3>);
      else if (level === 3) nodes.push(<h4 key={key++}>{content}</h4>);
      else nodes.push(<h5 key={key++}>{content}</h5>);
      i++;
      continue;
    }

    if (/^\s*(---|___|\*\*\*)\s*$/.test(line)) { nodes.push(<hr key={key++} />); i++; continue; }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      nodes.push(<blockquote key={key++}>{quote.map((q, n) => <Fragment key={n}>{inlineMarkdown(q)}{n < quote.length - 1 && <br />}</Fragment>)}</blockquote>);
      continue;
    }

    const unordered = /^\s*[-+*]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      const orderedList = Boolean(ordered);
      const items: ReactNode[] = [];
      const matcher = orderedList ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-+*]\s+(.+)$/;
      while (i < lines.length) {
        const item = matcher.exec(lines[i]);
        if (!item) break;
        const task = /^\[([ xX])\]\s+(.+)$/.exec(item[1]);
        items.push(<li className={task ? 'markdown-task' : undefined} key={items.length}>{task ? <><span className={`markdown-checkbox ${task[1].toLowerCase() === 'x' ? 'checked' : ''}`}>{task[1].toLowerCase() === 'x' ? '✓' : ''}</span>{inlineMarkdown(task[2])}</> : inlineMarkdown(item[1])}</li>);
        i++;
      }
      nodes.push(orderedList ? <ol key={key++}>{items}</ol> : <ul key={key++}>{items}</ul>);
      continue;
    }

    const paragraph: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4})\s+/.test(lines[i]) && !/^```/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^\s*[-+*]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) && !(lines[i].includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))) {
      paragraph.push(lines[i].trim());
      i++;
    }
    nodes.push(<p key={key++}>{inlineMarkdown(paragraph.join(' '))}</p>);
  }

  return <article className={`markdown-block markdown-${appearance}`}>{nodes}</article>;
}
