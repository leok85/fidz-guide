import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const modal = (p) => p.getByTestId('modal-panel');

export default {
  slug: 'ligar-ifood-e-anota-ai',
  section: 'fidelidades',
  order: 4,
  title: 'Ligar o iFood e a Anota AI',
  description:
    'Veja como fazer os pedidos do iFood e da Anota AI também darem fidelidade, ligando cada unidade em Integrações.',
  login: (p) => loginGestao(p, 'guia.docevida@fidz.test'),
  steps: [
    {
      target: btn('Configurações'),
      text: 'Pedidos de outros apps também podem dar fidelidade. Abra Configurações, no menu lateral.',
    },
    {
      target: btn('Integrações'),
      text: 'Clique em Integrações.',
    },
    {
      target: (p) => p.getByRole('button', { name: 'Ligar ao iFood' }),
      text: 'No iFood, cada unidade é ligada separadamente. Clique em Ligar ao iFood na unidade e siga os passos que aparecem.',
      act: 'none',
      wait: 1200,
    },
    {
      target: (p) => p.getByText(/^Conta para os selos/),
      text: 'Em Conta para os selos, você vê o que entra no valor do pedido. Clique em Alterar para mudar.',
      act: 'none',
    },
    {
      target: (p) => p.getByRole('button', { name: 'Ligar à Anota AI' }),
      text: 'Usa a Anota AI? Pedidos do cardápio digital, do WhatsApp e do iFood por ela também dão selos. Clique em Ligar à Anota AI.',
    },
    {
      target: (p) => modal(p).getByText(/^No menu, abra Configurações gerais/),
      text: 'Siga os três passos: entre no admin da Anota AI, abra Configurações gerais e depois Outras Integrações.',
      act: 'none',
      wait: 900,
    },
    {
      target: (p) => modal(p).locator('input').first(),
      text: 'Copie a Chave de integração e cole aqui. A Fidz usa a chave só para ligar a loja e não a guarda.',
      act: 'none',
    },
    {
      target: (p) => modal(p).getByRole('button', { name: 'Ligar à Anota AI' }),
      text: 'Clique em Ligar à Anota AI. Depois disso, cada pedido concluído conta como uma compra registrada no balcão.',
      act: 'none',
    },
  ],
};
