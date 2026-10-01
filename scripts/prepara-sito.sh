#!/bin/bash
# Copia in _sito/ solo i file da pubblicare: la pagina, le note legali, stile, loghi, icone, foto, caratteri e
# recensioni.json. Niente script, workflow, README, licenza ne' recensioni-escluse.txt (che contiene richieste di
# esclusione). Con --hostinger aggiunge i file PHP, config.example.php, .htaccess e recensioni-escluse.txt, che su
# Hostinger servono al rinnovo delle recensioni e sono bloccati da .htaccess.
set -e
cd "$(dirname "$0")/.."
rm -rf _sito
mkdir -p _sito
cp index.html termini.html privacy.html cookie.html legale.css logo.png logo-scuro.png favicon.ico favicon-32.png favicon-512.png apple-touch-icon.png .nojekyll _sito/
cp -r foto caratteri _sito/
[ -f recensioni.json ] && cp recensioni.json _sito/
if [ "$1" = "--hostinger" ]; then
  cp recensioni.php recensioni-lib.php aggiorna-recensioni.php config.example.php recensioni-escluse.txt .htaccess _sito/
fi
echo "_sito pronta: $(find _sito -type f | wc -l) file"
