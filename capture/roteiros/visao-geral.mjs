import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });

export default {
  slug: 'visao-geral',
  section: 'introducao',
  order: 0,
  title: 'Acompanhar a fidelidade na Visão geral',
  description:
    'Veja como filtrar a Visão geral por período e por unidade, e onde estão os clientes em risco, a atividade do balcão e quem está perto da recompensa.',
  login: (p) => loginGestao(p, 'guia.docevida@fidz.test'),
  steps: [
    {
      target: btn('Últimos 30 dias'),
      text: 'Na Visão geral você acompanha clientes, selos e recompensas da loja. O período fica neste filtro. Clique para trocar.',
      wait: 1200,
    },
    {
      target: btn('Últimos 7 dias'),
      text: 'Escolha Últimos 7 dias para ver como foi a semana.',
    },
    {
      target: (p) => p.getByText('Clientes recorrentes', { exact: true }),
      text: 'Cada card compara o período com o anterior, logo abaixo do número. Clientes recorrentes é o principal: mostra quantos dos clientes ativos já tinham vindo antes.',
      act: 'none',
      wait: 1200,
    },
    {
      target: btn('Últimos 7 dias'),
      text: 'Quer conferir só o dia? Abra o filtro de novo.',
    },
    {
      target: btn('Hoje'),
      text: 'Hoje mostra só o movimento do dia. Serve para conferir, no fim do expediente, o que o balcão registrou.',
    },
    {
      target: (p) => p.getByText('Em risco', { exact: true }).first(),
      text: 'Em Oportunidades, Em risco mostra quem já passou do tempo que costuma levar para voltar. Criar comunicação chama esses clientes de volta.',
      act: 'none',
      wait: 1200,
    },
    {
      target: (p) => p.getByText('Atividade do balcão', { exact: true }),
      text: 'Atividade do balcão mostra cada selo dado hoje, com quem atendeu e em qual unidade.',
      act: 'none',
    },
    {
      target: (p) => p.getByText('Perto de completar', { exact: true }),
      text: 'Perto de completar lista quem está a um ou dois selos da recompensa. É um bom público para uma comunicação.',
      act: 'none',
    },
    {
      target: (p) => p.getByRole('button', { name: /^Doce Vida Confeitaria/ }),
      text: 'Tem mais de uma loja? Abra o seletor no topo para olhar cada unidade separada.',
    },
    {
      target: btn('Unidade Loja Centro'),
      text: 'Escolha Loja Centro e todos os números passam a mostrar só o movimento dessa unidade.',
    },
    {
      target: (p) => p.getByRole('button', { name: /^Doce Vida Confeitaria/ }),
      text: 'Pronto: a Visão geral mostra só a Loja Centro. Para voltar ao total, escolha Todas as unidades no mesmo seletor.',
      act: 'none',
      wait: 1500,
    },
  ],
};
