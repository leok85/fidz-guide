// Exploração de tela para escrever roteiros: entra, executa cliques e salva o print com a lista
// de botões, links e campos visíveis.
//
//   node capture/peek.mjs <email|balcao:slug:senha|app:email[:rota]> "clique:Configurações" "clique:Unidades" "print:unidades" …
//
// Ações: clique:<nome do botão>, texto:<texto a clicar>, digita:<valor> (no campo focado),
// tecla:<Escape>, espera:<ms>, rola:<px>, print:<nome> (salva e lista o que está na tela).
import { chromium } from 'playwright';
import { loginGestao } from './run.mjs';
import { mockGooglePlaces } from './google-mock.mjs';

const [who, ...actions] = process.argv.slice(2);
const app = who.startsWith('app:');
const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: app ? { width: 390, height: 844 } : { width: 1440, height: 782 },
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
  ...(app ? { isMobile: true, hasTouch: true, permissions: ['geolocation'], geolocation: { latitude: -27.5954, longitude: -48.548 } } : {}),
});
await ctx.route(/\.supabase\.co\//, (route) => route.abort());
await mockGooglePlaces(ctx);
const p = await ctx.newPage();
if (app) {
  const { loginApp } = await import('./run.mjs');
  const [, email, rota] = who.split(':');
  await loginApp(p, email, { path: rota || '/' });
} else if (who.startsWith('balcao:')) {
  const { loginBalcao } = await import('./run.mjs');
  const [, slug, senha] = who.split(':');
  await loginBalcao(p, slug, senha);
} else {
  await loginGestao(p, who);
}

async function list() {
  const items = await p.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
    const out = [];
    for (const el of document.querySelectorAll('button, a, input, textarea, select, [role="tab"], [role="option"]')) {
      if (!vis(el)) continue;
      const name = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      const extra = [el.dataset.testid && `testid=${el.dataset.testid}`, el.closest('[data-tour]')?.dataset.tour && `tour=${el.closest('[data-tour]').dataset.tour}`].filter(Boolean).join(' ');
      out.push(`${el.tagName.toLowerCase()}${el.type ? `[${el.type}]` : ''} "${name}" ${extra}`);
    }
    return out;
  });
  console.log(items.join('\n'));
}

for (const a of actions) {
  const [kind, ...rest] = a.split(':');
  const arg = rest.join(':');
  await p.waitForLoadState('networkidle').catch(() => {});
  await p.waitForTimeout(500);
  if (kind === 'clique') await p.getByRole('button', { name: arg, exact: true }).first().click();
  else if (kind === 'texto') await p.getByText(arg, { exact: true }).first().click();
  else if (kind === 'digita') await p.keyboard.type(arg, { delay: 30 });
  else if (kind === 'campo') {
    const [label, value] = arg.split('=');
    await p.getByLabel(label).first().fill(value);
  } else if (kind === 'tudo') {
    // Lista os textos visíveis da área principal, de cima a baixo (rolando), sem print.
    const texts = await p.evaluate(() => [...document.querySelectorAll('h1, h2, h3, label, button, [class*="title"], [class*="label"], [class*="hint"], [class*="detail"]')]
      .filter((el) => !el.closest('nav, aside, [class*="sidebar"]'))
      .map((el) => (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 90)).filter(Boolean));
    console.log(`\n=== textos (${arg})\n` + [...new Set(texts)].join('\n'));
  }
  else if (kind === 'tecla') await p.keyboard.press(arg);
  else if (kind === 'espera') await p.waitForTimeout(Number(arg));
  else if (kind === 'rola') await p.mouse.wheel(0, Number(arg));
  else if (kind === 'print') {
    await p.waitForTimeout(800);
    await p.screenshot({ path: `capture/.out/peek-${arg}.png` });
    console.log(`\n=== ${arg} (capture/.out/peek-${arg}.png)`);
    await list();
  }
}
await b.close();
