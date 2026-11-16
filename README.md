# fidz-guide

Guia interativo da Fidz (guia.fidz.com.br).

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

Nome, perfil e descrição de cada assunto ficam em `src/presentation.ts`. Assunto novo sem
entrada lá aparece com o título da seção, no grupo do dono. O progresso de cada pessoa
fica só no navegador dela (`localStorage`).

Visual: tokens do Fidz Design System (Poppins, roxo `#6B2EBA`, botões e etiquetas em cápsula,
amarelo só para "concluído").

## Capturar os guias

As telas, os hotspots e a narração saem das telas reais da Gestão e do balcão, rodando contra o
fidz-local (supabase local). Cada guia tem um roteiro em `capture/roteiros/<slug>.mjs`.

Uma vez por máquina:

```bash
python3.12 -m venv capture/.venv && capture/.venv/bin/pip install piper-tts
# voz pt_BR faber (fica fora do git)
curl -L -o capture/voices/pt_BR-faber-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx
curl -L -o capture/voices/pt_BR-faber-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json
```

Antes de capturar, suba a Gestão na 5181 e o balcão na 5182 apontando para o fidz-local
(`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` de `supabase status`, analytics vazios).

```bash
npm run capture -- gerenciar-unidades-e-equipe   # um guia (ou vários slugs, ou --all)
npm run capture:contato -- gerenciar-unidades-e-equipe   # folha de revisão em capture/.out/
```

- `capture/seed.sql`: lojas de demonstração (Doce Vida Confeitaria, Café Grão da Serra, Empório
  Bom Gosto). Cada captura recria tudo antes de começar.
- Prints sempre em 2880×1564 (janela 1440×782, escala 2x). O hotspot é medido no elemento real.
- Narração: Piper, voz pt_BR faber. O texto do passo é também o do balão.
- A busca de lojas no Google responde com lojas fictícias (`capture/google-mock.mjs`), nunca
  com uma loja real.
- Depois de cada captura, `public/media` perde o que o `guide.json` não usa mais.
- `node capture/peek.mjs <email> "clique:Fidelidade" "print:nome"` ajuda a escrever roteiros.

### Guias do app do cliente

Roteiros com `device: 'phone'`: o app roda no build web (o mesmo dos testes do fidz-app), em tela de
celular 390×844, centralizada na moldura de 2880×1564. A câmera do player aproxima o celular em
cada passo. A conta é a da Beatriz Nunes (seed), que entra sem digitar código: a sessão do
fidz-local é posta no armazenamento antes de o app abrir.

```bash
# build web apontando para o fidz-local (--clear: sem ele o Metro pode reaproveitar o .env de produção)
cd ../fidz-app && EXPO_NO_DOTENV=1 EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421 \
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<chave de supabase status> \
  npx expo export --platform web --clear --output-dir ../fidz-guide/capture/.out/app-web
cd ../fidz-guide && E2E_DIST=capture/.out/app-web E2E_PORT=5184 node ../fidz-app/e2e/serve.mjs
```

A captura bloqueia qualquer chamada a `*.supabase.co`: nada sai do fidz-local. A aba Descobrir usa
o mapa nativo e não roda no build web; esse guia precisa do simulador.

## Deploy

`vercel.json` já tem o rewrite de SPA e o cache longo para `/media`.
