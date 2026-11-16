import fs from 'node:fs';
import path from 'node:path';
import { loginApp, sql } from '../run.mjs';

const PEDIDO = fs.readFileSync(path.join(import.meta.dirname, '..', 'pedido-cashback.sql'), 'utf8');

export default {
  slug: 'app-autorizar-o-uso-do-saldo',
  section: 'app-do-cliente',
  sectionTitle: 'App do cliente',
  order: 3,
  device: 'phone',
  title: 'Autorizar o uso do cashback no app',
  description:
    'Veja o que acontece no app quando o caixa pede para usar o seu cashback: conferir o desconto, autorizar ou recusar e ver o comprovante.',
  login: (p) => loginApp(p, 'beatriz.nunes@fidz.test'),
  steps: [
    {
      target: (p) => p.getByText('Empório Bom Gosto', { exact: true }),
      text: 'A Beatriz tem 62 reais de cashback no Empório Bom Gosto. Na loja, ela dá o celular no caixa e pede para usar o saldo.',
      act: 'none',
      wait: 1500,
    },
    {
      // O balcão pede o uso do cashback numa venda de R$ 120,00.
      before: async (p) => {
        sql(PEDIDO);
        await p.getByTestId('autorizar-confirm').waitFor({ timeout: 20_000 });
      },
      target: (p) => p.getByText('O caixa pediu agora', { exact: true }),
      text: 'Quando a loja pede autorização, esta tela abre sozinha no celular, onde quer que você esteja no app.',
      act: 'none',
      wait: 1200,
    },
    {
      target: (p) => p.getByText('Você paga', { exact: true }),
      text: 'Confira o desconto, quanto você paga e quanto sobra de saldo depois.',
      act: 'none',
    },
    {
      target: (p) => p.getByTestId('autorizar-refuse'),
      text: 'Não reconhece o pedido? Toque em Recusar e nada é descontado.',
      act: 'none',
    },
    {
      target: (p) => p.getByTestId('autorizar-confirm'),
      text: 'Está tudo certo? Toque em Autorizar desconto. O caixa vê a confirmação na hora.',
    },
    {
      target: (p) => p.getByText(/R\$ 36,00/).first(),
      text: 'Pronto: o desconto foi usado e o comprovante fica no app. O cashback novo da compra entra sobre o valor que você pagou.',
      act: 'none',
      wait: 2000,
    },
  ],
};
