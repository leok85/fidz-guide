import path from 'node:path';
import { loginGestao } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const CSV = path.join(import.meta.dirname, '..', 'arquivos', 'clientes-do-cartao-de-papel.csv');

export default {
  slug: 'importar-clientes',
  section: 'clientes',
  sectionTitle: 'Clientes e comunicações',
  order: 1,
  title: 'Importar clientes de uma planilha',
  description:
    'Veja como trazer para a Fidz os clientes que você já tinha, da Fidelimax ou de uma planilha, com o saldo de cada um.',
  login: (p) => loginGestao(p, 'guia.docevida@fidz.test'),
  prepare: `delete from public.customer_import_entries where company_id = 950;
            delete from public.customer_imports where company_id = 950;`,
  steps: [
    {
      target: btn('Clientes'),
      text: 'Já tinha clientes em outro sistema ou no cartão de papel? Comece em Clientes, no menu lateral.',
    },
    {
      target: btn('Importar clientes'),
      text: 'Clique em Importar clientes.',
      wait: 1200,
    },
    {
      target: (p) => p.getByText('Fidelimax', { exact: true }),
      text: 'Vindo da Fidelimax? Cole o token da API e a Fidz traz todos os clientes, com o saldo de cada um.',
      act: 'none',
      wait: 900,
    },
    {
      target: (p) => p.getByText('Planilha', { exact: true }),
      text: 'De qualquer outro sistema, use uma planilha CSV. Aqui, Planilha.',
    },
    {
      target: btn('Continuar'),
      text: 'Clique em Continuar.',
    },
    {
      target: btn('Baixar planilha modelo'),
      text: 'Se precisar, baixe a planilha modelo: uma linha por cliente, com o celular, o nome e o saldo.',
      act: 'none',
      wait: 900,
    },
    {
      target: (p) => p.getByText('Escolher arquivo CSV', { exact: true }),
      text: 'Clique em Escolher arquivo CSV e envie a planilha. No Excel, salve como CSV.',
      act: (p) => p.locator('input[type="file"]').setInputFiles(CSV),
    },
    {
      target: btn('Ver prévia'),
      text: 'A Fidz reconhece as colunas de celular, nome e saldo. Confira e clique em Ver prévia.',
      wait: 1200,
    },
    {
      target: (p) => p.getByText(/sem celular válido/),
      text: 'A prévia mostra quantos clientes entram. Linha sem celular fica de fora: na Fidz, o cliente é identificado pelo celular.',
      act: 'none',
      wait: 1500,
    },
    {
      target: (p) => p.locator('#import-unit'),
      text: 'Escolha a unidade onde os clientes entram. O saldo importado segue as regras da sua fidelidade.',
      act: (p, loc) => loc.selectOption({ label: 'Loja Centro' }),
    },
    {
      target: (p) => p.getByRole('button', { name: /^Importar/ }),
      text: 'Tudo certo? Clique para importar.',
    },
    {
      target: (p) => p.getByText(/clientes? importados?$/),
      text: 'Pronto: os clientes já estão na Fidz, com o saldo. Ninguém recebe mensagem agora: o convite para baixar o app sai na próxima compra.',
      act: 'none',
      wait: 2500,
    },
  ],
};
