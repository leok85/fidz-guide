-- O balcão do Empório Bom Gosto pede para usar o cashback da Beatriz numa venda de R$ 120,00
-- (guia "Autorizar o uso do cashback no app"). O cálculo roda como ela, como no balcão.
begin;
select set_config('request.jwt.claims', '{"sub":"9e1a0000-0000-4000-8000-0000000c0001","role":"authenticated"}', true);
delete from public.redemption_requests where unit_id = 953;
insert into public.redemption_requests (card_id, program_id, unit_id, staff_id, kind, sale_amount_cents,
                                        expected_points, expected_cents, expected_discount_cents, expires_at)
select k.id, k.program_id, 953, 953, q.kind, 12000, q.points_cost, q.cashback_cents, q.discount_cents, now() + interval '30 minutes'
from public.loyalty_cards k
cross join lateral public.quote_redemption(k.id, 12000, null) q
where k.program_id = 952 and k.customer_id = (select id from public.loyalty_customers where phone_e164 = '+5511900095003');
commit;
