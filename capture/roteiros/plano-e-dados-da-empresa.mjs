import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const modal = (p) => p.getByTestId('modal-panel');

export default {
  slug: 'plano-e-dados-da-empresa',
  section: 'introducao',
  order: 3,
  title: 'Plano e dados da empresa',
  description:
    'Veja o plano e a próxima cobrança em Plano e cobrança, compare os planos e atualize em Dados da empresa os links que o cliente vê no app e os dados da nota.',
  login: (p) => loginGestao(p, 'guia.docevida@fidz.test'),
  steps: [
    {
      target: btn('Configurações'),
      text: 'A assinatura e os dados da loja ficam em Configurações, no menu lateral. Clique para abrir o grupo.',
    },
    {
      target: btn('Plano e cobrança'),
      text: 'Clique em Plano e cobrança. Aqui estão o plano, o ciclo, quantas unidades você usa e a próxima cobrança.',
    },
    {
      target: btn('Trocar de plano'),
      text: 'Quer mudar de plano ou de ciclo? Clique em Trocar de plano.',
      wait: 1000,
    },
    {
      target: (p) => modal(p).getByRole('button', { name: 'Anual · −20%' }),
      text: 'Todos os planos têm os mesmos recursos: muda quantas unidades cabem. No ciclo anual, cada plano sai vinte por cento mais barato.',
      wait: 900,
    },
    {
      target: (p) => modal(p).getByRole('button', { name: 'Cancelar', exact: true }),
      text: 'Só estava conferindo? Clique em Cancelar para fechar sem trocar nada.',
      wait: 900,
    },
    {
      target: (p) => p.locator('[data-tour="billing.payment-method"]'),
      text: 'A forma de pagamento fica em Próxima cobrança. Dá para trocar entre cartão, Pix e boleto.',
      act: 'none',
    },
    {
      target: btn('Editar em Dados da empresa'),
      text: 'Os dados da nota da assinatura vêm de Dados da empresa. Clique em Editar em Dados da empresa.',
    },
    {
      target: (p) => p.getByPlaceholder('@perfil'),
      text: 'Nome, símbolo e categoria identificam a loja no app e no balcão. Tem Instagram? Informe o @perfil para ele aparecer na página da loja no app.',
      wait: 1200,
      act: (p, loc) => loc.fill('@docevidaconfeitaria'),
    },
    {
      target: (p) => p.getByPlaceholder('não preenchido'),
      text: 'O site é opcional. Se a loja tiver um, informe o endereço aqui.',
      act: (p, loc) => loc.fill('docevidaconfeitaria.com.br'),
    },
    {
      target: (p) => p.getByLabel('Razão social'),
      text: 'Mais abaixo ficam os dados fiscais. A Razão social e o CNPJ saem na nota da assinatura da Fidz.',
      act: 'none',
    },
    {
      target: (p) => p.locator('[data-tour="settings.save"]'),
      text: 'Pronto: clique em Salvar alterações. O app do cliente e o balcão já mostram os dados novos.',
    },
    {
      target: (p) => p.getByPlaceholder('@perfil'),
      text: 'Dados salvos. O Instagram e o site já aparecem na página da loja no app da Fidz.',
      act: 'none',
      toast: true,
      wait: 1200,
    },
  ],
};
