import { chromium } from 'playwright';
const KEY = process.env.KEY;
const tok = await (await fetch('http://127.0.0.1:54421/auth/v1/token?grant_type=password', {
  method: 'POST', headers: { apikey: KEY, 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'beatriz.nunes@fidz.test', password: 'Fidz-guia-2026' }) })).json();
if (!tok.access_token) { console.log(tok); process.exit(1); }
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR', isMobile: true, hasTouch: true });
await ctx.addInitScript((s) => localStorage.setItem('sb-127-auth-token', s), JSON.stringify(tok));
await ctx.route(/supabase\.co/, (r) => { console.log('BLOQUEADO', r.request().url().slice(0, 80)); return r.abort(); });
const p = await ctx.newPage();
p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 160)); });
await p.goto('http://localhost:5184/');
await p.waitForTimeout(5000);
console.log(p.url());
await p.screenshot({ path: 'capture/.out/app-0.png' });
await b.close();
