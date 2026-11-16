// Camada de apresentação do guia: assuntos, perfis e estado de cada guia.
// Fica fora de content/guide.json, que é regravado pela captura (capture/run.mjs).

import { allDemos, type Demo, type DemoRef, type Section } from './guide';
import type { DemoProgress } from './progress';

/** Para quem é o assunto. Agrupa os assuntos no menu lateral. */
export type Perfil = 'Dono da loja' | 'Equipe do balcão';
export const PERFIS: Perfil[] = ['Dono da loja', 'Equipe do balcão'];

type Assunto = { nome: string; perfil: Perfil; descricao: string };

/** Seção nova sem entrada aqui aparece com o título dela, no grupo do dono. */
const ASSUNTOS: Record<string, Assunto> = {
  introducao: {
    nome: 'Primeiros passos',
    perfil: 'Dono da loja',
    descricao: 'Visão geral, unidades e equipe, saldo de clientes, plano e suporte: o básico para deixar a loja pronta.',
  },
  fidelidades: {
    nome: 'Fidelidades',
    perfil: 'Dono da loja',
    descricao: 'Monte o programa da sua loja: cupom, selos, pontos ou cashback.',
  },
  balcao: {
    nome: 'Atendimento no balcão',
    perfil: 'Equipe do balcão',
    descricao: 'O dia a dia de quem atende: entrar no balcão, encontrar o cliente pelo celular e registrar a venda.',
  },
};

export function assuntoNome(section: Section): string {
  return ASSUNTOS[section.slug]?.nome ?? section.title;
}

export function assuntoPerfil(section: Section): Perfil {
  return ASSUNTOS[section.slug]?.perfil ?? 'Dono da loja';
}

export function assuntoDescricao(section: Section): string | null {
  return ASSUNTOS[section.slug]?.descricao ?? null;
}

/** Estado de um guia para quem assiste. */
export type GuiaState = 'done' | 'current' | 'empty';

export function guiaState(p: DemoProgress | undefined): GuiaState {
  if (p?.done) return 'done';
  if (p && p.step > 0) return 'current';
  return 'empty';
}

/**
 * Miniatura do card: um passo do meio do guia com hotspot fora do menu lateral,
 * para a miniatura mostrar a tela que importa, não a navegação.
 */
export function thumbOf(demo: Demo): { src: string; x: number; y: number } | null {
  const fora = demo.steps.filter((s) => s.image && s.hotspot && s.hotspot.x > 25);
  const s = fora[Math.floor(fora.length / 2)] ?? demo.steps.find((x) => x.image);
  if (!s?.image) return null;
  return { src: s.image, x: s.hotspot?.x ?? 50, y: s.hotspot?.y ?? 0 };
}

/** Guias pela metade, do mais adiantado na ordem do guia. */
export function inProgress(progress: Record<string, DemoProgress>): DemoRef[] {
  return allDemos.filter((r) => guiaState(progress[r.demo.id]) === 'current');
}

/** Texto sem acento e em minúsculas, para a busca achar "balcao" e "balcão". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
