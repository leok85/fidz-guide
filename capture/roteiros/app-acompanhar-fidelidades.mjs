import { loginApp } from '../run.mjs';

const testid = (id) => (p) => p.getByTestId(id);

export default {
  slug: 'app-acompanhar-fidelidades',
  section: 'app-do-cliente',
  sectionTitle: 'App do cliente',
  order: 1,
  device: 'phone',
  title: 'Acompanhar suas fidelidades no app',
  description:
    'Veja como a carteira do app da Fidz mostra os selos, os pontos e o cashback de cada loja, e o que tem na ficha de cada cartão.',
  login: (p) => loginApp(p, 'beatriz.nunes@fidz.test'),
  steps: [
    {
      target: (p) => p.getByText('Sua carteira', { exact: true }),
      text: 'Na Carteira ficam todas as suas fidelidades, de todas as lojas onde você deu o celular no caixa.',
      act: 'none',
      wait: 1500,
    },
    {
      target: (p) => p.getByText('Cartão Doce Vida', { exact: true }),
      text: 'Cada cartão mostra quanto falta. Aqui, 8 de 10 selos: faltam 2 para a recompensa.',
      act: 'none',
    },
    {
      target: testid('wallet-filter-Cashback'),
      text: 'Use os filtros para ver só selos, pontos ou cashback.',
    },
    {
      target: (p) => p.getByText('Empório Bom Gosto', { exact: true }),
      text: 'O cashback mostra quanto você tem para usar como desconto na próxima compra nessa loja. Não é dinheiro: só vale voltando.',
      act: 'none',
      wait: 900,
    },
    {
      target: testid('wallet-filter-Tudo'),
      text: 'Volte para Tudo para ver todos os cartões.',
    },
    {
      target: (p) => p.getByText('Doce Vida Confeitaria', { exact: true }),
      text: 'Toque num cartão para abrir a ficha da loja.',
      wait: 900,
    },
    {
      target: (p) => p.getByText('Uma fatia de bolo', { exact: true }),
      text: 'No topo estão o seu prêmio e a cartela. Cada selo marcado é uma visita.',
      act: 'none',
      wait: 1500,
    },
    {
      target: (p) => p.getByText('Selo em Doce Vida Confeitaria').first(),
      text: 'Em Atividade você confere cada selo que ganhou, com a data.',
      act: 'none',
    },
    {
      target: (p) => p.locator('[data-testid^="unit-directions-"]'),
      text: 'Mais abaixo estão as unidades da loja, com o horário, Como chegar e Ligar.',
      act: 'none',
    },
    {
      target: testid('business-back-button'),
      text: 'Toque em voltar para retornar à carteira.',
    },
    {
      target: (p) => p.getByText('Histórico', { exact: true }).last(),
      text: 'Em Histórico, na barra de baixo, fica tudo o que você ganhou e usou, em todas as lojas.',
      wait: 900,
    },
    {
      target: (p) => p.getByText('Selo em Doce Vida Confeitaria').first(),
      text: 'Pronto. Lembre: quem registra o selo, o ponto ou o cashback é a loja. No caixa, é só dar o seu celular.',
      act: 'none',
      wait: 1500,
    },
  ],
};
