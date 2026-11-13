# fidz-guide

Guia interativo da Fidz (substitui o showcase do Supademo em guia.fidz.com.br).

Site estático em Vite + React. Cada demo é uma sequência de passos com screenshot ou vídeo,
um hotspot clicável, um texto e a narração em áudio.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (estático)
```

## Conteúdo

- `content/guide.json`: seções, demos e passos (fonte única do conteúdo)
- `public/media/`: screenshots, vídeos, narrações (mp3) e legendas (vtt)

Formato de um passo:

```json
{
  "image": "/media/….jpg",       // ou "video": "/media/….mp4" (avança sozinho ao terminar)
  "audio": "/media/….mp3",
  "narration": "Texto narrado",
  "hotspot": { "x": 92.7, "y": 15.1, "text": "Texto do balão" },  // x/y em % da imagem
  "chapter": null                // ou tela de abertura com heading/description/buttons
}
```

A tela final de cada guia (carimbo "Guia concluído", progresso no assunto e próximo guia) é gerada pelo player.

## Navegação

Central de guias: menu lateral com os assuntos agrupados por perfil (dono da loja, equipe do
balcão), busca em todos os guias e grade de cards com filtro por estado (não vistos, em
andamento, concluídos).

- `/`: todos os guias, agrupados por assunto
- `/:secao`: os guias de um assunto
- `/:secao/:guia`: o player
- `?busca=`: a busca fica na URL, dá para compartilhar

Cada seção do Supademo é um assunto. Nome, perfil e descrição de cada assunto ficam em
`src/presentation.ts`, fora do `guide.json`, para não serem sobrescritos pelo export. Seção nova
sem entrada lá aparece com o título do Supademo, no grupo do dono. O progresso de cada pessoa
fica só no navegador dela (`localStorage`).

Visual: tokens do Fidz Design System (Poppins, roxo `#6B2EBA`, botões e etiquetas em cápsula,
amarelo só para "concluído").

## Reimportar do Supademo

```bash
npm run export   # node scripts/export-supademo.mjs [showcaseId]
```

Lê o showcase público, regrava `content/guide.json` e baixa as mídias que faltam.
Só é necessário enquanto o conteúdo ainda for editado no Supademo.

## Deploy

`vercel.json` já tem o rewrite de SPA e o cache longo para `/media`.
