import { loginApp } from '../run.mjs';

export default {
  slug: 'app-pegar-um-cupom',
  section: 'app-do-cliente',
  sectionTitle: 'App do cliente',
  order: 1,
  device: 'phone',
  title: 'Pegar e usar um cupom no app',
  description:
    'Veja onde ficam os cupons das lojas perto de você, como conferir as regras, resgatar o cupom no app e usar no caixa.',
  login: (p) => loginApp(p, 'beatriz.nunes@fidz.test'),
  steps: [
    {
      target: (p) => p.getByText('Cupons', { exact: true }).last(),
      text: 'Os cupons das lojas perto de você ficam em Cupons, na barra de baixo.',
      wait: 1500,
    },
    {
      target: (p) => p.getByTestId('coupons-filter-free'),
      text: 'Os filtros separam os cupons disponíveis, os que você já resgatou, os esgotados e os usados.',
      act: 'none',
      wait: 1500,
    },
    {
      target: (p) => p.locator('[data-testid^="coupon-card-"]').filter({ hasText: '15%' }),
      text: 'Toque num cupom para ver as regras. Aqui, 15% de desconto na Doce Vida Confeitaria.',
    },
    {
      target: (p) => p.getByText('Usos disponíveis', { exact: true }),
      text: 'Resgatar não garante o desconto: o cupom vale para os primeiros que usarem no caixa.',
      act: 'none',
      wait: 1200,
    },
    {
      target: (p) => p.getByText('Regras', { exact: true }),
      text: 'Confira as regras: compra mínima, validade, unidades e se a compra também rende selo.',
      act: 'none',
    },
    {
      target: (p) => p.getByTestId('coupon-claim-button'),
      text: 'Gostou? Toque em Resgatar cupom para guardar o cupom no app.',
    },
    {
      target: (p) => p.getByText('Cupom resgatado', { exact: true }),
      text: 'Pronto, o cupom está guardado. No caixa, informe o seu celular e o atendente aplica o desconto.',
      act: 'none',
      wait: 1500,
    },
  ],
};
