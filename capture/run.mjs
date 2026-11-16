#!/usr/bin/env node
// Captura de guias: roda o roteiro de cada guia na Gestão e no balcão locais (fidz-local),
// tira os prints, mede o hotspot no elemento real, gera a narração com o Piper e regrava o guia
// em content/guide.json.
//
//   node capture/run.mjs gerenciar-unidades-e-equipe [outro-slug…]
//   node capture/run.mjs --all
//
// Pré-requisitos: fidz-local de pé, Gestão em GESTAO_URL e balcão em BALCAO_URL (README, "Capturar").

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { mockGooglePlaces } from './google-mock.mjs';
import { mockCustomerSession } from './customer-session-local.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'public', 'media');
const GUIDE_FILE = path.join(ROOT, 'content', 'guide.json');
const ROTEIROS = path.join(ROOT, 'capture', 'roteiros');
const TMP = path.join(ROOT, 'capture', '.out');
const PY = path.join(ROOT, 'capture', '.venv', 'bin', 'python');
const VOICE = path.join(ROOT, 'capture', 'voices', 'pt_BR-faber-medium.onnx');

export const GESTAO_URL = process.env.GESTAO_URL ?? 'http://localhost:5181';
export const BALCAO_URL = process.env.BALCAO_URL ?? 'http://localhost:5182';
const DB_CONTAINER = process.env.DB_CONTAINER ?? 'supabase_db_fidz-local';
const LOCAL_API = process.env.LOCAL_API ?? 'http://127.0.0.1:54421';
const MAILPIT = process.env.MAILPIT ?? 'http://127.0.0.1:54324';

// Padrão de todos os prints do guia: 2880×1564 (1440×782 em tela 2x).
const VIEWPORT = { width: 1440, height: 782 };
const SCALE = 2;

// App do cliente: tela de celular, centralizada numa moldura do mesmo tamanho dos outros prints.
const PHONE = { width: 390, height: 844 };
const PHONE_FRAME = (() => {
  const height = 702; // altura do celular na moldura, em px da janela de 1440×782
  const width = (height * PHONE.width) / PHONE.height;
  return { width, height, left: (VIEWPORT.width - width) / 2, top: (VIEWPORT.height - height) / 2 };
})();
export const APP_URL = process.env.APP_URL ?? 'http://localhost:5184';
export const AFILIADOS_URL = process.env.AFILIADOS_URL ?? 'http://localhost:5185';

// ---------- banco ----------

export function sql(text) {
  execFileSync('docker', ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'], {
    input: text,
    stdio: ['pipe', 'ignore', 'inherit'],
  });
}

/** Um valor do banco (primeira coluna da primeira linha). */
export function sqlValue(query) {
  return execFileSync('docker', ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-c', query])
    .toString().trim().split('\n')[0];
}

async function seed() {
  sql(await fs.readFile(path.join(ROOT, 'capture', 'seed.sql'), 'utf8'));
}

// ---------- login ----------

export async function loginGestao(page, email) {
  await page.goto(`${GESTAO_URL}/login`);
  await page.getByPlaceholder('nome@sualoja.com.br').fill(email);
  await page.getByPlaceholder('Sua senha').fill('Fidz-guia-2026');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('button', { name: 'Visão geral', exact: true }).waitFor();
  await page.waitForLoadState('networkidle');
}

/** Entra no balcão com o acesso da unidade (capture/seed.sql). `preencher: false` para o roteiro mostrar o login. */
export async function loginBalcao(page, slug, senha, { preencher = true } = {}) {
  await page.goto(`${BALCAO_URL}/`);
  await page.getByPlaceholder('nome-da-unidade').waitFor();
  if (!preencher) return;
  await page.getByPlaceholder('nome-da-unidade').fill(slug);
  await page.getByPlaceholder('Senha que o dono passou').fill(senha);
  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState('networkidle');
}

/**
 * Entra no app do cliente (build web, capture/.out/app-web) com a conta do seed: pega a sessão no
 * fidz-local e a deixa no armazenamento antes de o app carregar, como quem já tinha entrado.
 */
export async function loginApp(page, email, { path: route = '/' } = {}) {
  const key = execFileSync('supabase', ['status', '-o', 'env', '--workdir', path.join(ROOT, '..', 'fidz-client-admin')], {
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString().match(/^PUBLISHABLE_KEY="([^"]+)"/m)[1];
  const res = await fetch(`${LOCAL_API}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'Fidz-guia-2026' }),
  });
  const session = await res.json();
  if (!session.access_token) throw new Error(`login no app falhou: ${JSON.stringify(session)}`);
  await page.context().addInitScript(([k, v]) => localStorage.setItem(k, v), ['sb-127-auth-token', JSON.stringify(session)]);
  await page.goto(`${APP_URL}${route}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Entra no painel de afiliados pelo código de e-mail, que no fidz-local cai no Mailpit.
 * `preencher: false` só abre a tela de login (guia de primeiro acesso).
 */
export async function loginAfiliado(page, email, { preencher = true } = {}) {
  await limparEmails(email);
  await page.goto(`${AFILIADOS_URL}/login`);
  await page.waitForLoadState('networkidle');
  if (!preencher) return;
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('button', { name: 'Receber código' }).click();
  const codigo = await codigoDoEmail(email);
  await page.getByLabel('Código de 6 dígitos').fill(codigo);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}

/** Abre o app sem sessão, na tela de entrada (guia de entrar e criar conta). */
export async function abrirApp(page, rota = '/entrada') {
  await page.goto(`${APP_URL}${rota}`);
  await page.waitForLoadState('networkidle');
}

/** Último código de 6 dígitos enviado ao e-mail, lido do Mailpit do fidz-local. */
export async function codigoDoEmail(email, { tentativas = 20 } = {}) {
  for (let i = 0; i < tentativas; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`);
    const { messages } = await res.json();
    if (messages?.length) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json();
      const code = (msg.Text || msg.HTML || '').match(/\b(\d{6})\b/);
      if (code) return code[1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`nenhum código chegou para ${email}`);
}

/** Apaga do Mailpit os e-mails de um endereço (o próximo código é o único). */
export async function limparEmails(email) {
  await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`, { method: 'DELETE' });
}

/** Moldura do print do celular: fundo lilás, cantos arredondados e sombra, em 2880×1564. */
async function framePhone(browser, png) {
  const f = PHONE_FRAME;
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: SCALE });
  await page.setContent(`<style>
    html,body{margin:0;width:${VIEWPORT.width}px;height:${VIEWPORT.height}px;background:#EFEAF8;overflow:hidden}
    img{position:absolute;left:${f.left}px;top:${f.top}px;width:${f.width}px;height:${f.height}px;
        border-radius:34px;box-shadow:0 0 0 7px #1E1530,0 24px 60px rgba(60,30,110,.28)}
  </style><img src="data:image/png;base64,${png.toString('base64')}">`);
  await page.locator('img').evaluate((img) => img.decode());
  const jpg = await page.screenshot({ type: 'jpeg', quality: 88 });
  await page.close();
  return jpg;
}

/**
 * Câmera do player nos guias do app: aproxima o celular (56% da moldura, mesma proporção) e
 * acompanha o hotspot na vertical, para a tela do app ficar legível sem mudar o tamanho do print.
 */
function phoneZoom(hotspot) {
  const size = 56;
  const y = Math.min(Math.max((hotspot?.y ?? 50) - size / 2, 0), 100 - size);
  return { x: 50 - size / 2, y, w: size, h: size };
}

/** Caixa do elemento na tela do celular → caixa na moldura. */
function phoneToFrame(box) {
  if (!box) return box;
  const f = PHONE_FRAME;
  const s = f.height / PHONE.height;
  return { x: f.left + box.x * s, y: f.top + box.y * s, width: box.width * s, height: box.height * s };
}

// ---------- mídia ----------

function hashName(buf, ext) {
  return `${createHash('sha1').update(buf).digest('hex').slice(0, 16)}.${ext}`;
}

async function saveMedia(buf, ext) {
  const name = hashName(buf, ext);
  await fs.writeFile(path.join(MEDIA_DIR, name), buf);
  return `/media/${name}`;
}

function probeDuration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return Number(String(out).trim());
}

function vtt(text, duration) {
  const t = (s) => {
    const ms = Math.round(s * 1000);
    const hh = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const mm = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    return `${hh}:${mm}:${ss}.${String(ms % 1000).padStart(3, '0')}`;
  };
  return `WEBVTT\n\n00:00:00.000 --> ${t(duration)}\n${text}\n`;
}

/** Narração de todos os passos de uma vez (o Piper carrega a voz uma só vez). */
async function narrate(texts) {
  await fs.mkdir(TMP, { recursive: true });
  const items = texts.map((text, i) => ({ text, out: path.join(TMP, `n${i}.wav`) }));
  const r = spawnSync(PY, [path.join(ROOT, 'capture', 'tts.py'), VOICE], { input: JSON.stringify({ items }), stdio: ['pipe', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error('Piper falhou');
  const result = [];
  for (const it of items) {
    const mp3 = it.out.replace(/\.wav$/, '.mp3');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', it.out, '-ac', '1', '-b:a', '64k', mp3]);
    const duration = probeDuration(mp3);
    result.push({
      audio: await saveMedia(await fs.readFile(mp3), 'mp3'),
      captions: await saveMedia(Buffer.from(vtt(it.text, duration)), 'vtt'),
      duration,
    });
  }
  return result;
}

// ---------- captura ----------

const HIDE_CARET = `*, *::before, *::after { caret-color: transparent !important; }`;

/** Hotspot em % da tela a partir da caixa do elemento. */
function hotspotOf(box, tip) {
  const pad = 6;
  return {
    x: ((box.x + box.width / 2) / VIEWPORT.width) * 100,
    y: ((box.y + box.height / 2) / VIEWPORT.height) * 100,
    w: ((box.width + pad * 2) / VIEWPORT.width) * 100,
    h: ((box.height + pad * 2) / VIEWPORT.height) * 100,
    tip: tip ?? null,
  };
}

async function dismissToasts(page) {
  const close = page.getByRole('button', { name: /^Fechar aviso$/ });
  for (let i = await close.count(); i > 0; i--) {
    await close.first().click().catch(() => {});
    await page.waitForTimeout(250);
  }
}

async function settle(page, ms = 450) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

/**
 * Roda um roteiro. Cada passo de captura:
 *   { text, target: (page) => Locator, tip?, before?: async (page) => {}, act?: 'click' | 'none' | { fill } | async (page, loc) => {} }
 * O print sai com a tela ANTES da ação; o hotspot marca o alvo; depois a ação acontece.
 */
async function capture(roteiro) {
  if (roteiro.seed !== false) await seed();
  if (roteiro.prepare) sql(roteiro.prepare);

  const phone = roteiro.device === 'phone';
  const screen = phone ? PHONE : VIEWPORT;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: screen,
    deviceScaleFactor: SCALE,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    ...(phone
      ? { isMobile: true, hasTouch: true, permissions: ['geolocation'], geolocation: { latitude: -27.5954, longitude: -48.548 } }
      : {}),
  });
  // Nada da captura chega à produção: só o fidz-local responde.
  await context.route(/\.supabase\.co\//, (route) => route.abort());
  await mockGooglePlaces(context, roteiro.googlePlaces);
  if (roteiro.customerSession) await mockCustomerSession(context);
  const page = await context.newPage();
  await roteiro.login(page);
  await page.addStyleTag({ content: HIDE_CARET });

  const shots = [];
  try {
    for (const [i, step] of roteiro.steps.entries()) {
      if (step.before) await step.before(page);
      await settle(page, step.wait ?? 450);
      // Aviso de um passo anterior não fica no print, a menos que o passo seja a confirmação dele.
      if (!step.toast) await dismissToasts(page);
      // Só o que está visível: o app web guarda as telas anteriores escondidas na pilha.
      const loc = step.target(page).filter({ visible: true }).first();
      await loc.waitFor({ state: 'visible', timeout: 15_000 });
      await loc.scrollIntoViewIfNeeded();
      // Alvo colado na borda fica cortado no print: traz para o meio da tela.
      let box = await loc.boundingBox();
      if (box && (box.y < 90 || box.y + box.height > screen.height - (phone ? 100 : 140))) {
        await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      }
      await settle(page, 250);
      box = await loc.boundingBox();
      await page.addStyleTag({ content: HIDE_CARET });
      let jpg;
      if (phone) {
        const png = await page.screenshot({ type: 'png' });
        jpg = await framePhone(browser, png);
        box = phoneToFrame(box);
      } else {
        jpg = await page.screenshot({ type: 'jpeg', quality: 88 });
      }
      shots.push({ jpg, hotspot: hotspotOf(box, step.tip), text: step.text, displayOnly: step.act === 'none' });
      process.stdout.write(`  passo ${i + 1}/${roteiro.steps.length}\r`);

      const act = step.act ?? 'click';
      if (act === 'click') await loc.click();
      else if (typeof act === 'function') await act(page, loc);
      else if (act && act.fill !== undefined) await loc.fill(act.fill);
    }
  } catch (err) {
    await page.screenshot({ path: path.join(TMP, `erro-${roteiro.slug}.png`) }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
  return shots;
}

// ---------- guide.json ----------

function stepId(slug, i) {
  return `${slug}-${String(i).padStart(2, '0')}`;
}

async function build(roteiro, shots) {
  const voices = await narrate(shots.map((s) => s.text));
  const steps = [];
  const firstId = stepId(roteiro.slug, 1);
  steps.push({
    id: stepId(roteiro.slug, 0),
    image: null, video: null, width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE,
    audio: null, captions: null, narration: null, duration: null, hotspot: null, zoom: null,
    chapter: {
      heading: roteiro.title,
      description: roteiro.description,
      layout: 'left',
      buttons: [{ label: 'Começar', color: '#6B2EBA', textColor: '#fff', href: null, nextStep: firstId }],
    },
  });
  for (const [i, s] of shots.entries()) {
    steps.push({
      id: stepId(roteiro.slug, i + 1),
      image: await saveMedia(s.jpg, 'jpg'),
      video: null,
      width: VIEWPORT.width * SCALE,
      height: VIEWPORT.height * SCALE,
      ...voices[i],
      narration: s.text,
      hotspot: { ...s.hotspot, text: s.text, displayOnly: s.displayOnly },
      zoom: roteiro.device === 'phone' ? phoneZoom(s.hotspot) : null,
      chapter: null,
    });
  }
  return steps;
}

async function save(roteiro, steps) {
  const guide = JSON.parse(await fs.readFile(GUIDE_FILE, 'utf8'));
  let section = guide.sections.find((s) => s.slug === roteiro.section);
  if (!section) {
    section = { id: roteiro.section, slug: roteiro.section, title: roteiro.sectionTitle ?? roteiro.section, demos: [] };
    guide.sections.push(section);
  }
  // Procura o guia em qualquer assunto: o id é a chave do progresso de quem já assistiu.
  let demo;
  for (const s of guide.sections) {
    const idx = s.demos.findIndex((d) => d.slug === roteiro.slug);
    if (idx >= 0) [demo] = s.demos.splice(idx, 1);
  }
  demo ??= { id: roteiro.slug, slug: roteiro.slug };
  Object.assign(demo, {
    title: roteiro.title,
    navTitle: roteiro.title,
    description: roteiro.description,
    steps,
  });
  const at = roteiro.order ?? section.demos.length;
  section.demos.splice(Math.min(at, section.demos.length), 0, demo);
  guide.capturedAt = new Date().toISOString();
  await fs.writeFile(GUIDE_FILE, JSON.stringify(guide, null, 2) + '\n');
}

/** Apaga de public/media o que o guide.json não usa mais (prints e áudios de capturas anteriores). */
async function prune() {
  const text = await fs.readFile(GUIDE_FILE, 'utf8');
  const used = new Set([...text.matchAll(/\/media\/([\w.-]+)/g)].map((m) => m[1]));
  let removed = 0;
  for (const f of await fs.readdir(MEDIA_DIR)) {
    if (!used.has(f)) {
      await fs.unlink(path.join(MEDIA_DIR, f));
      removed++;
    }
  }
  if (removed) console.log(`  ${removed} arquivo(s) sem uso removidos de public/media`);
}

// ---------- main ----------

async function main() {
  const args = process.argv.slice(2);
  const all = (await fs.readdir(ROTEIROS)).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, ''));
  const slugs = args.includes('--all') ? all : args;
  if (!slugs.length) {
    console.log(`uso: node capture/run.mjs <slug…> | --all\nroteiros: ${all.join(', ')}`);
    process.exit(1);
  }
  await fs.mkdir(TMP, { recursive: true });
  for (const slug of slugs) {
    const { default: roteiro } = await import(path.join(ROTEIROS, `${slug}.mjs`));
    console.log(`▶ ${roteiro.title}`);
    const shots = await capture(roteiro);
    const steps = await build(roteiro, shots);
    await save(roteiro, steps);
    console.log(`✔ ${roteiro.title}: ${steps.length - 1} passos`);
  }
  await reorder(all);
  await prune();
}

/** Ordena os guias de cada assunto pelo `order` dos roteiros (guias sem roteiro ficam no fim). */
async function reorder(slugs) {
  const order = {};
  for (const slug of slugs) {
    const { default: r } = await import(path.join(ROTEIROS, `${slug}.mjs`));
    order[r.slug] = r.order ?? 999;
  }
  const guide = JSON.parse(await fs.readFile(GUIDE_FILE, 'utf8'));
  for (const section of guide.sections) {
    section.demos.sort((a, b) => (order[a.slug] ?? 999) - (order[b.slug] ?? 999));
  }
  await fs.writeFile(GUIDE_FILE, JSON.stringify(guide, null, 2) + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
