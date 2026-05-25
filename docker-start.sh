#!/bin/sh
set -e

echo "==> Aplicando schema do banco de dados..."
cd /app && pnpm --filter @workspace/db run push-force

echo "==> Iniciando Atacadão Frios na porta 3000..."
exec node --enable-source-maps /app/artifacts/api-server/dist/index.mjs
