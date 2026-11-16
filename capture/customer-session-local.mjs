// A função customer-session do app (login e cadastro por e-mail) só existe no projeto de produção e
// manda o código pela Resend. Na captura do guia de entrada, estas três ações são respondidas aqui,
// contra o fidz-local: nenhum e-mail sai e o usuário e o perfil são criados no banco local, como a
// função faria (fidz-app/supabase/functions/customer-session, signup-email e login-email).

import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';

const LOCAL_API = process.env.LOCAL_API ?? 'http://127.0.0.1:54421';
/** O código que o guia digita. No app de verdade, ele chega por e-mail. */
export const CODIGO_GUIA = '482913';

function serviceKey() {
  const out = execFileSync('supabase', ['status', '-o', 'env', '--workdir', path.join(import.meta.dirname, '..', '..', 'fidz-client-admin')], {
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString();
  return out.match(/^SECRET_KEY="([^"]+)"/m)?.[1] ?? out.match(/^SERVICE_ROLE_KEY="([^"]+)"/m)[1];
}

async function admin(key, method, url, body) {
  const res = await fetch(`${LOCAL_API}${url}`, {
    method,
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json', prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function mockCustomerSession(context) {
  const key = serviceKey();
  await context.route(/\/functions\/v1\/customer-session$/, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors() });
    const body = req.postDataJSON() ?? {};
    const reply = (status, json) => route.fulfill({ status, headers: cors(), contentType: 'application/json', body: JSON.stringify(json) });
    const email = (body.email ?? '').trim().toLowerCase();

    if (body.action === 'send-email-code' || body.action === 'send-code' || body.action === 'next-channel') {
      return reply(200, { ok: true, channel: 'sms' });
    }

    if (body.action === 'check') {
      const rows = await admin(key, 'GET', `/rest/v1/customer_profiles?select=id&phone_e164=eq.${encodeURIComponent(body.phone_e164)}`);
      return reply(200, { exists: rows.length > 0 });
    }

    // Associa o celular verificado à conta de quem chamou (o gatilho do perfil liga os cartões
    // que o balcão já tinha nesse número).
    if (body.action === 'link-phone' || body.action === 'change-phone') {
      if (body.code !== CODIGO_GUIA) return reply(400, { error: 'invalid_code' });
      const token = (req.headers().authorization ?? '').replace(/^Bearer /, '');
      const user = await (await fetch(`${LOCAL_API}/auth/v1/user`, { headers: { apikey: key, authorization: `Bearer ${token}` } })).json();
      if (!user?.id) return reply(401, { error: 'not authenticated' });
      await admin(key, 'PATCH', `/rest/v1/customer_profiles?id=eq.${user.id}`, {
        phone_e164: body.phone_e164 ?? body.new_phone_e164,
        phone_country: body.phone_country ?? body.new_phone_country ?? 'BR',
      });
      return reply(200, { ok: true });
    }

    if (body.action === 'login-email' || body.action === 'signup-email') {
      if (body.code !== CODIGO_GUIA) return reply(400, { error: 'invalid_code' });
      const [profile] = await admin(key, 'GET', `/rest/v1/customer_profiles?select=id&email=eq.${encodeURIComponent(email)}`);
      const password = randomBytes(18).toString('base64url');

      if (body.action === 'login-email') {
        if (!profile) return reply(404, { error: 'no_account' });
        const user = await admin(key, 'PUT', `/auth/v1/admin/users/${profile.id}`, { password });
        return reply(200, { email: user.email, password });
      }

      if (profile) return reply(409, { error: 'account_exists' });
      const authEmail = `cliente-${randomUUID()}@example.invalid`;
      const user = await admin(key, 'POST', '/auth/v1/admin/users', {
        email: authEmail, password, email_confirm: true, user_metadata: { app: 'customer' },
      });
      await admin(key, 'POST', '/rest/v1/customer_profiles', {
        id: user.id, name: body.name, language: 'pt', email,
        age_group: body.age_group, age_declared_at: new Date().toISOString(),
      });
      return reply(200, { email: authEmail, password });
    }

    return reply(400, { error: `ação ${body.action} não simulada na captura` });
  });
}

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
  };
}
