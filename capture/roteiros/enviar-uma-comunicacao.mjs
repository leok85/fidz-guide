import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const tour = (name) => (p) => p.locator(`[data-tour="${name}"]`);
const campoDe = (titulo) => (p) =>
  p.getByText(titulo, { exact: true }).locator('xpath=ancestor::*[.//input][1]').locator('input').first();

export default {
  slug: 'enviar-uma-comunicacao',
  section: 'clientes',
  sectionTitle: 'Clientes e comunicações',
  order: 0,
  title: 'Enviar uma comunicação para os clientes',
  description:
    'Veja como escolher o público pelos filtros, escrever a mensagem, juntar um cupom exclusivo e revisar o envio de uma comunicação por push e e-mail.',
  login: (p) => loginGestao(p, 'guia.docevida@fidz.test'),
  prepare: `delete from public.coupons where company_id = 950 and communication_id is not null;
            delete from public.communications where company_id = 950;`,
  steps: [
    {
      target: btn('Comunicações'),
      text: 'Para falar com os seus clientes, abra Comunicações, no menu lateral.',
    },
    {
      target: btn('Nova comunicação'),
      text: 'Clique em Nova comunicação.',
      wait: 900,
    },
    {
      target: campoDe('Selos no cartão'),
      text: 'Primeiro, o público. Use os filtros: aqui, quem tem 8 selos ou mais, perto da recompensa.',
      act: async (p, loc) => {
        await loc.fill('8');
        await loc.press('Tab');
      },
      wait: 1200,
    },
    {
      target: (p) => p.getByText('clientes no filtro'),
      text: 'A lista mostra quem vai receber. Dá para desmarcar alguém antes de seguir.',
      act: 'none',
      wait: 1200,
    },
    {
      target: tour('communication-form.continue'),
      text: 'Clique em Continuar para escrever a mensagem.',
    },
    {
      target: (p) => p.locator('#communication-title'),
      text: 'Escreva o título. É o que aparece primeiro na notificação e no e-mail.',
      act: (p, loc) => loc.fill('Falta pouco para a sua fatia de bolo!'),
      wait: 1000,
    },
    {
      target: (p) => p.locator('#communication-body'),
      text: 'Escreva a mensagem, curta e direta.',
      act: (p, loc) => loc.fill('Você está a um ou dois selos da recompensa. Passe na Doce Vida esta semana!'),
    },
    {
      target: tour('communication-form.coupon-toggle'),
      text: 'Quer dar um empurrão? Ligue o cupom exclusivo: ele entra na carteira de quem está no público.',
    },
    {
      target: (p) => p.locator('#communication-coupon-value'),
      text: 'Defina o desconto do cupom. Aqui, 10%.',
      act: (p, loc) => loc.fill('10'),
    },
    {
      target: btn('15 dias'),
      text: 'E por quantos dias ele vale.',
    },
    {
      target: tour('communication-form.continue'),
      text: 'Clique em Continuar para revisar.',
    },
    {
      target: btn('Enviar agora'),
      text: 'Confira o resumo: público, mensagem e cupom. Tudo certo? Clique em Enviar agora. Cada loja manda até duas comunicações por semana.',
      act: 'none',
      wait: 1200,
    },
  ],
};
