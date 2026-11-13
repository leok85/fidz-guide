import type { Hotspot, Rect } from './guide';

export type Size = { w: number; h: number };
/** Transformação aplicada à imagem: escala + deslocamento, em px do palco. */
export type View = { s: number; tx: number; ty: number };

export const FULL: Rect = { x: 0, y: 0, w: 100, h: 100 };

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/**
 * Enquadra `rect` (em % da imagem) num palco de tamanho `box`.
 * A imagem, na escala 1, ocupa a largura do palco. O resultado sempre cobre o palco
 * inteiro, sem mostrar bordas vazias.
 */
export function frame(rect: Rect, box: Size, aspect: number): View {
  const worldW = box.w;
  const worldH = box.w / aspect;
  const rw = (rect.w / 100) * worldW;
  const rh = (rect.h / 100) * worldH;
  const s = Math.max(Math.min(box.w / rw, box.h / rh), box.h / worldH, 1);
  const cx = ((rect.x + rect.w / 2) / 100) * worldW;
  const cy = ((rect.y + rect.h / 2) / 100) * worldH;
  return {
    s,
    tx: clamp(box.w / 2 - s * cx, box.w - s * worldW, 0),
    ty: clamp(box.h / 2 - s * cy, box.h - s * worldH, 0),
  };
}

/** Recorte centrado no hotspot, usado em telas estreitas para a interface ficar legível. */
export function focusRect(h: Pick<Hotspot, 'x' | 'y' | 'w'>, box: Size, aspect: number): Rect {
  const w = Math.min(100, Math.max(44, (h.w ?? 0) * 1.8));
  const hgt = w * aspect * (box.h / box.w);
  return { x: h.x - w / 2, y: h.y - hgt / 2, w, h: hgt };
}

/** Converte um ponto/área em % da imagem para px do palco, dada a vista atual. */
export function project(v: View, box: Size, aspect: number, r: Rect) {
  const worldH = box.w / aspect;
  return {
    left: v.tx + v.s * (r.x / 100) * box.w,
    top: v.ty + v.s * (r.y / 100) * worldH,
    width: v.s * (r.w / 100) * box.w,
    height: v.s * (r.h / 100) * worldH,
  };
}

type Side = 'left' | 'right' | 'top' | 'bottom';
const OPPOSITE: Record<Side, Side> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };

/**
 * Posiciona o balão ao lado da área destacada, no lado preferido.
 * Se não couber, tenta o lado oposto e depois os demais.
 */
export function placeTip(
  target: { left: number; top: number; width: number; height: number },
  tip: Size,
  box: Size,
  preferred: Side | null,
  gap = 14,
) {
  const first = preferred ?? 'right';
  const order: Side[] = [first, OPPOSITE[first], ...(['bottom', 'top', 'right', 'left'] as Side[])];
  const cx = target.left + target.width / 2;
  const cy = target.top + target.height / 2;
  const pad = 10;

  const at = (side: Side) => {
    switch (side) {
      case 'left': return { left: target.left - gap - tip.w, top: cy - tip.h / 2 };
      case 'right': return { left: target.left + target.width + gap, top: cy - tip.h / 2 };
      case 'top': return { left: cx - tip.w / 2, top: target.top - gap - tip.h };
      case 'bottom': return { left: cx - tip.w / 2, top: target.top + target.height + gap };
    }
  };
  const fits = (p: { left: number; top: number }, side: Side) =>
    side === 'left' || side === 'right'
      ? p.left >= pad && p.left + tip.w <= box.w - pad
      : p.top >= pad && p.top + tip.h <= box.h - pad;

  const side = order.find((s) => fits(at(s), s)) ?? first;
  const p = at(side);
  return {
    side,
    left: clamp(p.left, pad, Math.max(pad, box.w - tip.w - pad)),
    top: clamp(p.top, pad, Math.max(pad, box.h - tip.h - pad)),
  };
}
