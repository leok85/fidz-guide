import { loginBalcao, sql } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });

// A cliente aceita no app: o mesmo que authorize_redemption faz, sem o login dela.
const CLIENTE_ACEITA = `
  begin;
  update public.redemption_requests set status = 'authorized', resolution = 'app', resolved_at = now()
   where id = (select max(id) from public.redemption_requests where status = 'pending');
  select public.apply_redemption((select max(id) from public.redemption_requests where status = 'authorized'));
  commit;`;

export default {
  slug: 'lancar-cashback-no-balcao',
  section: 'balcao',
  order: 0,
  title: 'Atender com cashback no balcão',
  description:
    'Veja como a equipe entra no balcão, escolhe o próprio nome, encontra o cliente pelo celular, usa o cashback com a autorização do cliente no app e registra a venda.',
  login: (p) => loginBalcao(p, 'bom-gosto', 'BOMG-C26', { preencher: false }),
  prepare: `delete from public.redemption_requests where unit_id = 953;`,
  steps: [
    {
      target: (p) => p.getByPlaceholder('nome-da-unidade'),
      text: 'O balcão abre no navegador do tablet da loja. Digite o usuário da unidade, que o dono encontra em Equipe, na Gestão.',
      act: (p, loc) => loc.fill('bom-gosto'),
    },
    {
      target: (p) => p.getByPlaceholder('Senha que o dono passou'),
      text: 'Digite a senha da unidade. A equipe toda usa a mesma.',
      act: (p, loc) => loc.fill('BOMG-C26'),
    },
    {
      target: (p) => p.locator('button[type="submit"]'),
      text: 'Toque em Entrar.',
    },
    {
      target: (p) => p.getByText('Ana Paula', { exact: true }),
      text: 'Toque no seu nome, aqui Ana Paula. Tudo o que você registrar fica no nome de quem atendeu.',
      wait: 1200,
    },
    {
      target: (p) => p.getByLabel('Celular do cliente'),
      text: 'O cliente aparece na fila quando aproxima o celular do display. Sem display, digite o celular dele com DDD em Não está na fila.',
      wait: 1200,
      act: (p, loc) => loc.fill('11900095205'),
    },
    {
      target: btn('Buscar cliente'),
      text: 'Toque em Buscar cliente.',
    },
    {
      target: (p) => p.getByPlaceholder('0,00'),
      text: 'A ficha da Camila mostra o cashback disponível. Informe o valor da venda, o total antes de qualquer desconto.',
      wait: 1200,
      act: (p, loc) => loc.fill('12000'),
    },
    {
      target: (p) => p.getByText(/^Usar R\$ .* do cashback nesta compra$/),
      text: 'Com o cashback marcado, o desconto sai nesta venda, até o teto que a loja definiu.',
      act: 'none',
      wait: 900,
    },
    {
      target: (p) => p.getByText('Cobrar na maquininha da loja'),
      text: 'Cobrar na maquininha da loja mostra o que a cliente paga: o valor da venda menos o desconto do cashback.',
      act: 'none',
    },
    {
      target: (p) => p.getByText('Pedir autorização no app', { exact: true }),
      text: 'Como esta loja pede a autorização do cliente, toque em Pedir autorização no app. Chega uma tela no celular da Camila.',
    },
    {
      target: (p) => p.getByText('Aguardando autorização no app'),
      text: 'O balcão fica aguardando até a cliente aceitar no app. Nada é registrado antes disso.',
      wait: 1200,
      act: async (p) => {
        sql(CLIENTE_ACEITA);
        await p.getByText('Venda registrada', { exact: true }).waitFor({ timeout: 20_000 });
      },
    },
    {
      target: (p) => p.getByText('Venda registrada', { exact: true }),
      text: 'Pronto: a Camila aceitou e a venda foi registrada. O cashback novo é calculado sobre o valor que ela pagou.',
      act: 'none',
      wait: 900,
    },
    {
      target: (p) => p.getByText('Próximo cliente', { exact: true }),
      text: 'Toque em Próximo cliente para voltar à busca.',
    },
    {
      target: (p) => p.getByText('Camila Rocha', { exact: true }).first(),
      text: 'A Camila aparece em Atendidos agora há pouco. Para atender alguém da lista de novo, é só tocar no nome.',
      act: 'none',
      wait: 1200,
    },
  ],
};
