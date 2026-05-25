# Atacadão Frios — Sistema de Armazém

Sistema web para gerenciamento de estoque e códigos de balança do Atacadão Frios. Funciona no PC e no celular (PWA instalável).

## Rodar no seu PC (Docker — recomendado)

**Pré-requisito:** ter o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

```bash
# 1. Clone o repositório
git clone https://github.com/gregzinho882-design/atacadao-sistema.git
cd atacadao-sistema

# 2. Copie e edite as variáveis de ambiente (opcional — os padrões já funcionam)
cp .env.example .env

# 3. Suba o sistema (banco + app)
docker compose up --build
```

Acesse em: **http://localhost:3000**

Para rodar em segundo plano: `docker compose up --build -d`  
Para parar: `docker compose down`  
Para parar e apagar os dados: `docker compose down -v`

## Logins disponíveis

| Usuário   | Senha       |
|-----------|-------------|
| Admin     | Adm1962     |
| Gregory   | Greg01      |
| Thales    | Thales02    |
| Andrews   | Andrews03   |
| Christian | Christian04 |
| Heryc     | Heryc05     |

## Desenvolvimento (Replit)

- `pnpm --filter @workspace/api-server run dev` — API na porta 5000
- `pnpm run typecheck` — typecheck completo
- `pnpm run build` — typecheck + build
- `pnpm --filter @workspace/api-spec run codegen` — regerar hooks e schemas da spec OpenAPI
- `pnpm --filter @workspace/db run push` — aplicar schema no banco (dev)
- Env obrigatório: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validação: Zod, drizzle-zod
- Roteamento: wouter
- PWA: manifest.json + service worker

## Onde estão os arquivos principais

- Frontend: `artifacts/atacadao/src/`
- API: `artifacts/api-server/src/`
- Schema do banco: `lib/db/src/schema/index.ts`
- Spec OpenAPI: `lib/api-spec/`
- Docker: `Dockerfile`, `docker-compose.yml`, `docker-start.sh`

## User preferences

- Idioma: Português brasileiro
- Tema: vermelho Atacadão (`--primary: 354 78% 46%`)
- Sempre subir para o GitHub após checkpoints: `bash scripts/push-github.sh "mensagem"`
