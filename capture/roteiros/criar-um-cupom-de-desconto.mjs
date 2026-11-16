import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
/** A chave (Toggle) de uma linha de limite do cupom, achada pelo título da linha. */
const dateField = (label) => (p) => p.getByText(label, { exact: true }).locator('xpath=..').locator('button').first();
const toggleOf = (title) => (p) => p.getByText(title, { exact: true }).locator('xpath=../..').locator('button').first();

export default {
  slug: 'criar-um-cupom-de-desconto',
  section: 'fidelidades',
  order: 0,
  title: 'Criar um cupom de desconto',
  description:
    'Veja como criar um cupom na Gestão: o desconto, quando vale, se a compra também rende selo, os limites e os dias de uso, até publicar no app.',
  login: (p) => loginGestao(p, 'guia.docevida@fidz.test'),
  prepare: `delete from public.coupons where company_id = 950;`,
  steps: [
    {
      target: btn('Cupons'),
      text: 'Os cupons da sua loja ficam em Cupons, no menu lateral.',
    },
    {
      target: btn('Criar cupom'),
      text: 'Clique em Criar cupom. O cliente pega o cupom no app da Fidz e usa no balcão.',
      wait: 900,
    },
    {
      target: (p) => p.getByRole('button', { name: /^Cupom para todos/ }),
      text: 'Cupom para todos aparece na aba Cupons do app para qualquer pessoa. Indicação de cliente é para o cliente indicar um amigo.',
      act: 'none',
      wait: 900,
    },
    {
      target: (p) => p.getByRole('button', { name: /^Desconto em %/ }),
      text: 'Escolha o que o cliente ganha: desconto em porcentagem, desconto em reais ou um brinde.',
      act: 'none',
    },
    {
      target: (p) => p.locator('[data-tour="coupon-form.reward"] input').first(),
      text: 'Digite o percentual de desconto. É quanto o cliente economiza ao usar o cupom.',
      act: (p, loc) => loc.fill('15'),
    },
    {
      target: (p) => p.getByRole('radio', { name: /Data de início e fim/ }),
      text: 'Em Quando vale, o cupom pode ficar sem data de término ou ter data de início e fim. Com datas, ele entra e sai do app sozinho.',
      act: 'none',
    },
    {
      target: dateField('Começa em'),
      text: 'Clique em Começa em para escolher o primeiro dia. Nesse dia o cupom aparece no app.',
    },
    {
      target: (p) => p.getByRole('dialog', { name: 'Começa em' }).getByRole('button', { name: '20', exact: true }),
      text: 'Escolha o dia no calendário. Aqui, dia 20.',
    },
    {
      target: dateField('Termina em'),
      text: 'Agora clique em Termina em. No último dia, o cupom some do app sozinho.',
    },
    {
      target: (p) => p.getByRole('dialog', { name: 'Termina em' }).getByRole('button', { name: 'Próximo mês' }),
      text: 'Vai durar mais de um mês? Use a seta para avançar no calendário.',
    },
    {
      target: (p) => p.getByRole('dialog', { name: 'Termina em' }).getByRole('button', { name: '20', exact: true }),
      text: 'Escolha o dia 20 para encerrar o cupom.',
    },
    {
      target: (p) => p.locator('[data-tour="coupon-form.earns-loyalty"]'),
      text: 'Quer que a compra com o cupom também renda selo? Ligue esta opção em Fidelidade.',
    },
    {
      target: toggleOf('Limite de usos'),
      text: 'Ative Limite de usos. Quando acabar, o cupom aparece como esgotado no app.',
    },
    {
      target: (p) => p.getByLabel('Limite de usos'),
      text: 'Defina quantos cupons existem. Com 100, ele vale para os 100 primeiros que usarem no balcão.',
      act: (p, loc) => loc.fill('100'),
    },
    {
      target: toggleOf('Valor mínimo da compra'),
      text: 'Quer exigir uma compra mínima? Ative Valor mínimo da compra. Abaixo dele, o balcão não aplica o cupom.',
    },
    {
      target: toggleOf('Dias da semana'),
      text: 'Ative Dias da semana para o cupom valer só nos dias mais parados.',
    },
    {
      target: (p) => p.getByText('Dias da semana', { exact: true }).locator('xpath=..').getByRole('button', { name: 'Ter', exact: true }),
      text: 'Marque Ter para o cupom valer às terças-feiras.',
    },
    {
      target: (p) => p.locator('[data-tour="coupon-form.publish"]'),
      text: 'Pronto: clique em Publicar cupom. Ele aparece na aba Cupons do app.',
    },
    {
      target: (p) => p.getByText('15%').first(),
      text: 'O cupom já está na lista, com quantos foram pegos e usados. Dá para editar ou encerrar quando quiser.',
      act: 'none',
      toast: true,
      wait: 1500,
    },
  ],
};
