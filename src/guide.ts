import raw from '../content/guide.json';

export type ChapterButton = {
  label: string;
  color?: string;
  textColor?: string;
  href: string | null;
  nextStep: string | null;
};

export type Chapter = {
  heading: string | null;
  description: string | null;
  layout: 'left' | 'center';
  buttons: ChapterButton[];
};

export type Rect = { x: number; y: number; w: number; h: number };

export type Hotspot = {
  /** centro da área destacada, em % da imagem */
  x: number;
  y: number;
  /** tamanho da área, em % da imagem (ausente = só o ponto) */
  w: number | null;
  h: number | null;
  tip: 'left' | 'right' | 'top' | 'bottom' | null;
  text: string | null;
  displayOnly: boolean;
};

export type Step = {
  id: string;
  image: string | null;
  video: string | null;
  width: number | null;
  height: number | null;
  audio: string | null;
  captions: string | null;
  narration: string | null;
  /** segundos de narração ou de vídeo */
  duration: number | null;
  hotspot: Hotspot | null;
  /** recorte de câmera do passo (canto superior esquerdo + tamanho, em %) */
  zoom: Rect | null;
  chapter: Chapter | null;
};

export type Demo = {
  id: string;
  slug: string;
  title: string;
  navTitle: string;
  description: string | null;
  steps: Step[];
};

export type Section = {
  id: string;
  slug: string;
  title: string;
  demos: Demo[];
};

export type Guide = {
  title: string;
  brand: { logo: string; color: string; cta: { label: string; href: string } };
  ogImage: string | null;
  sections: Section[];
};

export const guide = raw as unknown as Guide;

export type DemoRef = { section: Section; demo: Demo; index: number };

/** Lista linear de todos os demos, na ordem do guia (para "próximo demo"). */
export const allDemos: DemoRef[] = guide.sections.flatMap((section) =>
  section.demos.map((demo) => ({ section, demo, index: 0 })),
).map((ref, index) => ({ ...ref, index }));

export function findDemo(sectionSlug?: string, demoSlug?: string): DemoRef | undefined {
  return allDemos.find((r) => r.section.slug === sectionSlug && r.demo.slug === demoSlug);
}

export function demoPath(ref: Pick<DemoRef, 'section' | 'demo'>) {
  return `/${ref.section.slug}/${ref.demo.slug}`;
}

/** Duração estimada em minutos: mídia + ~2s de leitura/clique por passo. */
export function demoMinutes(demo: Demo): number {
  const secs = demo.steps.reduce((t, s) => t + (s.duration ?? 0) + 2, 0);
  return Math.max(1, Math.round(secs / 60));
}

/** Primeira imagem de um demo, usada como capa/miniatura. */
export function coverImage(demo: Demo): string | null {
  return demo.steps.find((s) => s.image)?.image ?? null;
}
