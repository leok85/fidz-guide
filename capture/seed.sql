-- Lojas de demonstração dos guias, no fidz-local (supabase local da Gestão).
-- Rodar de novo apaga e recria tudo: npm run capture:seed
--
--   950 Doce Vida Confeitaria  selos ativo, 2 unidades, equipe, 30 clientes com histórico
--   951 Café Grão da Serra     sem fidelidade: os guias de criar selos, pontos e cashback
--   952 Empório Bom Gosto      cashback ativo: o balcão de cashback
--
-- Dono: senha Fidz-guia-2026. Balcão: login_slug + senha fixa (abaixo), para a captura entrar sozinha.

begin;

create temporary table guia_owner (
  id uuid, email text, name text, company_id bigint, company_name text, plan_id bigint, category_id bigint
) on commit drop;
insert into guia_owner values
  ('9e1a0000-0000-4000-8000-000000000950', 'guia.docevida@fidz.test', 'Helena Duarte', 950, 'Doce Vida Confeitaria', 902, 902),
  ('9e1a0000-0000-4000-8000-000000000951', 'guia.graodaserra@fidz.test', 'Rogério Serra', 951, 'Café Grão da Serra', 901, 902),
  ('9e1a0000-0000-4000-8000-000000000952', 'guia.bomgosto@fidz.test', 'Sandra Gusmão', 952, 'Empório Bom Gosto', 901, 902);

-- Limpa a rodada anterior. Os dados de cliente (loyalty_customers) ficam: o telefone é a chave da
-- plataforma e o semeador reaproveita a mesma pessoa.
delete from public.loyalty_events where card_id in (
  select k.id from public.loyalty_cards k join public.loyalty_programs p on p.id = k.program_id where p.company_id between 950 and 952);
delete from public.loyalty_cards where program_id in (select id from public.loyalty_programs where company_id between 950 and 952);
delete from public.loyalty_rewards where program_id in (select id from public.loyalty_programs where company_id between 950 and 952);
delete from public.loyalty_programs where company_id between 950 and 952;
delete from public.coupon_redemptions where coupon_id in (select id from public.coupons where company_id between 950 and 952);
delete from public.coupon_claims where coupon_id in (select id from public.coupons where company_id between 950 and 952);
delete from public.merchant_support_ticket_messages where ticket_id in (select id from public.merchant_support_tickets where company_id between 950 and 952);
delete from public.merchant_support_tickets where company_id between 950 and 952;
delete from public.team_members where company_id between 950 and 952;
delete from public.affiliate_commissions where affiliate_id = 950 or company_id between 950 and 952;
delete from public.affiliate_withdrawals where affiliate_id = 950;
delete from public.company_referrals where affiliate_id = 950 or company_id between 950 and 952;
delete from public.invoices where company_id between 950 and 952;
-- Vínculos login × empresa (merchant_memberships) e perfis dos donos dos guias. O perfil sai pelo id:
-- merchant_users.company_id pode estar nulo (apagar a empresa não leva mais o perfil junto).
delete from public.merchant_memberships where company_id between 950 and 952 or user_id in (select id from guia_owner);
delete from public.merchant_users where id in (select id from guia_owner) or company_id between 950 and 952;
delete from public.company_units where company_id between 950 and 952;
delete from public.companies where id between 950 and 952;
-- Contas dos donos ficam de uma rodada para a outra: o aceite dos termos não se apaga.
delete from auth.identities where user_id in (select id from auth.users where email like '%-guia@balcao.internal');
delete from auth.users where email like '%-guia@balcao.internal';

-- Donos
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change,
                        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
       extensions.crypt('Fidz-guia-2026', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', jsonb_build_object('app', 'merchant', 'name', name),
       now() - interval '200 days', now(), '', '', '', '', '', '', '', ''
from guia_owner
on conflict (id) do update set encrypted_password = excluded.encrypted_password;
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now()
from guia_owner
on conflict do nothing;

-- is_demo fica ligado só durante o semeador (mais abaixo).
insert into public.companies (id, name, initials, status, plan_id, category_id, billing_cycle, is_demo, created_at, trial_ends_at)
overriding system value
select company_id, company_name, upper(left(company_name, 1) || left(split_part(company_name, ' ', 2), 1)), 'active',
       plan_id, category_id, 'mensal', false, now() - interval '200 days', now() - interval '170 days'
from guia_owner;

update public.companies
   set invoice_legal_name = 'Doce Vida Confeitaria LTDA',
       cnpj = '11.222.333/0001-81',
       payment_method = 'boleto',
       next_billing_date = current_date + 12,
       profile_phone = '4832224455',
       customer_since = current_date - 200
 where id = 950;

insert into public.merchant_users (id, company_id, name, role, whatsapp, onboarding_seen_at)
select id, company_id, name, 'owner', '4899' || lpad(company_id::text, 7, '0'), now() - interval '100 days'
from guia_owner;

-- O gatilho de merchant_users já grava o vínculo; fica explícito para quando a coluna company_id sair.
insert into public.merchant_memberships (user_id, company_id, role, status)
select id, company_id, 'owner', 'active' from guia_owner
on conflict (user_id, company_id) do nothing;

insert into public.legal_acceptances (user_id, party, document_id, version, channel)
select o.id, 'merchant', d.id, d.current_version, 'painel'
from guia_owner o cross join public.legal_documents d
where d.audience in ('merchant', 'both')
  and not exists (select 1 from public.legal_acceptances a
                  where a.user_id = o.id and a.document_id = d.id and a.version = d.current_version);

insert into public.company_units (id, company_id, name, address, team_size, is_hq, phone)
overriding system value values
  (950, 950, 'Loja Centro', 'Rua Felipe Schmidt, 210 - Centro, Florianópolis - SC', 2, true, '(48) 3222-4455'),
  (951, 950, 'Loja Shopping', 'Av. Rio Branco, 450 - Centro, Florianópolis - SC', 1, false, '(48) 3222-4466'),
  (952, 951, 'Loja Centro', 'Rua Tiradentes, 80 - Centro, Florianópolis - SC', 1, true, null),
  (953, 952, 'Loja Centro', 'Rua Conselheiro Mafra, 300 - Centro, Florianópolis - SC', 1, true, null);

-- Unidades da Doce Vida já ligadas ao Google (os detalhes vêm de capture/google-mock.mjs).
update public.company_units set google_place_id = 'ChIJGuiaFidzDoceVidaCentr1', maps_url = 'https://maps.google.com/?cid=ChIJGuiaFidzDoceVidaCentr1' where id = 950;
update public.company_units
   set opening_hours = '{"1":[["09:00","19:00"]],"2":[["09:00","19:00"]],"3":[["09:00","19:00"]],"4":[["09:00","19:00"]],"5":[["09:00","19:00"]],"6":[["09:00","14:00"]]}'
 where id in (950, 951);
-- Coordenadas no centro de Florianópolis: a aba Descobrir e os cupons do app usam a distância.
update public.company_units set lat = -27.5969, lng = -48.5495 where id in (950, 952);
update public.company_units set lat = -27.5925, lng = -48.5530 where id = 951;
update public.company_units set lat = -27.5960, lng = -48.5520 where id = 953;
update public.company_units set google_place_id = 'ChIJGuiaFidzDoceVidaShopp1', maps_url = 'https://maps.google.com/?cid=ChIJGuiaFidzDoceVidaShopp1' where id = 951;

insert into public.team_members (id, company_id, unit_id, name)
overriding system value values
  (950, 950, 950, 'Ana Paula'),
  (951, 950, 950, 'Marcos Lima'),
  (952, 950, 951, 'Júlia Prado'),
  (953, 952, 953, 'Ana Paula'),
  (954, 952, 953, 'Bruno Teixeira');

-- Acesso do balcão de cada unidade, com senha fixa.
create temporary table guia_balcao (unit_id bigint, slug text, senha text) on commit drop;
insert into guia_balcao values
  (950, 'doce-vida-centro', 'DOCE-V26'),
  (951, 'doce-vida-shopping', 'DOCE-S26'),
  (952, 'grao-da-serra', 'GRAO-S26'),
  (953, 'bom-gosto', 'BOMG-C26');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change,
                        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
select gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       b.slug || '-guia@balcao.internal', extensions.crypt(b.senha, extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}',
       jsonb_build_object('app', 'merchant', 'role', 'balcao', 'unit_id', b.unit_id),
       now(), now(), '', '', '', '', '', '', '', ''
from guia_balcao b;
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select u.id::text, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', now(), now()
from auth.users u where u.email like '%-guia@balcao.internal';

update public.company_units cu
   set login_slug = b.slug,
       balcao_login_email = b.slug || '-guia@balcao.internal',
       balcao_auth_id = (select id from auth.users where email = b.slug || '-guia@balcao.internal'),
       balcao_password_plain = b.senha,
       balcao_password_changed_at = now() - interval '30 days'
  from guia_balcao b
 where cu.id = b.unit_id;

-- Fidelidades
insert into public.loyalty_programs
  (id, company_id, type, name, reward_text, stamp_goal, earn_method, require_sale_amount,
   redemption_validation, migration_enabled, migration_cap, status, start_date)
overriding system value values
  (950, 950, 'selos', 'Cartão Doce Vida', 'Uma fatia de bolo', 10, 'per_visit', false, 'app_confirm', true, 'half', 'active', current_date - 180);

insert into public.loyalty_programs
  (id, company_id, type, name, reward_text, cashback_pct, cashback_min_purchase_cents, cashback_max_pct_of_sale,
   cashback_expire_days, cashback_earns_on_redeem_purchase, expire_rule_since, status, start_date)
overriding system value values
  (952, 952, 'cashback', 'Cashback', '', 10, 3000, 30, 90, true, now() - interval '180 days', 'active', current_date - 180);

update public.companies set is_demo = true where id in (950, 952);
select public.seed_demo_program(id) from public.loyalty_programs where id in (950, 952) order by id;
update public.companies set is_demo = false where id in (950, 952);
-- O semeador reparte a equipe sem olhar a unidade: cada selo fica com alguém da unidade dele.
update public.loyalty_events e
   set staff_id = case when e.unit_id = 951 then 952 when e.id % 2 = 0 then 950 else 951 end
  from public.loyalty_cards k
 where k.id = e.card_id and k.program_id = 950 and e.staff_id is not null;
update public.loyalty_events e
   set staff_id = 953
  from public.loyalty_cards k
 where k.id = e.card_id and k.program_id = 952 and e.staff_id is not null;


-- Movimento de hoje e clientes novos na Doce Vida: a Visão geral (filtro Hoje, Clientes novos,
-- Atividade do balcão) não fica vazia no guia.
insert into public.loyalty_customers (name, phone_e164, phone_country, created_at)
select n, '+55119009' || lpad(i::text, 5, '0'), 'BR', now() - make_interval(days => d)
from (values (1, 'Paula Ribeiro', 2), (2, 'Diego Fontes', 5), (3, 'Mirela Campos', 9), (4, 'Caio Bastos', 0)) v(i, n, d)
on conflict (phone_e164) do nothing;

insert into public.loyalty_cards (program_id, customer_id, unit_id, stamps_balance, points_balance, cashback_balance_cents, status, created_at)
select 950, c.id, case when c.name in ('Diego Fontes') then 951 else 950 end, 0, 0, 0, 'active', c.created_at
from public.loyalty_customers c
where c.phone_e164 like '+55119009%'
on conflict do nothing;

insert into public.loyalty_events (card_id, unit_id, staff_id, kind, stamps_delta, created_at)
select k.id, k.unit_id, case when k.unit_id = 951 then 952 else 950 end, 'stamp', 1, k.created_at + interval '1 minute'
from public.loyalty_cards k join public.loyalty_customers c on c.id = k.customer_id
where k.program_id = 950 and c.phone_e164 like '+55119009%';

-- Selos de hoje, de manhã até agora, para clientes antigos.
insert into public.loyalty_events (card_id, unit_id, staff_id, kind, stamps_delta, created_at)
select k.id, k.unit_id, case when k.unit_id = 951 then 952 when x.n % 2 = 0 then 950 else 951 end, 'stamp', 1,
       date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
         + make_interval(hours => 9) + (now() - (date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo') - interval '9 hours') * x.n / 8.0
from (select k.*, row_number() over (order by k.id) n from public.loyalty_cards k where k.program_id = 950 and k.stamps_balance < 8) k
join generate_series(1, 7) x(n) on x.n = k.n;

-- Atendimentos de hoje no Empório Bom Gosto, espalhados pela manhã: a lista "Atendidos agora há
-- pouco" do balcão mostra horários de verdade.
insert into public.loyalty_events (card_id, unit_id, staff_id, kind, stamps_delta, cashback_cents_delta, amount_cents, created_at)
select k.id, k.unit_id, case when x.n % 2 = 0 then 953 else 954 end, 'cashback_earn', 0, x.v / 10, x.v,
       date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo' + make_interval(hours => 8, mins => x.n * 47)
from (select k.*, row_number() over (order by k.id desc) n from public.loyalty_cards k where k.program_id = 952) k
join (values (1, 8650), (2, 4200), (3, 12900), (4, 3100), (5, 6400)) x(n, v) on x.n = k.n;

-- Cupons da Doce Vida no app (o guia de criar cupom apaga e cria o dele).
delete from public.coupons where company_id between 950 and 952;
insert into public.coupons (company_id, kind, percent_off, gift_text, starts_on, ends_on, quantity_limit, min_purchase_cents, earns_loyalty)
values (950, 'percent', 15, null, current_date - 2, current_date + 25, 100, 3000, true),
       (950, 'gift', null, 'Um brigadeiro gourmet', current_date - 5, current_date + 10, 40, null, false);

-- Cliente com conta no app (guias do app do cliente): Beatriz Nunes, com cartão na Doce Vida e no
-- Empório Bom Gosto. A conta fica de uma rodada para a outra (o aceite dos termos não se apaga).
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change,
                        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('9e1a0000-0000-4000-8000-0000000c0001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'beatriz.nunes@fidz.test', extensions.crypt('Fidz-guia-2026', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"name":"Beatriz Nunes"}',
        now() - interval '150 days', now(), '', '', '', '', '', '', '', '')
on conflict (id) do update set encrypted_password = excluded.encrypted_password;
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
values ('9e1a0000-0000-4000-8000-0000000c0001', '9e1a0000-0000-4000-8000-0000000c0001',
        '{"sub":"9e1a0000-0000-4000-8000-0000000c0001","email":"beatriz.nunes@fidz.test","email_verified":true}', 'email', now(), now())
on conflict do nothing;

insert into public.customer_profiles (id, name, email, phone_e164, phone_country, age_group, age_declared_at, language, marketing_asked_at)
values ('9e1a0000-0000-4000-8000-0000000c0001', 'Beatriz Nunes', 'beatriz.nunes@fidz.test', '+5511900095003', 'BR',
        'adult', now() - interval '150 days', 'pt', now() - interval '150 days')
on conflict (id) do update set phone_e164 = excluded.phone_e164, name = excluded.name;

insert into public.legal_acceptances (user_id, party, document_id, version, channel)
select '9e1a0000-0000-4000-8000-0000000c0001', 'customer', d.id, d.current_version, 'app'
from public.legal_documents d
where d.audience in ('customer', 'both')
  and not exists (select 1 from public.legal_acceptances a
                  where a.user_id = '9e1a0000-0000-4000-8000-0000000c0001' and a.document_id = d.id and a.version = d.current_version);

-- O cartão do Empório Bom Gosto que o semeador deu a outra "Beatriz Nunes" passa para ela.
update public.loyalty_cards k
   set customer_id = (select id from public.loyalty_customers where phone_e164 = '+5511900095003')
 where k.program_id = 952
   and k.customer_id = (select id from public.loyalty_customers where phone_e164 = '+5511900095203');

insert into public.invoices (company_id, amount, status, due_date, paid_at, created_at) values
  (950, 199, 'paid', current_date - 18, now() - interval '18 days', now() - interval '23 days'),
  (950, 199, 'paid', current_date - 48, now() - interval '48 days', now() - interval '53 days');

-- Afiliado do guia (painel de afiliados): Lucas Andrade, PJ, que indicou as três lojas de
-- demonstração. Comissões já liberadas (disponível para saque) e em carência.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change,
                        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('9e1a0000-0000-4000-8000-0000000a0950', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'afiliado.guia@fidz.test', extensions.crypt('Fidz-guia-2026', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{"app":"affiliate","name":"Lucas Andrade"}',
        now() - interval '120 days', now(), '', '', '', '', '', '', '', '')
on conflict (id) do nothing;
insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
values ('9e1a0000-0000-4000-8000-0000000a0950', '9e1a0000-0000-4000-8000-0000000a0950',
        '{"sub":"9e1a0000-0000-4000-8000-0000000a0950","email":"afiliado.guia@fidz.test","email_verified":true}', 'email', now(), now())
on conflict do nothing;

insert into public.affiliates (id, user_id, person_type, name, legal_name, cnpj, cnae, city, whatsapp, email, pix_key, code, status, terms_version, terms_accepted_at, created_at)
overriding system value
values (950, '9e1a0000-0000-4000-8000-0000000a0950', 'PJ', 'Lucas Andrade', 'Andrade Consultoria em Marketing LTDA',
        '36958124000121', '7319002', 'Florianópolis', '48999990950', 'afiliado.guia@fidz.test', 'afiliado.guia@fidz.test',
        'LUCAS10', 'active', (select max(terms_version) from public.affiliates), now() - interval '120 days', now() - interval '120 days')
on conflict (id) do nothing;

insert into public.company_referrals (company_id, affiliate_id, via, created_at) values
  (950, 950, 'link', now() - interval '200 days'),
  (951, 950, 'code', now() - interval '45 days'),
  (952, 950, 'link', now() - interval '20 days');

insert into public.invoices (company_id, amount, status, due_date, paid_at, created_at) values
  (951, 99, 'paid', current_date - 40, now() - interval '40 days', now() - interval '45 days'),
  (952, 99, 'paid', current_date - 10, now() - interval '10 days', now() - interval '15 days');

-- 1ª mensalidade inteira, depois 10% das seguintes; libera 30 dias depois do pagamento. As faturas
-- da Doce Vida entraram antes da indicação, então a comissão delas vem daqui.
insert into public.affiliate_commissions (affiliate_id, company_id, invoice_id, kind, installments, first_installment, base_amount, amount, releases_at, created_at)
select 950, i.company_id, i.id, x.kind, 1, x.parcela, i.amount, x.valor, i.paid_at + interval '30 days', i.paid_at
from public.invoices i
join (values (950, 48, 'first', 1, 199.00), (950, 18, 'recurring', 2, 19.90),
             (951, 40, 'first', 1, 99.00), (952, 10, 'first', 1, 99.00)) x(empresa, dias, kind, parcela, valor)
  on x.empresa = i.company_id and i.due_date = current_date - x.dias
-- as faturas novas já ganham a comissão pelo gatilho do banco
where not exists (select 1 from public.affiliate_commissions c where c.invoice_id = i.id);

commit;
