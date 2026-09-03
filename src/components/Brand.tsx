import { PanelsTopLeft } from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="GoSlides">
      <span className="brand-mark"><PanelsTopLeft size={19} strokeWidth={2.4} /></span>
      {!compact && <span>Go<span>Slides</span></span>}
    </div>
  );
}
