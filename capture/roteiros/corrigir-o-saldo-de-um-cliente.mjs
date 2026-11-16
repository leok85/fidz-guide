import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const modal = (p) => p.getByRole('dialog', { name: 'Corrigir saldo' });

export default {
  slug: 'corrigir-o-saldo-de-um-cliente',
  section: 'introducao',
  order: 2,
  title: 'Corrigir o saldo de um cliente',
  description:
    'Veja como achar um cliente na Gestão, conferir o extrato e dar ou tirar selos com um motivo, que fica registrado no histórico.',
  login: (p) => loginGestao(p, 'guia.docevida@fidz.test'),
  steps: [
    {
      target: btn('Clientes'),
      text: 'Seus clientes e o saldo de cada um ficam em Clientes, no menu lateral.',
    },
    {
      target: btn('Perto de completar'),
      text: 'Quer ver quem está quase ganhando a recompensa? Use o filtro Perto de completar.',
      wait: 1200,
    },
    {
      target: (p) => p.locator('[data-testid^="customer-row-"]').filter({ hasText: 'Beatriz Nunes' }),
      text: 'Clique em um cliente, como Beatriz Nunes, para abrir a ficha dela.',
      wait: 1200,
    },
    {
      target: btn('Ver extrato'),
      text: 'A ficha mostra a cartela, a frequência e o Fidz Score. Ver extrato lista cada selo, com data, atendente e unidade.',
      wait: 1000,
    },
    {
      target: btn('Voltar ao resumo'),
      text: 'Conferiu o extrato? Clique em Voltar ao resumo para voltar à ficha.',
    },
    {
      target: btn('Corrigir saldo'),
      text: 'Algum selo ficou faltando ou sobrando? Clique em Corrigir saldo.',
    },
    {
      target: (p) => modal(p).getByRole('button', { name: '1', exact: true }),
      text: 'Adicionar já vem marcado. Escolha quantos selos dar: os atalhos 1, 2 e 5 preenchem o campo na hora.',
      wait: 700,
    },
    {
      target: (p) => modal(p).getByRole('button', { name: 'Cortesia', exact: true }),
      text: 'Escolha o motivo, como Cortesia. Ele entra no extrato da cliente junto com o seu nome.',
    },
    {
      target: (p) => modal(p).getByRole('button', { name: 'Adicionar ao saldo' }),
      text: 'Confira a prévia em Fica com e clique em Adicionar ao saldo para salvar a correção.',
    },
    {
      target: (p) => p.getByTestId('customer-panel').getByRole('button', { name: 'Fechar' }),
      act: async (p, loc) => {
        await loc.click();
        await p.getByTestId('customer-panel').waitFor({ state: 'hidden' });
      },
      text: 'Pronto: a correção foi salva, como mostra o aviso no canto. Feche a ficha para voltar à lista.',
      toast: true,
      wait: 1200,
    },
    {
      target: btn('Histórico'),
      text: 'Em Histórico, no menu lateral, você acompanha tudo o que passou pelo balcão.',
    },
    {
      target: btn('Selos'),
      text: 'Filtre por Selos para ver só os selos dados no período escolhido.',
      wait: 1200,
    },
    {
      target: btn('Correções'),
      text: 'Clique em Correções para ver só os ajustes de saldo, como a cortesia que você acabou de dar.',
      wait: 1000,
    },
    {
      target: (p) => p.getByText('Beatriz Nunes').first(),
      text: 'A correção aparece com a cliente, o motivo e quem fez. Assim nada some sem explicação.',
      act: 'none',
      wait: 1200,
    },
  ],
};
