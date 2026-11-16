import { codigoDoEmail, loginAfiliado } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const EMAIL = 'afiliado.guia@fidz.test';

export default {
  slug: 'afiliado-entrar-e-divulgar',
  section: 'afiliados',
  sectionTitle: 'Programa de afiliados',
  order: 0,
  title: 'Entrar no painel e divulgar o seu link',
  description:
    'Veja como o afiliado entra no painel com o código que chega por e-mail e onde estão o link e o código de indicação para mandar às lojas.',
  login: (p) => loginAfiliado(p, EMAIL, { preencher: false }),
  steps: [
    {
      target: (p) => p.getByLabel('E-mail'),
      text: 'O painel de afiliados abre no navegador, no computador ou no celular. Digite o e-mail do seu cadastro de afiliado.',
      act: (p, loc) => loc.fill(EMAIL),
      wait: 1200,
    },
    {
      target: btn('Receber código'),
      text: 'Clique em Receber código. Não tem senha: chegam 6 números no seu e-mail.',
    },
    {
      target: (p) => p.getByLabel('Código de 6 dígitos'),
      text: 'Digite o código. Ele vale por uma hora. Não chegou? Confira o spam ou peça outro.',
      act: async (p, loc) => loc.fill(await codigoDoEmail(EMAIL)),
      wait: 1200,
    },
    {
      target: btn('Entrar'),
      text: 'Clique em Entrar.',
    },
    {
      target: (p) => p.getByText('Seu link de indicação', { exact: false }),
      text: 'No Início está o seu link de indicação. A loja que se cadastra por ele fica ligada a você.',
      act: 'none',
      wait: 2000,
    },
    {
      target: btn('Copiar link'),
      text: 'Clique em Copiar link para colar onde quiser, ou em Enviar no WhatsApp para mandar direto.',
      act: 'none',
    },
    {
      target: (p) => p.getByText(/^Ou peça para a loja digitar o código/),
      text: 'Se a loja preferir, ela digita o seu código no cadastro. Vale do mesmo jeito.',
      act: 'none',
    },
    {
      target: (p) => p.getByText('Disponível para saque', { exact: true }).first(),
      text: 'Logo abaixo, os seus números: o que está disponível para saque, o que está em carência, as lojas ativas e o total ganho.',
      act: 'none',
    },
  ],
};
