# Professional Hub App

Aplicacao React do Datacrash Professional Hub criada na Fase 1 do plano.

## Stack

1. React + TypeScript + Vite
2. Tailwind CSS + Radix Slot + utilitarios shadcn
3. React Router

## Rotas Base da Fase 1

1. /
2. /dashboard
3. /cv-ptbr
4. /cv-en
5. /sync-kit
6. /privacidade

## Scripts

1. npm run dev
2. npm run lint
3. npm run build
4. npm run build:pages
5. npm run profile:artifacts
6. npm run profile:sync

## Deploy

Workflow de GitHub Pages em [.github/workflows/professional-hub-pages.yml](../.github/workflows/professional-hub-pages.yml).

Observacao:

O build de Pages usa a variavel VITE_BASE_PATH (padrao `/`).
