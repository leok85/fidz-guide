import { loginApp, sqlValue } from '../run.mjs';

export default {
  slug: 'app-check-in-no-balcao',
  section: 'app-do-cliente',
  sectionTitle: 'App do cliente',
  order: 4,
  device: 'phone',
  title: 'Fazer check-in no balcão com o celular',
  description:
    'Veja como o display Fidz do balcão avisa a loja que você chegou: aproxime o celular ou leia o QR e o atendente já vê o seu nome, sem digitar nada.',
  // O display da Loja Centro da Doce Vida (o código muda a cada seed).
  login: (p) => loginApp(p, 'beatriz.nunes@fidz.test', { path: `/u/${sqlValue('select display_code from public.company_units where id = 950')}` }),
  steps: [
    {
      target: (p) => p.getByText('Pronto, Beatriz!', { exact: true }),
      text: 'Na loja com o display Fidz, aproxime o celular ou leia o QR. O app abre sozinho nesta tela e avisa o balcão que você chegou.',
      act: 'none',
      wait: 2000,
    },
    {
      target: (p) => p.getByText(/^O atendente já está vendo seu nome/),
      text: 'O atendente já vê o seu nome na fila do balcão. É só dizer que é cliente Fidz na hora de pagar, sem dar o celular.',
      act: 'none',
    },
    {
      target: (p) => p.getByTestId('counter-card'),
      text: 'Logo abaixo está a sua cartela naquela loja: quantos selos você tem e quanto falta para a recompensa.',
      act: 'none',
    },
    {
      target: (p) => p.getByText(/^Abriu sozinho porque/),
      text: 'Sem o app, o display abre uma página para você entrar na fila com o nome e o celular.',
      act: 'none',
    },
    {
      target: (p) => p.getByTestId('counter-back-button'),
      text: 'Toque em voltar para ir à sua carteira.',
    },
  ],
};
