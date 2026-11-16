import { abrirApp } from '../run.mjs';
import { CODIGO_GUIA } from '../customer-session-local.mjs';

const testid = (id) => (p) => p.getByTestId(id);
const digita = (valor) => async (p, loc) => {
  await loc.click();
  await p.keyboard.type(valor, { delay: 60 });
};

export default {
  slug: 'app-entrar-e-associar-o-celular',
  section: 'app-do-cliente',
  sectionTitle: 'App do cliente',
  order: 0,
  device: 'phone',
  customerSession: true,
  title: 'Entrar no app e associar o celular',
  description:
    'Veja como criar a conta no app da Fidz com o e-mail, aceitar os termos e associar o celular, que é como a loja encontra você no caixa.',
  login: (p) => abrirApp(p),
  // A conta da rodada anterior sai do caminho (o aceite dos termos não se apaga).
  prepare: `update public.customer_profiles
               set email = 'antiga-' || id || '@example.invalid', phone_e164 = null
             where email = 'mariana.goulart@example.com';
            update public.loyalty_customers set profile_id = null where phone_e164 = '+5511900095020';`,
  steps: [
    {
      target: (p) => p.getByText('Continuar com e-mail', { exact: true }),
      text: 'O app da Fidz é de graça e o mesmo para todas as lojas. Para entrar, use a sua conta Google ou o seu e-mail. Aqui, Continuar com e-mail.',
      wait: 1500,
    },
    {
      target: testid('email-entrada-input'),
      text: 'Digite o seu e-mail. Se você ainda não tem conta, ela é criada na hora.',
      act: (p, loc) => loc.fill('mariana.goulart@example.com'),
      wait: 900,
    },
    {
      target: testid('email-entrada-send-button'),
      text: 'Toque em Receber código. Chegam 6 números no seu e-mail.',
    },
    {
      target: testid('email-codigo-input'),
      text: 'Digite o código que chegou no e-mail. Com os 6 números, o app confere sozinho.',
      act: digita(CODIGO_GUIA),
      wait: 1200,
    },
    {
      target: testid('cadastro-name-input'),
      text: 'Conta nova: escreva o seu nome completo.',
      act: (p, loc) => loc.fill('Mariana Goulart'),
      wait: 2000,
    },
    {
      target: (p) => p.getByText('Tenho 18 anos ou mais', { exact: true }),
      text: 'Informe a sua idade. Menores de 13 anos não podem ter conta.',
    },
    {
      target: (p) => p.getByText(/^Li e aceito os/),
      text: 'Leia e aceite os Termos de Uso e a Política de Privacidade.',
    },
    {
      target: testid('cadastro-submit-button'),
      text: 'Toque em Criar conta.',
    },
    {
      target: testid('associar-phone-input'),
      text: 'Falta o celular. É por ele que a loja encontra você no caixa para dar selos, pontos e cashback. Digite o número com DDD.',
      act: (p, loc) => loc.fill('11900095020'),
      wait: 2500,
    },
    {
      target: testid('associar-send-button'),
      text: 'Toque em Receber código no WhatsApp.',
    },
    {
      target: testid('codigo-tel-input'),
      text: 'Digite o código que chegou no WhatsApp. Com os 6 números, o app confirma sozinho.',
      act: digita(CODIGO_GUIA),
      wait: 1500,
    },
    {
      target: (p) => p.getByText('Doce Vida Confeitaria', { exact: true }),
      text: 'Pronto! Se alguma loja já tinha cadastrado o seu celular no balcão, essas fidelidades entram na sua carteira. Aqui, a da Doce Vida.',
      act: 'none',
      wait: 2500,
    },
    {
      target: testid('cel-associado-continue-button'),
      text: 'Toque em Continuar. Agora é só dar o seu celular no caixa: a loja busca o número e o selo cai no app.',
    },
  ],
};
