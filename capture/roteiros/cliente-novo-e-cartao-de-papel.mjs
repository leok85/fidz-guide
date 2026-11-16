import { loginBalcao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const texto = (t) => (p) => p.getByText(t, { exact: true });
const FONE = '+5511987654321';

export default {
  slug: 'cliente-novo-e-cartao-de-papel',
  section: 'balcao',
  order: 2,
  title: 'Cadastrar cliente novo e trazer o cartão de papel',
  description:
    'Veja como o balcão cadastra um cliente só com o celular e como somar no cartão digital os selos que ele já tinha no cartão de papel.',
  login: (p) => loginBalcao(p, 'doce-vida-centro', 'DOCE-V26'),
  prepare: `delete from public.loyalty_events where card_id in (select k.id from public.loyalty_cards k join public.loyalty_customers c on c.id = k.customer_id where c.phone_e164 = '${FONE}');
            delete from public.loyalty_cards where customer_id in (select id from public.loyalty_customers where phone_e164 = '${FONE}');
            delete from public.loyalty_customers where phone_e164 = '${FONE}';`,
  steps: [
    {
      target: texto('Ana Paula'),
      text: 'Toque no seu nome para começar a atender.',
      wait: 1200,
    },
    {
      target: (p) => p.getByLabel('Celular do cliente'),
      text: 'Cliente novo entra só com o celular. Digite o número com DDD.',
      act: (p, loc) => loc.fill('11987654321'),
      wait: 1200,
    },
    {
      target: btn('Buscar cliente'),
      text: 'Toque em Buscar cliente.',
    },
    {
      target: (p) => p.getByPlaceholder('Como ele quer ser chamado'),
      text: 'O número ainda não está na Fidz, então abre uma ficha nova. O nome é opcional: pergunte como ele quer ser chamado.',
      act: (p, loc) => loc.fill('Otávio'),
      wait: 1200,
    },
    {
      target: texto('Migrar cartão de papel'),
      text: 'Ele tinha um cartão de papel da loja? Toque em Migrar cartão de papel.',
    },
    {
      target: (p) => p.getByText(/^\d+ selos?$/).first(),
      text: 'Conte os selos do papel e ajuste com o menos e o mais. A loja define o máximo que aceita do papel.',
      act: 'none',
      wait: 1200,
    },
    {
      target: (p) => p.getByText(/^Migrar \d+ selos?$/),
      text: 'Toque em Migrar. Fica registrado no seu nome e o cliente recebe um aviso no app.',
    },
    {
      target: texto('Adicionar selo'),
      text: 'Os selos do papel já estão no cartão. Agora registre a compra de hoje em Adicionar selo.',
      wait: 1500,
    },
    {
      target: texto('Selo registrado'),
      text: 'Pronto: o Otávio já tem cartão digital, com os selos do papel e o de hoje. Na próxima compra, basta o celular.',
      act: 'none',
      wait: 1200,
    },
  ],
};
