export type ThemeMode = 'light' | 'dark';
export type TransitionName = 'none' | 'fade' | 'slide' | 'zoom' | 'wipe' | 'flip' | 'morph';
export type AnimationName = 'none' | 'fade' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom' | 'bounce' | 'blur' | 'rotate' | 'motion-path';
export type AnimationEasing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
export type TextAlign = 'left' | 'center' | 'right';
export type VisualStyle = 'modern' | 'sketch';
export type IconLibrary = 'lucide' | 'phosphor' | 'tabler' | 'heroicons' | 'tech';
export type ArrowStyle = 'classic' | 'modern' | 'rounded' | 'minimal' | 'double' | 'sketch' | 'dotted' | 'wedge' | 'blunt';
export interface CodeSimulationOptions {
  simulationEnabled?: boolean;
  simulationOutput?: string;
}

export type CodeFrameStyle = 'classic' | 'carbon' | 'carbon-glass' | 'carbon-light' | 'minimal' | 'neon' | 'terminal' | 'paper' | 'notebook';
export type CodeTheme = 'seti' | 'night-owl' | 'dracula' | 'nord' | 'github-dark' | 'monokai' | 'one-dark' | 'tokyo-night' | 'catppuccin' | 'gruvbox' | 'solarized-dark' | 'synthwave' | 'github-light' | 'solarized-light' | 'ayu-light';

export type MarkdownAppearance = 'modern' | 'paper' | 'minimal' | 'card' | 'notebook' | 'contrast' | 'terminal';

export interface ThemeTokens {
  spacing?: number;
  cardRadius?: number;
  shadowStrength?: number;
  borderColor?: string;
}

export interface ThemeConfig {
  mode?: ThemeMode;
  accent?: string;
  fontFamily?: string;
  headingFontFamily?: string;
  slideBackground?: string;
  surfaceColor?: string;
  textColor?: string;
  mutedColor?: string;
  radius?: number;
  tokens?: ThemeTokens;
  visualStyle?: VisualStyle;
  iconLibrary?: IconLibrary;
}

export interface SlideMaster {
  id: string;
  name: string;
  background?: string;
  footer?: string;
  canvas?: CanvasElement[];
}

export interface ComponentStylePreset {
  id: string;
  name: string;
  style: ElementStyle;
}

export interface PresentationSection {
  id: string;
  name: string;
}

export type ContentDensity = 'visual' | 'balanced' | 'detailed' | 'documentary';
export type PresentationDepth = 'summary' | 'class' | 'workshop' | 'reference';
export type InteractionLevel = 'none' | 'occasional' | 'frequent';
export type OverflowStrategy = 'split' | 'reveal' | 'appendix' | 'preserve';

/** Preferencias persistidas para generadores de IA y diagnósticos de Studio. */
export interface AuthoringPreferences {
  density?: ContentDensity;
  depth?: PresentationDepth;
  interaction?: InteractionLevel;
  overflowStrategy?: OverflowStrategy;
  durationMinutes?: number;
  preserveSourceMaterial?: boolean;
}

export interface PresentationManifest {
  format: 'goslides';
  version: 1 | 2;
  id: string;
  publicId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  author?: string;
  tags?: string[];
  theme?: ThemeConfig;
  masters?: SlideMaster[];
  componentStyles?: ComponentStylePreset[];
  sections?: PresentationSection[];
  authoring?: AuthoringPreferences;
  cover?: string;
  slides: string[];
}

export interface ElementStyle {
  color?: string;
  background?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: TextAlign;
  fontStyle?: 'normal' | 'italic';
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  shadow?: boolean;
  sketch?: boolean;
}

/**
 * Bytes de un asset. El parámetro `ArrayBuffer` (en lugar del `ArrayBufferLike` que
 * `Uint8Array` toma por defecto) descarta `SharedArrayBuffer`, que `Blob`/`BlobPart`
 * no acepta. Todos nuestros assets vienen de `File.arrayBuffer()`, de JSZip o de
 * IndexedDB, así que siempre están respaldados por un `ArrayBuffer` común.
 */
export type AssetBytes = Uint8Array<ArrayBuffer>;

export interface ElementComment {
  id: string;
  text: string;
  createdAt: string;
  resolved?: boolean;
}

export interface AnimationMeta {
  fragment?: number;
  animation?: AnimationName;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: AnimationEasing;
  motionPathX?: number;
  motionPathY?: number;
}

export interface CanvasElementBase extends AnimationMeta {
  morphId?: string;
  styleRef?: string;
  triggerId?: string;
  id: string;
  layerName?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  zIndex?: number;
  style?: ElementStyle;
  groupId?: string;
  locked?: boolean;
  hidden?: boolean;
  comments?: ElementComment[];
}

export type CanvasElement =
  | (CanvasElementBase & { type: 'text'; text: string })
  | (CanvasElementBase & { type: 'shape'; shape: 'rectangle' | 'rounded' | 'circle'; text?: string })
  | (CanvasElementBase & { type: 'vector'; shape: 'star' | 'triangle' | 'hexagon' | 'chevron' | 'diamond' | 'pentagon' | 'octagon' | 'cross' | 'parallelogram' | 'trapezoid'; fill?: string; stroke?: string; strokeWidth?: number; vectorStyle?: 'solid' | 'outline' | 'duotone' | 'sketch' })
  | (CanvasElementBase & { type: 'image'; src: string; alt?: string; fit?: 'contain' | 'cover'; objectPositionX?: number; objectPositionY?: number; cropZoom?: number; mask?: 'none' | 'circle' | 'rounded' | 'star' | 'hexagon'; /** Asset previo al recorte de fondo, para poder restaurarlo. */ originalSrc?: string; grayscale?: number; brightness?: number; contrast?: number; saturate?: number; flipX?: boolean; flipY?: boolean })
  | (CanvasElementBase & { type: 'arrow'; direction?: 'right' | 'left' | 'down' | 'up'; thickness?: number; arrowStyle?: ArrowStyle })
  | (CanvasElementBase & CodeSimulationOptions & { type: 'code'; language?: string; code: string; title?: string; frameStyle?: CodeFrameStyle; codeTheme?: CodeTheme; showLineNumbers?: boolean; showWindowControls?: boolean })
  | (CanvasElementBase & { type: 'emoji'; emoji: string; shortcode?: string; description?: string })
  | (CanvasElementBase & { type: 'icon'; name: string; label?: string; library?: IconLibrary; brandColors?: boolean })
  | (CanvasElementBase & { type: 'freehand'; points: Array<{ x: number; y: number }>; stroke?: string; strokeWidth?: number })
  | (CanvasElementBase & { type: 'table'; rows: string[][]; headerRow?: boolean; striped?: boolean; compact?: boolean })
  | (CanvasElementBase & { type: 'connector'; from: string; to: string; label?: string; thickness?: number; dashed?: boolean })
  /** Envuelve cualquier SlideBlock como objeto de canvas: posición, tamaño y rotación libres. */
  | (CanvasElementBase & { type: 'block'; block: SlideBlock; fit?: 'stretch' | 'auto' });

export type SmartLayoutMode = 'none' | 'row' | 'column' | 'grid';

export interface Slide {
  id: string;
  sectionId?: string;
  layout?: 'default' | 'title' | 'center' | 'split' | 'free';
  masterId?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  footer?: string;
  blocks?: SlideBlock[];
  canvas?: CanvasElement[];
  notes?: string[];
  transition?: TransitionName;
  background?: string;
  smartLayout?: { mode: SmartLayoutMode; gap?: number; padding?: number };
}

interface BlockMeta extends AnimationMeta {}

export type ChartKind = 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'radar' | 'progress' | 'gauge' | 'funnel';

/**
 * Contenido progresivo. "text" conserva compatibilidad con presentaciones v2
 * existentes y "blocks" permite que la IA componga detalle real (Markdown,
 * código, charts, imágenes, etc.) dentro de un componente interactivo.
 * Cuando existen ambos, el renderer prioriza "blocks".
 */
export interface ProgressiveContent {
  text?: string;
  blocks?: SlideBlock[];
}

export type SlideBlock =
  | (BlockMeta & { type: 'text'; text: string; lead?: boolean })
  | (BlockMeta & { type: 'markdown'; markdown: string; appearance?: MarkdownAppearance })
  | (BlockMeta & { type: 'bullets'; items: string[] })
  | (BlockMeta & { type: 'cards'; columns?: 2 | 3 | 4; items: Array<{ title: string; text: string; icon?: string; badge?: string }> })
  | (BlockMeta & { type: 'stats'; items: Array<{ value: string; label: string; hint?: string }> })
  | (BlockMeta & { type: 'compare'; left: CompareColumn; right: CompareColumn })
  | (BlockMeta & CodeSimulationOptions & { type: 'code'; language?: string; title?: string; code: string; frameStyle?: CodeFrameStyle; codeTheme?: CodeTheme; showLineNumbers?: boolean; showWindowControls?: boolean })
  | (BlockMeta & { type: 'terminal'; title?: string; command: string; output?: string })
  | (BlockMeta & { type: 'image'; src: string; alt?: string; caption?: string; fit?: 'contain' | 'cover' })
  | (BlockMeta & { type: 'timeline'; items: Array<{ title: string; text?: string }> })
  | (BlockMeta & { type: 'tabs'; tabs: Array<ProgressiveContent & { label: string; title?: string }> })
  | (BlockMeta & { type: 'steps'; title?: string; items: Array<ProgressiveContent & { title: string }> })
  | (BlockMeta & { type: 'architecture'; nodes: ArchitectureNode[]; edges: ArchitectureEdge[]; detailView?: 'drawer' | 'modal' | 'inline' })
  | (BlockMeta & { type: 'quote'; text: string; author?: string })
  | (BlockMeta & { type: 'callout'; title?: string; text: string; tone?: 'info' | 'success' | 'warning' | 'danger' })
  | (BlockMeta & { type: 'quadrant'; title?: string; rowAxis?: string; colAxis?: string; rowLabels: [string, string]; colLabels: [string, string]; cells: [QuadrantCell, QuadrantCell, QuadrantCell, QuadrantCell] })
  | (BlockMeta & { type: 'columns'; ratio?: number[]; gap?: number; items: Array<{ title?: string; blocks: SlideBlock[] }> })
  | (BlockMeta & { type: 'tooltip'; label: string; text: string })
  | (BlockMeta & { type: 'modal'; buttonLabel: string; title: string; text?: string; blocks?: SlideBlock[] })
  | (BlockMeta & { type: 'accordion'; title?: string; allowMultiple?: boolean; items: Array<ProgressiveContent & { title: string }> })
  | (BlockMeta & { type: 'drawer'; buttonLabel: string; title: string; text?: string; blocks?: SlideBlock[]; side?: 'left' | 'right'; width?: 'sm' | 'md' | 'lg' })
  | (BlockMeta & { type: 'flipcard'; frontTitle: string; frontText?: string; backTitle: string; backText: string })
  | (BlockMeta & { type: 'beforeAfter'; beforeLabel?: string; afterLabel?: string; beforeText: string; afterText: string })
  | (BlockMeta & { type: 'hotspots'; src: string; alt?: string; points: Array<ProgressiveContent & { x: number; y: number; label: string }> })
  | (BlockMeta & { type: 'chart'; chart: ChartKind; title?: string; labels: string[]; values: number[]; suffix?: string; showValues?: boolean; showLegend?: boolean; xLabel?: string; yLabel?: string })
  | (BlockMeta & { type: 'simulation'; title?: string; min?: number; max?: number; initial?: number; unit?: string; metricLabel?: string; podsBase?: number; podsStep?: number });

export interface QuadrantCell {
  title: string;
  text?: string;
  tone?: 'success' | 'danger' | 'neutral';
}

export interface CompareColumn {
  label: string;
  title: string;
  subtitle?: string;
  items: string[];
  highlight?: boolean;
}

export interface ArchitectureNode extends ProgressiveContent {
  id: string;
  label: string;
  caption?: string;
  x: number;
  y: number;
  kind?: 'client' | 'service' | 'data' | 'cloud' | 'queue' | 'security' | 'group' | 'note';
  width?: number;
  height?: number;
  color?: string;
  icon?: string;
  iconLibrary?: IconLibrary;
  brandColors?: boolean;
}

export interface ArchitectureEdge {
  from: string; to: string; label?: string;
  color?: string;
  lineStyle?: 'curve' | 'straight' | 'orthogonal';
  dashed?: boolean;
  arrow?: boolean;
}

export type ArchitectureDiagramBlock = Extract<SlideBlock, { type: 'architecture' }>;

export interface LoadedPresentation {
  manifest: PresentationManifest;
  slides: Slide[];
  assets: Record<string, string>;
  assetFiles: Record<string, AssetBytes>;
  sourceLabel: string;
}

export interface LibraryEntry {
  id: string;
  publicId: string;
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  zip: string;
  slideCount?: number;
}

export interface PresentationDocument {
  manifest: PresentationManifest;
  slides: Slide[];
  assetFiles?: Record<string, AssetBytes>;
  updatedAt: string;
}

export interface UserSlideTemplate {
  id: string;
  name: string;
  slide: Slide;
  createdAt: string;
}

export interface UserThemePreset {
  id: string;
  name: string;
  theme: ThemeConfig;
  createdAt: string;
}
