#!/bin/bash
# Envia as atualizações do projeto para o GitHub
# Uso: bash scripts/push-github.sh "mensagem do commit"

MSG="${1:-Atualização do sistema}"

git add -A
git commit -m "$MSG" 2>/dev/null || echo "(sem alterações novas para commitar)"
git push "https://${GITHUB_TOKEN}@github.com/gregzinho882-design/atacadao-sistema.git" HEAD:main

echo "✅ Enviado para: https://github.com/gregzinho882-design/atacadao-sistema"
