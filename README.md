# IsFair — Street Price & Cash Shield

Validador de preços de rua e assistente visual de cédulas para turistas estrangeiros no Brasil.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173 (também exposto na rede local para testar no celular)
npm run build    # typecheck + build de produção
```

## Reconhecimento por foto (Gemini, plano gratuito)

1. Crie uma chave grátis em https://aistudio.google.com/apikey
2. Copie `.env.example` para `.env.local` e cole a chave em `GEMINI_API_KEY`
3. Reinicie o `npm run dev`

A chave fica só no servidor: no dev, o Vite atende `/api/identify` (ver `vite.config.ts`);
em produção, a Vercel roda `api/identify.ts`. Os dois usam `server/identify.ts`.
No plano gratuito o Google pode usar as fotos enviadas para melhorar os produtos dele.

### Publicar na Vercel (grátis)

1. Suba o projeto para o GitHub e importe em https://vercel.com/new (Root Directory: `isfair`)
2. Em Settings → Environment Variables, adicione `GEMINI_API_KEY`
3. Deploy

## Estrutura

```
src/
├── App.tsx                 # estado global, navegação entre telas
├── types/                  # tipos TypeScript
├── data/mockData.ts        # cidades, moedas, produtos/faixas/dicas, cédulas e moedas
├── lib/
│   ├── pricing.ts          # faixas por cidade, veredito semáforo, stats da comunidade
│   ├── cash.ts             # carteira, troco (guloso), sugestão de notas
│   └── format.ts           # formatação BRL/moeda estrangeira, parsing
├── hooks/
│   ├── useLiveRates.ts     # câmbio simulado oscilando em tempo real
│   └── useLocalStorage.ts  # persistência (cidade, moeda, histórico, relatos)
├── components/             # Header, BottomNav, cédulas/moedas, UI base (Button, Card)
└── screens/                # Scanner, Resultado, Cash Helper, Histórico
```

## Como os preços são calculados

Cada produto tem uma faixa base (Rio de Janeiro) em `mockData.ts`: `fairMin`, `fairMax`, `touristMax`.
Cada cidade aplica um `priceFactor` (ex.: Fortaleza 0,8). O veredito é:

- 🟢 **Justo**: preço ≤ `fairMax`
- 🟡 **Área turística**: `fairMax` < preço ≤ `touristMax`
- 🔴 **Abusivo / Gringo Tax**: preço > `touristMax`

Todos os dados (faixas, câmbio, reconhecimento de imagem e relatos da comunidade) são simulados.
