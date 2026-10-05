#!/usr/bin/env bash
# Publie le dossier app/ sur la branche gh-pages (GitHub Pages).
# Prérequis : dépôt git avec un remote « origin », modifications commitées.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
if [ -n "$(git status --porcelain)" ]; then
  echo "Des fichiers ont changé pendant la construction : committez-les avant de publier." >&2
  git status --short >&2
  exit 1
fi
git branch -D gh-pages-build 2>/dev/null || true
git subtree split --prefix app -b gh-pages-build
git push -f origin gh-pages-build:gh-pages
git branch -D gh-pages-build
echo "Publié sur la branche gh-pages."
