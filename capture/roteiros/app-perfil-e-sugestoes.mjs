import { loginApp } from '../run.mjs';

const testid = (id) => (p) => p.getByTestId(id);

export default {
  slug: 'app-perfil-e-sugestoes',
  section: 'app-do-cliente',
  sectionTitle: 'App do cliente',
  order: 5,
  device: 'phone',
  title: 'Notificações, idioma e sugestões no app',
  description:
    'Veja no Perfil como escolher os avisos que você recebe, trocar o idioma do app e mandar uma sugestão ou um problema para a equipe da Fidz.',
  login: (p) => loginApp(p, 'beatriz.nunes@fidz.test'),
  prepare: `delete from public.customer_feedback where customer_id = '9e1a0000-0000-4000-8000-0000000c0001';`,
  steps: [
    {
      target: (p) => p.getByText('Perfil', { exact: true }),
      text: 'No Perfil, na barra de baixo, ficam as suas preferências e o contato com a Fidz.',
      wait: 1500,
    },
    {
      target: (p) => p.getByText('Notificações', { exact: true }),
      text: 'Toque em Notificações para escolher os avisos que você quer receber.',
      wait: 1200,
    },
    {
      target: (p) => p.getByText('Selos, pontos e cashback', { exact: true }),
      text: 'Ligue Selos, pontos e cashback para ser avisado a cada ganho e 7 dias antes de o saldo vencer.',
      act: 'none',
      wait: 1200,
    },
    {
      target: (p) => p.getByText('Ofertas por e-mail', { exact: true }),
      text: 'Em Ofertas, escolha se quer receber as ofertas das lojas onde você tem cartão no celular, por e-mail ou no WhatsApp.',
      act: 'none',
    },
    {
      target: testid('detail-header-back-button'),
      text: 'Toque em voltar.',
    },
    {
      target: (p) => p.getByText('Idioma', { exact: true }),
      text: 'O app fala português, espanhol e inglês. Troque em Idioma.',
      act: 'none',
      wait: 1000,
    },
    {
      target: (p) => p.getByText('Enviar sugestão', { exact: true }),
      text: 'Tem uma ideia ou encontrou um problema? Toque em Enviar sugestão.',
    },
    {
      target: testid('feedback-type-chip-feedback-idea'),
      text: 'Escolha o tipo: um problema, uma sugestão ou um elogio.',
      wait: 1200,
    },
    {
      target: testid('feedback-message-input'),
      text: 'Conte com detalhes. A equipe da Fidz lê tudo.',
      act: (p, loc) => loc.fill('Seria ótimo ver no app quais lojas perto de mim dão selo em dobro hoje.'),
    },
    {
      target: testid('feedback-submit-button'),
      text: 'Toque em Enviar sugestão. Pronto: a sua ideia chega para a equipe da Fidz.',
    },
  ],
};
