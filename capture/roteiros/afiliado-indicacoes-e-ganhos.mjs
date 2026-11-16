import { loginAfiliado } from '../run.mjs';

const nav = (name) => (p) => p.getByRole('link', { name, exact: true }).or(p.getByRole('button', { name, exact: true }));

export default {
  slug: 'afiliado-indicacoes-e-ganhos',
  section: 'afiliados',
  sectionTitle: 'Programa de afiliados',
  order: 1,
  title: 'Acompanhar indicações e comissões',
  description:
    'Veja como o afiliado acompanha as lojas indicadas e entende as comissões: a primeira mensalidade inteira, 10% por dois anos e a carência de 30 dias.',
  login: (p) => loginAfiliado(p, 'afiliado.guia@fidz.test'),
  steps: [
    {
      target: nav('Indicações'),
      text: 'Abra Indicações, no menu lateral.',
      wait: 1200,
    },
    {
      target: (p) => p.getByText('Doce Vida Confeitaria', { exact: true }),
      text: 'Aqui estão as lojas que se cadastraram pelo seu link ou código, com o plano e quando entraram.',
      act: 'none',
      wait: 1200,
    },
    {
      target: (p) => p.getByText('Ativa', { exact: true }).first(),
      text: 'A Situação mostra se a loja está em teste, ativa, atrasada ou se cancelou.',
      act: 'none',
    },
    {
      target: (p) => p.getByText(/^2 de 24 mensalidades/),
      text: 'Você ganha a primeira mensalidade inteira e depois 10% de cada mensalidade, por 24 meses enquanto a loja pagar.',
      act: 'none',
    },
    {
      target: nav('Ganhos e saque'),
      text: 'Agora abra Ganhos e saque.',
    },
    {
      target: (p) => p.getByText('Em carência', { exact: true }).first(),
      text: 'Cada comissão fica em carência por 30 dias depois do pagamento da loja. Depois, vira disponível para saque.',
      act: 'none',
      wait: 1200,
    },
    {
      target: (p) => p.getByText(/^Libera \d/).first(),
      text: 'No extrato, cada comissão mostra a loja, a mensalidade e a data em que libera.',
      act: 'none',
    },
  ],
};
