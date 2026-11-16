import { loginGestao, sql } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const modal = (p) => p.getByTestId('modal-panel');
const ASSUNTO = 'Tablet da Loja Shopping pede a senha toda manhã';

export default {
  slug: 'abrir-e-encerrar-um-chamado-de-suporte',
  section: 'introducao',
  order: 4,
  title: 'Abrir e encerrar um chamado de suporte',
  description:
    'Veja como pedir ajuda à equipe da Fidz pela Gestão: escolha o assunto, descreva o problema, acompanhe a resposta e encerre o chamado.',
  login: (p) => loginGestao(p, 'guia.docevida@fidz.test'),
  // Chamados de rodadas anteriores saem da lista.
  prepare: `delete from public.merchant_support_ticket_messages where ticket_id in (select id from public.merchant_support_tickets where company_id = 950);
            delete from public.merchant_support_tickets where company_id = 950;`,
  steps: [
    {
      target: btn('Suporte'),
      text: 'Tudo o que você conversa com a equipe da Fidz fica em Suporte, no canto de baixo do menu lateral.',
    },
    {
      target: btn('Abrir chamado'),
      text: 'Algo no balcão, na fidelidade ou na cobrança não está certo? Clique em Abrir chamado.',
      wait: 900,
    },
    {
      target: (p) => modal(p).getByRole('button', { name: 'Acesso', exact: true }),
      text: 'Escolha o assunto. Acesso é para problemas de login na Gestão ou no tablet do balcão. Cobrança é para plano, fatura ou pagamento.',
      wait: 800,
    },
    {
      target: (p) => modal(p).getByPlaceholder('Em uma linha, o que aconteceu'),
      text: 'Resuma o problema em uma linha. É a primeira coisa que a equipe da Fidz lê.',
      act: (p, loc) => loc.fill(ASSUNTO),
    },
    {
      target: (p) => modal(p).locator('textarea'),
      text: 'Conte os detalhes: quando aconteceu, em qual unidade e com qual cliente, se for o caso.',
      act: (p, loc) =>
        loc.fill('Desde segunda, o tablet da Loja Shopping sai do balcão durante a noite e pede a senha de novo quando a loja abre.'),
    },
    {
      target: btn('Enviar chamado'),
      text: 'Clique em Enviar chamado. Ele fica Em análise na Fidz até a equipe responder.',
    },
    {
      // A resposta da Fidz, como o Admin faria.
      before: async (p) => {
        // Grava como alguém da equipe Fidz (admin_users), como o Admin faria: é o que o gatilho exige.
        sql(`begin;
             select set_config('request.jwt.claims', '{"sub":"e2e00000-0000-4000-8000-000000000999","role":"authenticated"}', true);
             insert into public.merchant_support_ticket_messages (ticket_id, author_name, author_role, body)
             select id, 'Camila', 'Suporte Fidz',
                    'Oi, Helena! O tablet sai do balcão quando o navegador limpa os dados à noite. Nas configurações do navegador do tablet, desligue a limpeza automática de dados ao fechar. Se continuar, nos avise por aqui.'
               from public.merchant_support_tickets where company_id = 950 order by id desc limit 1;
             update public.merchant_support_tickets set status = 'aguardando' where company_id = 950;
             commit;`);
        await p.reload();
      },
      target: btn('Responder'),
      text: 'Quando a Fidz responde, o chamado passa para Aguardando você e aparece este aviso. Clique em Responder para ler a resposta.',
      wait: 1500,
    },
    {
      target: (p) => p.getByPlaceholder('Escreva para o suporte da Fidz'),
      text: 'A resposta da Fidz aparece na conversa. Precisa responder ou mandar um print? Escreva aqui e clique em Enviar resposta.',
      act: 'none',
      wait: 1200,
    },
    {
      target: btn('Encerrar chamado'),
      text: 'Problema resolvido? Clique em Encerrar chamado para fechar o atendimento.',
    },
    {
      target: (p) => p.getByText('Resolvido', { exact: true }).last(),
      text: 'Pronto: o chamado fica como Resolvido. Se voltar a acontecer, abra um novo citando o protocolo.',
      act: 'none',
      toast: true,
      wait: 1200,
    },
  ],
};
