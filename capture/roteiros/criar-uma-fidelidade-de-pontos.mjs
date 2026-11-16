import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const tour = (name) => (p) => p.locator(`[data-tour="${name}"]`);

export default {
  slug: 'criar-uma-fidelidade-de-pontos',
  section: 'fidelidades',
  order: 2,
  title: 'Criar uma fidelidade de pontos',
  description:
    'Veja como montar a régua de pontos, a validade, a autorização do resgate, o dia de bônus e o catálogo de trocas antes de colocar a fidelidade de pontos no ar.',
  login: (p) => loginGestao(p, 'guia.graodaserra@fidz.test'),
  steps: [
    {
      target: btn('Fidelidade'),
      text: 'A fidelidade da sua loja fica em Fidelidade, no menu lateral.',
    },
    {
      target: (p) => p.getByTestId('loyalty-type-pontos'),
      text: 'Escolha Pontos: o cliente ganha pontos por real gasto e troca por recompensas do seu catálogo.',
      wait: 1000,
    },
    {
      target: btn('Criar fidelidade de Pontos'),
      text: 'Clique em Criar fidelidade de Pontos. Nada vai ao ar até você confirmar no fim.',
    },
    {
      target: tour('points.rate'),
      text: 'Monte a régua: quantos pontos o cliente ganha a cada real gasto. Aqui, 1 ponto a cada 1 real.',
      act: 'none',
      wait: 1000,
    },
    {
      target: (p) => tour('points.validity')(p).getByRole('button', { name: '6 meses', exact: true }),
      text: 'Quer que os pontos vençam? Escolha 6 meses. O cliente é avisado 7 dias antes do vencimento.',
    },
    {
      target: (p) => p.getByRole('button', { name: /^O cliente autoriza no app/ }),
      text: 'Em Como o resgate é validado, com O cliente autoriza no app o saldo só sai depois do aceite no celular.',
      act: 'none',
    },
    {
      target: (p) => tour('points.bonus')(p).getByRole('button').first(),
      text: 'Ligue o Dia de bônus: num dia da semana à sua escolha, cada real vale mais pontos.',
    },
    {
      target: (p) => tour('points.bonus')(p).getByRole('button', { name: 'Ter', exact: true }),
      text: 'Escolha o dia. Aqui, terça.',
    },
    {
      target: (p) => tour('points.bonus')(p).locator('input'),
      text: 'Diga quantos pontos cada real vale nesse dia. Na terça, esse valor substitui a régua normal.',
      act: (p, loc) => loc.fill('2'),
    },
    {
      target: tour('points.new-reward'),
      text: 'Agora monte o catálogo. Clique em Nova troca. Você precisa de pelo menos uma troca para criar a fidelidade.',
    },
    {
      target: (p) => tour('reward-form.value')(p).locator('input'),
      text: 'Escolha o que o cliente recebe: desconto em porcentagem, desconto em reais ou um produto. Aqui, 10% de desconto.',
      act: (p, loc) => loc.fill('10'),
      wait: 800,
    },
    {
      target: (p) => tour('reward-form.cost')(p).locator('input'),
      text: 'Em Custa quantos pontos, informe o preço da troca. Aqui, 100 pontos.',
      act: (p, loc) => loc.fill('100'),
    },
    {
      target: tour('reward-form.save'),
      text: 'Compra mínima é opcional: vazia, a troca vale em qualquer compra. Clique em Salvar troca.',
    },
    {
      target: tour('points.new-reward'),
      text: 'Quer dar mais opções? Clique em Nova troca de novo. O cliente escolhe qualquer troca que couber no saldo.',
      wait: 800,
    },
    {
      target: (p) => tour('reward-form.kind')(p).getByRole('button', { name: 'Produto ou serviço', exact: true }),
      text: 'Desta vez, escolha Produto ou serviço.',
      wait: 800,
    },
    {
      target: (p) => tour('reward-form.value')(p).locator('input'),
      text: 'Escreva o produto do jeito que vocês falam no balcão. É o texto que o cliente vê no app.',
      act: (p, loc) => loc.fill('Um café coado'),
    },
    {
      target: (p) => tour('reward-form.cost')(p).locator('input'),
      text: 'Esse custa 150 pontos.',
      act: (p, loc) => loc.fill('150'),
    },
    {
      target: tour('reward-form.save'),
      text: 'Clique em Salvar troca. Depois dá para editar ou remover cada uma.',
    },
    {
      target: tour('points.create'),
      text: 'Tudo pronto? Clique em Criar fidelidade para colocar os pontos no ar.',
      wait: 800,
    },
    {
      target: (p) => p.getByText('Pontos', { exact: true }).first(),
      text: 'Pronto: a fidelidade de pontos está ativa. O balcão já calcula os pontos de cada venda e o catálogo aparece no app.',
      act: 'none',
      toast: true,
      wait: 1500,
    },
  ],
};
