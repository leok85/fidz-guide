import path from 'node:path';
import { loginAfiliado } from '../run.mjs';

const btn = (name) => (p) => p.getByRole('button', { name, exact: true });
const nav = (name) => (p) => p.getByRole('link', { name, exact: true }).or(p.getByRole('button', { name, exact: true }));
const NOTA = path.join(import.meta.dirname, '..', 'arquivos', 'nota-fiscal-exemplo.pdf');

export default {
  slug: 'afiliado-sacar',
  section: 'afiliados',
  sectionTitle: 'Programa de afiliados',
  order: 2,
  title: 'Sacar as comissões no Pix',
  description:
    'Veja como o afiliado PJ saca o saldo disponível: emite a nota fiscal de serviço com os dados do tomador, anexa e acompanha a análise.',
  login: (p) => loginAfiliado(p, 'afiliado.guia@fidz.test'),
  steps: [
    {
      target: nav('Ganhos e saque'),
      text: 'Com pelo menos 100 reais disponíveis, dá para sacar. Abra Ganhos e saque.',
      wait: 1200,
    },
    {
      target: btn('Sacar no Pix'),
      text: 'Clique em Sacar no Pix.',
      wait: 1200,
    },
    {
      target: (p) => p.getByText('Nota fiscal de serviço', { exact: true }),
      text: 'O saque é do saldo disponível inteiro, na chave Pix do seu cadastro. Emita a nota fiscal de serviço com o tomador, o CNPJ e o valor mostrados aqui.',
      act: 'none',
      wait: 1000,
    },
    {
      target: (p) => p.getByText('Anexar nota fiscal', { exact: true }),
      text: 'Clique em Anexar nota fiscal e escolha o PDF ou o XML da nota, até 5 MB.',
      act: (p) => p.locator('input[type="file"]').setInputFiles(NOTA),
    },
    {
      target: btn('Enviar nota e sacar'),
      text: 'Clique em Enviar nota e sacar.',
      wait: 1000,
    },
    {
      target: (p) => p.getByText(/^(Saque solicitado|Nota em análise)/).first(),
      text: 'Pronto: a nota vai para análise. Aprovada, o Pix cai em até 2 dias úteis. Se a nota for recusada, aparece o motivo e dá para enviar outra.',
      act: 'none',
      toast: true,
      wait: 1800,
    },
  ],
};
