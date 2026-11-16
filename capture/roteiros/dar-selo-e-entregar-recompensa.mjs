import { loginBalcao, sql } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const texto = (t) => (p) => p.getByText(t, { exact: true });

// A cliente aceita no app: o mesmo que authorize_redemption faz, sem o login dela.
const CLIENTE_ACEITA = `
  begin;
  update public.redemption_requests set status = 'authorized', resolution = 'app', resolved_at = now()
   where id = (select max(id) from public.redemption_requests where status = 'pending' and unit_id = 950);
  select public.apply_redemption((select max(id) from public.redemption_requests where status = 'authorized' and unit_id = 950));
  commit;`;

export default {
  slug: 'dar-selo-e-entregar-recompensa',
  section: 'balcao',
  order: 1,
  title: 'Dar selo e entregar a recompensa no balcão',
  description:
    'Veja como a equipe dá o selo de cada venda e, com a cartela completa, pede a autorização do cliente no app e entrega a recompensa.',
  login: (p) => loginBalcao(p, 'doce-vida-centro', 'DOCE-V26'),
  prepare: `delete from public.redemption_requests where unit_id = 950;`,
  steps: [
    {
      target: texto('Ana Paula'),
      text: 'Toque no seu nome para começar a atender.',
      wait: 1200,
    },
    {
      target: (p) => p.getByLabel('Celular do cliente'),
      text: 'Digite o celular da cliente, com DDD.',
      act: (p, loc) => loc.fill('11900095003'),
      wait: 1200,
    },
    {
      target: btn('Buscar cliente'),
      text: 'Toque em Buscar cliente.',
    },
    {
      target: texto('Adicionar selo'),
      text: 'A ficha mostra a cartela: a Beatriz tem 8 de 10 selos. Toque em Adicionar selo. O valor da venda é opcional e serve só para o relatório.',
      wait: 1200,
    },
    {
      target: texto('Selo registrado'),
      text: 'Selo registrado, no nome de quem atendeu. A cliente vê o selo no app na hora.',
      act: 'none',
      wait: 1000,
    },
    {
      target: texto('Próximo cliente'),
      text: 'Toque em Próximo cliente.',
    },
    {
      target: (p) => p.getByLabel('Celular do cliente'),
      text: 'Agora a Aline, que está com a cartela completa.',
      act: (p, loc) => loc.fill('11900095001'),
      wait: 1200,
    },
    {
      target: btn('Buscar cliente'),
      text: 'Toque em Buscar cliente.',
    },
    {
      target: texto('Pedir autorização no app'),
      text: 'A recompensa aparece em destaque no topo. Nesta loja, a entrega pede o aceite do cliente: toque em Pedir autorização no app.',
      wait: 1200,
    },
    {
      target: texto('Aguardando autorização no app'),
      text: 'Chega uma tela no celular da Aline. O balcão aguarda até ela aceitar. Sem bateria ou sem sinal? Há o caminho para liberar sem confirmação.',
      wait: 1200,
      act: async (p) => {
        sql(CLIENTE_ACEITA);
        await p.getByText('Próximo cliente', { exact: true }).waitFor({ timeout: 20_000 });
      },
    },
    {
      target: texto('Próximo cliente'),
      text: 'Pronto: a Aline aceitou e a recompensa foi entregue. A cartela dela recomeça do zero.',
      act: 'none',
      wait: 1000,
    },
  ],
};
