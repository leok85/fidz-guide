import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
/** Botão dentro do bloco que tem o título dado: sobe do título até o primeiro ancestral que contém o botão. */
const inBlock = (title, name) => (p) =>
  p.getByText(title, { exact: true })
    .locator(`xpath=ancestor::*[.//button[normalize-space()="${name}"]][1]`)
    .getByRole('button', { name, exact: true });

export default {
  slug: 'criar-uma-fidelidade-de-selos',
  section: 'fidelidades',
  order: 1,
  title: 'Criar uma fidelidade de selos',
  description:
    'Veja como montar uma cartela de selos na Gestão: nome, recompensa, meta, regra de ganho, dia de bônus e como o resgate é validado, até ativar o programa.',
  login: (p) => loginGestao(p, 'guia.graodaserra@fidz.test'),
  steps: [
    {
      target: btn('Fidelidade'),
      text: 'A fidelidade da sua loja fica em Fidelidade, no menu lateral.',
    },
    {
      target: (p) => p.getByTestId('loyalty-type-selos'),
      text: 'Escolha Selos: o cliente junta selos numa cartela e, ao completar, leva a recompensa.',
      wait: 1000,
    },
    {
      target: (p) => p.locator('[data-tour="loyalty.create-selos"]'),
      text: 'Clique em Criar fidelidade de Selos para montar a sua cartela.',
    },
    {
      target: (p) => p.getByTestId('program-name-input'),
      text: 'Comece pelo nome da cartela. Prefira algo curto, que o cliente reconheça no app.',
      wait: 900,
      act: (p, loc) => loc.fill('Cartão Grão da Serra'),
    },
    {
      target: btn('Brinde'),
      text: 'Escolha o tipo de recompensa: um brinde, desconto em reais ou desconto em porcentagem.',
    },
    {
      target: (p) => p.getByLabel('Qual é o brinde *'),
      text: 'Descreva o brinde do jeito que vocês falam no balcão. É o texto que o cliente vê no app.',
      act: (p, loc) => loc.fill('Um café coado grátis'),
    },
    {
      target: (p) => p.locator('[data-tour="program-form.goal"]').getByRole('button', { name: '10', exact: true }),
      text: 'Defina quantos selos até a recompensa. Cartões de 10 selos costumam ser completados por 6 em cada 10 clientes.',
    },
    {
      target: (p) => p.getByRole('button', { name: /^A cada valor gasto/ }),
      text: 'Quer premiar quem gasta mais? Escolha A cada valor gasto: o balcão informa o valor e a Fidz calcula os selos.',
    },
    {
      target: (p) => p.getByLabel('Cada selo a partir de *'),
      text: 'Defina quanto vale um selo. Com 20 reais, uma compra de 60 reais rende 3 selos.',
      act: (p, loc) => loc.fill('20'),
    },
    {
      target: btn('Continuar'),
      text: 'Tudo certo na recompensa? Clique em Continuar.',
    },
    {
      target: inBlock('Dia de bônus', 'Ter'),
      text: 'Quer movimentar um dia fraco? Escolha um dia de bônus, como terça.',
      wait: 900,
    },
    {
      target: btn('Selo em dobro'),
      text: 'Nesse dia, cada atendimento vale selo em dobro ou um selo extra. Aqui, Selo em dobro.',
    },
    {
      target: (p) => p.getByRole('button', { name: /^Sem autorização, a loja entrega/ }),
      text: 'Em Como o resgate é validado, com Sem autorização a loja entrega a recompensa na hora e o cliente nem precisa do app.',
      act: 'none',
    },
    {
      target: (p) => p.getByRole('button', { name: /^O cliente autoriza no app/ }),
      text: 'Prefere mais controle? Com O cliente autoriza no app, chega uma tela no celular dele na hora da entrega.',
    },
    {
      target: btn('Continuar'),
      text: 'Confira em Onde vale as unidades da cartela e clique em Continuar para revisar.',
    },
    {
      target: (p) => p.locator('[data-tour="program-form.summary"]'),
      text: 'Revise o resumo: nome, recompensa, meta, dia de bônus e onde vale.',
      act: 'none',
      wait: 900,
    },
    {
      target: btn('Ativar programa'),
      text: 'Pronto: clique em Ativar programa e a cartela passa a valer no balcão.',
    },
    {
      target: (p) => p.getByText('Cartão Grão da Serra', { exact: true }).first(),
      text: 'A cartela já está ativa. A partir de agora o balcão registra os selos e o cliente acompanha tudo no app.',
      act: 'none',
      toast: true,
      wait: 1500,
    },
  ],
};
