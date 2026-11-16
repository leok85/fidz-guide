import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const tour = (name) => (p) => p.locator(`[data-tour="${name}"]`);

export default {
  slug: 'criar-uma-fidelidade-de-cashback',
  section: 'fidelidades',
  order: 3,
  title: 'Criar uma fidelidade de cashback',
  description:
    'Veja como montar o cashback da loja na Gestão: quanto volta por compra, compra mínima, teto de uso, validade, como o uso é autorizado e o dia de bônus.',
  login: (p) => loginGestao(p, 'guia.graodaserra@fidz.test'),
  steps: [
    {
      target: btn('Fidelidade'),
      text: 'A fidelidade da sua loja fica em Fidelidade, no menu lateral.',
    },
    {
      target: (p) => p.getByTestId('loyalty-type-cashback'),
      text: 'Escolha Cashback: parte de cada compra volta como desconto para o cliente usar na próxima compra na loja. Não é dinheiro: só vale voltando.',
      wait: 1000,
    },
    {
      target: btn('Criar fidelidade de Cashback'),
      text: 'Clique em Criar fidelidade de Cashback para abrir as regras. Nada fica valendo até você confirmar no fim.',
    },
    {
      target: (p) => tour('cashback.pct')(p).locator('input'),
      text: 'Em Quanto volta por compra, defina o percentual que vira cashback. Aqui, 10%.',
      wait: 1000,
      act: (p, loc) => loc.fill('10'),
    },
    {
      target: (p) => tour('cashback.min')(p).getByRole('button').first(),
      text: 'Quer exigir um valor mínimo para usar o cashback? Ligue Compra mínima para usar.',
    },
    {
      target: (p) => tour('cashback.min')(p).locator('input'),
      text: 'Informe o valor mínimo da compra, em reais.',
      act: (p, loc) => loc.fill('30'),
    },
    {
      target: (p) => tour('cashback.cap')(p).getByRole('button').first(),
      text: 'Ligue Teto de uso na compra para limitar quanto da compra pode ser pago com cashback.',
    },
    {
      target: (p) => tour('cashback.cap')(p).locator('input'),
      text: 'Informe o teto em percentual. É a parte máxima da compra que o cashback cobre.',
      act: (p, loc) => loc.fill('30'),
    },
    {
      target: (p) => tour('cashback.validity')(p).getByRole('button', { name: '3 meses', exact: true }),
      text: 'Escolha a validade. Com 3 meses, o cliente é avisado 7 dias antes de o saldo vencer.',
    },
    {
      target: (p) => tour('cashback.validation')(p).getByRole('button', { name: /^O cliente autoriza no app/ }),
      text: 'Com O cliente autoriza no app, o cashback só sai depois que o cliente aceita o desconto no celular.',
      act: 'none',
    },
    {
      target: (p) => tour('cashback.bonus')(p).getByRole('button').first(),
      text: 'Quer movimentar um dia fraco? Ligue Dia de bônus para dar mais cashback num dia da semana.',
    },
    {
      target: (p) => tour('cashback.bonus')(p).getByRole('button', { name: 'Dom', exact: true }),
      text: 'Escolha o dia do bônus. Aqui, domingo.',
    },
    {
      target: (p) => tour('cashback.bonus')(p).locator('input'),
      text: 'Informe quanto volta nesse dia. O percentual do bônus precisa ser maior que o de todo dia.',
      act: (p, loc) => loc.fill('15'),
    },
    {
      target: tour('cashback.create'),
      text: 'Pronto: clique em Criar fidelidade para colocar o cashback no ar.',
    },
    {
      target: (p) => p.getByText('Cashback', { exact: true }).first(),
      text: 'O cashback está ativo. O balcão já calcula o cashback de cada venda e o cliente vê o saldo no app.',
      act: 'none',
      toast: true,
      wait: 1500,
    },
  ],
};
