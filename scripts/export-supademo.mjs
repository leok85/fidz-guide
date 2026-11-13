#!/usr/bin/env node
// Migração única: lê o showcase público do Supademo e os demos dele,
// normaliza para content/guide.json e baixa as mídias para public/media.
//
// Uso: node scripts/export-supademo.mjs [showcaseId]
//
// O Supademo é um app Next.js: os dados vêm embutidos no HTML como payload RSC
// (self.__next_f.push). Este script decodifica esse payload e extrai os objetos.

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const SHOWCASE_ID = process.argv[2] ?? 'cmuliox8y0001yt0ji92fnwjd';
const ROOT = path.resolve(import.meta.dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'public', 'media');
const OUT_FILE = path.join(ROOT, 'content', 'guide.json');
const UA = 'Mozilla/5.0 (fidz-guide export)';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ao buscar ${url}`);
  return res.text();
}

function decodeRscPayload(html) {
  const re = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
  let payload = '';
  for (const m of html.matchAll(re)) payload += JSON.parse(m[1]);
  return payload;
}

// Recorta o valor JSON (objeto/array) que começa em `start`, respeitando strings.
function sliceJson(text, start) {
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// Acha o maior objeto `{"id":"<id>", ...}` que satisfaça `accept`.
function findObject(payload, id, accept) {
  const needle = `{"id":"${id}"`;
  let best = null, bestLen = 0;
  for (let i = payload.indexOf(needle); i !== -1; i = payload.indexOf(needle, i + 1)) {
    const raw = sliceJson(payload, i);
    if (!raw || raw.length <= bestLen) continue;
    try {
      const obj = JSON.parse(raw);
      if (accept(obj)) { best = obj; bestLen = raw.length; }
    } catch { /* fragmento com referências RSC ($...) — ignora */ }
  }
  return best;
}

const num = (v) => (v == null || v === '' ? null : Number(v));
const stripHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').trim() || null;

const mediaCache = new Map();
async function localize(url) {
  if (!url) return null;
  if (mediaCache.has(url)) return mediaCache.get(url);
  const ext = path.extname(new URL(url).pathname) || '.bin';
  const name = createHash('sha1').update(url).digest('hex').slice(0, 16) + ext;
  const dest = path.join(MEDIA_DIR, name);
  try {
    await fs.access(dest);
  } catch {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`${res.status} ao baixar ${url}`);
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
  const local = `/media/${name}`;
  mediaCache.set(url, local);
  return local;
}

async function normalizeChapter(ch) {
  if (!ch || !ch.enabled) return null;
  return {
    heading: stripHtml(ch.heading),
    description: stripHtml(ch.description),
    layout: ch.layout === 'Center' ? 'center' : 'left',
    buttons: (ch.buttons ?? [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((b) => ({
        label: b.content,
        color: b.btnColor,
        textColor: b.color,
        // botão interno aponta para um stepId; externo, para uma URL
        href: b.isLinkExternal ? b.linkTxt : null,
        nextStep: b.isLinkExternal ? null : b.linkTxt,
      })),
  };
}

async function normalizeStep(s) {
  const hotspot = (s.hotspots ?? []).find((h) => h.isVisible !== false) ?? null;
  return {
    id: s.id,
    image: await localize(s.image),
    video: await localize(s.video),
    width: num(s.widthOrg) ?? num(s.videoWidth),
    height: num(s.heightOrg) ?? num(s.videoHeight),
    audio: await localize(s.audio),
    captions: await localize(s.captionsUrl),
    narration: s.audioText ?? null,
    duration: num(s.audioDuration) ?? num(s.videoDuration),
    // x/y = centro da área destacada; w/h = tamanho dela. Tudo em % da imagem.
    hotspot: hotspot && {
      x: num(hotspot.mouseXCooridnate),
      y: num(hotspot.mouseYCooridnate),
      w: num(hotspot.boxWidth),
      h: num(hotspot.boxHeight),
      tip: hotspot.tipposition ?? null,
      text: stripHtml(hotspot.text) ?? s.audioText ?? null,
      displayOnly: !!hotspot.isDisplayOnly,
    },
    // Recorte de "câmera" definido no editor do Supademo (% da imagem)
    zoom: num(s.zoomWidth) && num(s.zoomWidth) < 100
      ? { x: num(s.zoomPositionX), y: num(s.zoomPositionY), w: num(s.zoomWidth), h: num(s.zoomHeight) }
      : null,
    chapter: await normalizeChapter(s.chapter),
  };
}

async function exportDemo(demoId) {
  const payload = decodeRscPayload(await fetchText(`https://app.supademo.com/demo/${demoId}`));
  const demo = findObject(payload, demoId, (o) => Array.isArray(o.steps));
  if (!demo) throw new Error(`demo ${demoId} não encontrado no payload`);
  const steps = [...demo.steps].sort((a, b) => Number(a.number) - Number(b.number));
  return {
    id: demo.id,
    title: demo.title,
    description: demo.metadesc ?? null,
    steps: await Promise.all(steps.map(normalizeStep)),
  };
}

async function main() {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });

  const payload = decodeRscPayload(await fetchText(`https://app.supademo.com/showcase/${SHOWCASE_ID}`));
  const sc = findObject(payload, SHOWCASE_ID, (o) => Array.isArray(o.sections));
  if (!sc) throw new Error('showcase não encontrado no payload');

  const sections = [];
  for (const sec of [...sc.sections].sort((a, b) => a.order - b.order)) {
    const items = [...(sec.content ?? sec.items ?? [])].sort((a, b) => a.order - b.order);
    const demos = [];
    for (const item of items) {
      if (item.type !== 'Demo' || !item.demoId) {
        console.warn(`  ignorando item do tipo ${item.type}`);
        continue;
      }
      process.stdout.write(`  ${sec.name} › ${item.demo?.title ?? item.demoId} … `);
      const demo = await exportDemo(item.demoId);
      demo.slug = slugify(item.displayName ?? demo.title);
      demo.navTitle = item.displayName ?? demo.title;
      demos.push(demo);
      console.log(`${demo.steps.length} passos`);
    }
    sections.push({ id: sec.id, title: sec.name, slug: slugify(sec.name), demos });
  }

  const guide = {
    title: sc.name,
    brand: {
      logo: await localize(sc.brandLogo),
      color: sc.ctabtncolor ?? '#6b2eba',
      cta: { label: sc.ctabtntext ?? 'Fidz', href: sc.ctabtnlink ?? 'https://fidz.com.br' },
    },
    ogImage: await localize(sc.customMetadataImage),
    sections,
    exportedAt: new Date().toISOString(),
    source: `https://app.supademo.com/showcase/${SHOWCASE_ID}`,
  };

  await fs.writeFile(OUT_FILE, JSON.stringify(guide, null, 2) + '\n');
  console.log(`\n✔ ${OUT_FILE} — ${mediaCache.size} arquivos de mídia em public/media`);
}

function slugify(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

main().catch((err) => { console.error(err); process.exit(1); });
