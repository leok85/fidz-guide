// Folha de contato de um guia: cada print com o hotspot desenhado, para revisar a captura.
//   node capture/contact.mjs <slug>  →  capture/.out/contato-<slug>.png
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const slug = process.argv[2];
const ROOT = path.resolve(import.meta.dirname, '..');
const g = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/guide.json'), 'utf8'));
const demo = g.sections.flatMap((s) => s.demos).find((d) => d.slug === slug);
const cells = demo.steps.filter((s) => s.image).map((s, i) => {
  const h = s.hotspot; const src = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'public', s.image)).toString('base64');
  const box = h ? `<div style="position:absolute;left:${h.x - (h.w ?? 2) / 2}%;top:${h.y - (h.h ?? 2) / 2}%;width:${h.w ?? 2}%;height:${h.h ?? 2}%;border:3px solid #ff2d55;border-radius:6px"></div>` : '';
  return `<figure><div style="position:relative"><img src="${src}">${box}</div><figcaption><b>${i + 1}.</b> ${s.narration ?? ''} <i>(${(s.duration ?? 0).toFixed(1)}s)</i></figcaption></figure>`;
}).join('');
const html = `<style>body{margin:0;font:13px system-ui;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;background:#eee}figure{margin:0;background:#fff;padding:6px}img{width:100%;display:block}</style>${cells}`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 800 } });
await p.setContent(html); await p.waitForTimeout(500);
const out = path.join(ROOT, 'capture/.out', `contato-${slug}.png`);
await p.screenshot({ path: out, fullPage: true }); await b.close(); console.log(out);
