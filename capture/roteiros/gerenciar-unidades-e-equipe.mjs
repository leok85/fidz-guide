import { loginGestao } from '../run.mjs';

const nav = (name) => (p) => p.getByRole('button', { name, exact: true });
const modal = (p) => p.getByTestId('modal-panel');

export default {
  slug: 'gerenciar-unidades-e-equipe',
  section: 'introducao',
  order: 1,
  title: 'Gerenciar unidades e equipe',
  description:
    'Veja como adicionar uma unidade buscando a loja no Google, desativar uma unidade, consultar o acesso do balcão e cadastrar quem atende.',
  googlePlaces: ['doce-vida-beira-mar'],
  login: (p) => loginGestao(p, 'guia.docevida@fidz.test'),
  steps: [
    {
      target: nav('Configurações'),
      text: 'Unidades e equipe ficam em Configurações, no menu lateral. Clique para abrir o grupo.',
    },
    {
      target: nav('Unidades'),
      text: 'Clique em Unidades. Cada card é uma loja física, com telefone, horário e o movimento do mês.',
    },
    {
      target: (p) => p.locator('[data-testid^="unit-menu-trigger-"]'),
      text: 'Abra o menu de três pontos no card para ver as opções daquela unidade.',
    },
    {
      target: (p) => p.getByRole('button', { name: 'Desativar unidade' }),
      text: 'A loja fechou? Desativar unidade corta o balcão dela, e o saldo dos clientes fica guardado.',
      // Fecha o menu sem desativar: clique fora, no título da página.
      act: (p) => p.mouse.click(860, 740),
    },
    {
      target: (p) => p.getByRole('button', { name: 'Adicionar unidade' }),
      text: 'Abriu uma loja nova? Clique em Adicionar unidade. Quantas unidades cabem depende do seu plano.',
      wait: 900,
    },
    {
      target: (p) => modal(p).locator('input').first(),
      text: 'Busque a loja pelo nome, como ela aparece no Google. Endereço, telefone e horário vêm junto.',
      wait: 1500,
      act: async (p, loc) => {
        await loc.pressSequentially('Doce Vida', { delay: 40 });
        await p.waitForTimeout(1200);
      },
    },
    {
      target: (p) => p.getByText('Doce Vida Confeitaria - Beira-Mar', { exact: true }),
      text: 'Escolha a sua loja na lista de resultados do Google.',
      tip: 'bottom',
    },
    {
      target: (p) => modal(p).locator('input').last(),
      text: 'Confira o que veio do Google e dê um nome à unidade. É ele que aparece no seletor do topo e no app do cliente.',
      wait: 1200,
      act: (p, loc) => loc.fill('Loja Beira-Mar'),
    },
    {
      target: (p) => modal(p).getByRole('button', { name: 'Adicionar unidade' }),
      text: 'Tudo certo? Clique em Adicionar unidade. Ela já entra ativa e ganha o próprio acesso do balcão.',
    },
    {
      target: nav('Equipe'),
      text: 'Quem atende e o acesso do balcão ficam em Equipe.',
      wait: 1500,
    },
    {
      target: (p) => p.getByRole('button', { name: 'mostrar' }),
      text: 'Cada unidade tem um usuário e uma senha para o tablet do balcão. Clique em mostrar para ver a senha.',
      wait: 900,
    },
    {
      target: (p) => p.getByRole('button', { name: 'Trocar senha' }),
      text: 'Alguém saiu da equipe? Trocar senha desconecta o tablet daquela unidade na hora.',
      act: 'none',
    },
    {
      target: (p) => p.getByRole('button', { name: 'Adicionar pessoa' }),
      text: 'Chegou alguém novo? Clique em Adicionar pessoa.',
    },
    {
      target: (p) => modal(p).getByPlaceholder('Como aparece na tela do balcão'),
      text: 'Escreva o nome como a pessoa vai se reconhecer. É ele que aparece na tela de escolha do balcão.',
      wait: 700,
      act: (p, loc) => loc.fill('Carla Mendes'),
    },
    {
      target: (p) => p.locator('[data-tour="team-form.unit"]').getByRole('button', { name: 'Loja Shopping' }),
      text: 'Escolha a unidade onde a pessoa trabalha. Ela só aparece no balcão dessa unidade.',
    },
    {
      target: (p) => p.locator('[data-tour="team-form.submit"]').or(modal(p).getByRole('button', { name: 'Adicionar', exact: true })),
      text: 'Clique em Adicionar. No próximo atendimento, o nome já está na tela do balcão.',
    },
    {
      target: (p) => p.getByText('Carla Mendes', { exact: true }),
      text: 'Pronto: Carla Mendes já faz parte da equipe da Loja Shopping.',
      wait: 1200,
      toast: true,
      act: 'none',
    },
  ],
};
