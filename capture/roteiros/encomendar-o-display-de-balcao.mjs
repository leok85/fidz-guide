import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const modal = (p) => p.getByTestId('modal-panel');

// CEP da Loja Centro respondido aqui, sem consultar o ViaCEP de verdade.
const CEP = { cep: '88010-400', logradouro: 'Rua Felipe Schmidt', bairro: 'Centro', localidade: 'Florianópolis', uf: 'SC' };

export default {
  slug: 'encomendar-o-display-de-balcao',
  section: 'introducao',
  order: 5,
  title: 'Encomendar o display de balcão',
  description:
    'Veja como pedir o display Fidz de uma unidade: grátis, um por unidade, com QR e etiqueta de aproximar para o cliente entrar na fila sem digitar.',
  login: async (p) => {
    await p.route('https://viacep.com.br/**', (route) => route.fulfill({ json: CEP }));
    await loginGestao(p, 'guia.docevida@fidz.test');
  },
  prepare: `delete from public.counter_display_orders where unit_id in (950, 951);`,
  steps: [
    {
      target: btn('Configurações'),
      text: 'O display Fidz fica no balcão: o cliente aproxima o celular ou lê o QR e o nome dele aparece para quem atende. Abra Configurações.',
    },
    {
      target: btn('Unidades'),
      text: 'Clique em Unidades.',
    },
    {
      target: btn('Encomendar grátis'),
      text: 'Cada unidade tem o seu display. É grátis, um por unidade. Clique em Encomendar grátis.',
      wait: 1200,
    },
    {
      target: (p) => modal(p).getByLabel('Quem recebe'),
      text: 'Diga quem vai receber a entrega na loja.',
      act: (p, loc) => loc.fill('Helena Duarte'),
      wait: 900,
    },
    {
      target: (p) => modal(p).getByLabel('CEP'),
      text: 'Comece pelo CEP: o resto do endereço se completa sozinho.',
      act: (p, loc) => loc.fill('88010400'),
    },
    {
      target: (p) => modal(p).getByLabel('Rua e número'),
      text: 'Confira o endereço e o número.',
      act: (p, loc) => loc.fill('Rua Felipe Schmidt, 210'),
      wait: 1200,
    },
    {
      target: (p) => modal(p).getByRole('button', { name: 'Encomendar grátis' }),
      text: 'Tudo certo? Clique em Encomendar grátis. O display chega pronto, já ligado a esta unidade.',
    },
    {
      target: (p) => p.getByText('Display de balcão').first(),
      text: 'Pronto: o pedido aparece no card da unidade. O display passa a valer no primeiro cliente que fizer o check-in.',
      act: 'none',
      toast: true,
      wait: 1500,
    },
  ],
};
