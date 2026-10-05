# Landing "Pranzo sulla Domiziana" — Lido Pino d'Oro

Pagina di destinazione della campagna Google Ads (obiettivo: visite al locale). È una pagina statica, generata da pochi file di dati, con tre note legali e un automatismo che legge le recensioni dalla scheda Google del ristorante. Non dipende dal sito principale: nessun database, nessun widget.

Le regole di lavoro sono in `CLAUDE.md`; il perché delle scelte in `docs/DECISIONS.md`.

## Cosa c'è nel repository

| Cartella o file | Cosa contiene |
| --- | --- |
| `data/restaurant.json` | nome, contatti, orari per giorno, dati del titolare, scheda Google, impostazioni di Google Ads, messaggi WhatsApp, regole delle recensioni, hosting |
| `data/menu.json` | menu SMART e PLUS, piatti alla carta, coperto, offerta di benvenuto, data del menu |
| `src/` | i modelli delle quattro pagine (`index.html`, `termini.html`, `privacy.html`, `cookie.html`) con segnaposto `{{chiave}}`, e `src/assets/` con stile, script, foto WebP, loghi, caratteri (licenza in `src/assets/caratteri/OFL.txt`) |
| `scripts/costruisci.mjs` | genera `_sito/`, l'unica cartella da pubblicare; con `--hostinger` aggiunge i file PHP |
| `scripts/aggiorna-recensioni.mjs` | scarica le recensioni dalla scheda Google e scrive `recensioni.json` (per GitHub Actions) |
| `scripts/servi.mjs` | server locale per guardare `_sito/` nel browser |
| `hostinger/` | `recensioni.php`, `aggiorna-recensioni.php`, `recensioni-lib.php`, `config.example.php`, `.htaccess`: servono solo su Hostinger |
| `recensioni-escluse.txt` | recensioni da non mostrare mai (una per riga); non viene pubblicato su GitHub Pages, su Hostinger è bloccato da `.htaccess` |
| `test/` | la suite (`npm test`), con risposte di esempio dell'API di Google: non serve la chiave |
| `docs/` | `DECISIONS.md` (perché) e `voce.md` (voce di marca e affermazioni da confermare) |
| `.github/workflows/` | pubblicazione su GitHub Pages, aggiornamento giornaliero delle recensioni, caricamento FTP facoltativo |
| `LICENSE` | licenza BSD del solo codice: testi, dati, foto, loghi e icone restano riservati |

Non sono nel repository, di proposito: `_sito/` (si rigenera), `recensioni.json` (si rigenera a ogni pubblicazione, così nomi e testi di Google non restano nella cronologia di git), `config.php` (contiene la chiave di Google, vive solo sul server).

## Comandi

```
npm test                  esegue i test (dati, costruzione, recensioni, parità Node/PHP se php è installato)
npm run build             costruisce _sito/ per GitHub Pages
npm run build:hostinger   costruisce _sito/ con i file PHP, da caricare su Hostinger
npm run recensioni        scarica le recensioni (serve GOOGLE_PLACES_API_KEY nell'ambiente)
npm run dev               costruisce e serve _sito/ su http://localhost:8080/
```

Serve Node 20.10 o superiore. Nessuna dipendenza da installare.

## Come si cambia qualcosa

- **Un prezzo, un piatto, un orario, un numero di telefono**: in `data/menu.json` o `data/restaurant.json`. Poi `npm test` e `npm run build`. Il dato compare uguale nella landing, nei termini e nei dati strutturati.
- **I dati del titolare** (ragione sociale, P.IVA, REA, PEC, via, dominio su Hostinger, data center, conservazione dei log, sito principale): in `data/restaurant.json`. Finché un campo è `null` le pagine mostrano `TODO(titolare): …` evidenziato in giallo e `npm run build` elenca i campi mancanti. Un campo `""` toglie la riga (per esempio il Registro delle imprese per una ditta individuale). **Prima di far partire annunci a pagamento non deve restare nessun TODO**: una pagina con segnaposto visibili è un'omissione informativa (art. 22 Codice del consumo).
- **Un testo**: nei modelli in `src/`. Le frasi che contengono dati usano i segnaposto: non scrivere mai un prezzo o un orario a mano nell'HTML.
- **Una foto**: in `src/assets/foto/`, in WebP, due larghezze (1200 e 720 px), e aggiornare `src`, `srcset`, `alt`, `width`, `height` e didascalia nel modello. Le foto ancora da fare sono elencate in `docs/voce.md`.
- **Google Ads**: `google.adsId` (es. `AW-123456789`) e le cinque etichette in `google.conversioni` di `data/restaurant.json`. Con l'ID impostato compare il banner cookie: il tag di Google parte solo dopo "Accetta".

## Indirizzi da mettere negli annunci

```
Gruppo 1 - Pranzo di lavoro:       https://TUODOMINIO/domiziana/?g=lavoro
Gruppo 2 - Sosta sulla Domiziana:  https://TUODOMINIO/domiziana/?g=sosta
```

Il parametro cambia il titolo, mette per prima la scheda giusta e viene allegato a ogni conversione. Per gli annunci a pagamento usa l'indirizzo su Hostinger: GitHub Pages è gratuito, con limiti d'uso e non pensato per siti commerciali; tienilo come anteprima.

## Pulsanti

Chiama e WhatsApp usano il numero di `data/restaurant.json`. I messaggi WhatsApp sono precompilati e diversi per pulsante, per capire da dove arriva il cliente: `DOMIZIANA LAVORO`, `DOMIZIANA SOSTA`, `DOMIZIANA`. "Portami lì" apre Google Maps sulla scheda del Lido (Place ID in `google.placeId`).

## Recensioni Google automatiche

Il blocco "Le recensioni" (voto, numero di recensioni, le recensioni) si aggiorna da solo dalla scheda Google del Lido. Ogni mattina (7:23 ora italiana d'estate, 6:23 d'inverno) il workflow "Aggiorna le recensioni Google" interroga l'API ufficiale di Google Maps Platform (Places API (New)), scrive `recensioni.json` e ripubblica la pagina. Google espone al massimo 5 recensioni per lingua; lo script le chiede in italiano e in inglese e tiene solo quelle scritte davvero in quella lingua (mai le traduzioni automatiche).

Nel file entrano solo le recensioni che la pagina può mostrare: almeno 4 stelle (`recensioni.stelleMinime` in `data/restaurant.json`), almeno 20 caratteri, pubblicate da meno di due anni (legge 34/2026), senza parole dell'elenco `PAROLE_ESCLUSE` degli script, non presenti in `recensioni-escluse.txt`. Tre vengono messe in evidenza, una per tema (servizio, viaggio, cibo). I testi sono integrali: oltre 8 righe la pagina li ripiega con "Mostra tutto". Ogni recensione porta l'attribuzione come la fornisce Google (nome pubblico con link al profilo, link alla recensione, link "Segnala"), che le condizioni di Google non permettono di modificare. La pagina e i termini (punto 7) dicono ai visitatori come le recensioni vengono scelte e ordinate, come chiedono il Codice del consumo e la legge 34/2026. Senza dati la sezione mostra solo il link alla scheda Google.

Per escludere una recensione: una riga in `recensioni-escluse.txt`, meglio un pezzo del link della recensione (così nel file non compare nessun nome) oppure il nome come appare su Google. Al prossimo aggiornamento sparisce.

Attivazione, una volta sola:

1. Su https://console.cloud.google.com crea un progetto, attiva "Places API (New)" e la fatturazione (obbligatoria; la quota gratuita mensile copre ampiamente le due chiamate al giorno di questo automatismo; imposta comunque un avviso di budget).
2. Crea una chiave API limitata alla sola "Places API (New)".
3. Nel repository, Settings > Secrets and variables > Actions > Secrets: `GOOGLE_PLACES_API_KEY` = la chiave. Il Place ID è già in `data/restaurant.json` (la variabile `GOOGLE_PLACE_ID` lo sovrascrive, se serve).
4. Actions > "Aggiorna le recensioni Google" > Run workflow. Da lì in poi va da solo.

Google chiede di accompagnare i dati con il logo "Google Maps": oggi c'è la dicitura testuale "Voto e recensioni forniti da Google Maps"; il logo ufficiale va scaricato dalle linee guida di attribuzione di Google Maps Platform e messo al posto del testo (versione per sfondo chiaro e scuro).

## Pubblicazione

**GitHub Pages.** A ogni push su `main` il workflow esegue i test, scarica le recensioni, costruisce `_sito/` e la pubblica su https://ristorantepinodoro.github.io/landing-domiziana/. Se Pages non è attivo: Settings > Pages > Source "GitHub Actions".

**Hostinger** (o altro hosting con PHP 8.1+). La copia su Hostinger è indipendente da GitHub: lì le recensioni si rinnovano da sole grazie a `recensioni.php`, che risponde al posto di `recensioni.json` (regola in `.htaccess`) e lo rinnova da Google quando ha più di un giorno; se Google non risponde, resta il file precedente e si riprova al massimo ogni ora.

1. `npm run build:hostinger`, poi carica il contenuto di `_sito/` (compreso `.htaccess`, file nascosto) in `public_html/domiziana/` con il File Manager di hPanel: `index.html` deve stare direttamente in quella cartella. La pagina risponde su `https://tuodominio.it/domiziana/`. Il sito esistente, anche WordPress, non cambia: la cartella è indipendente e `.htaccess` la isola dalle regole del sito principale (non creare in WordPress una pagina con lo stesso slug).
2. Nel File Manager duplica `config.example.php` in `config.php` e compila `api_key` (la chiave di Google Maps Platform) e `token` (una frase lunga e segreta). `config.php` viene eseguito da PHP, non è mai mostrato ai visitatori ed è bloccato anche da download diretto.
3. (Facoltativo) hPanel > Avanzate > Cron Job, ogni giorno alle 7: `php /home/UTENTE/domains/TUODOMINIO/public_html/domiziana/aggiorna-recensioni.php`.
4. Prova dal browser: `https://tuodominio.it/domiziana/aggiorna-recensioni.php?token=IL_TOKEN` risponde con una riga ("Aggiornato recensioni.json: …" oppure "Nessuna novità: …"); senza token risponde "Accesso negato".

Se le recensioni non si aggiornano: apri `recensioni.json` e guarda la riga `aggiornato`; nelle intestazioni della risposta `X-Recensioni` dice cosa è successo (`non-necessario`, `aggiornato`, `invariato`, `rinviato`, `in-corso`, `fallito`, con i dettagli nel log errori PHP di hPanel); controlla che `config.php` e `.htaccess` siano nella cartella.

**Caricamento automatico da GitHub a Hostinger** (facoltativo): impostando nel repository le variabili `HOSTINGER_FTP_HOST`, `HOSTINGER_FTP_DIR` (es. `public_html/domiziana/`), `HOSTINGER_FTP_PROTOCOL` (`ftps`) e i secret `HOSTINGER_FTP_USER`, `HOSTINGER_FTP_PASSWORD` (hPanel > File > Account FTP), i workflow caricano `_sito/` via FTP a ogni push e ogni mattina. `config.php` non viene mai toccato.

## Tema scuro e Safari

La pagina segue il tema del dispositivo; il pulsante rotondo nella testata (luna o sole) permette di scegliere l'altro e la scelta resta nel browser (`localStorage`, nessun cookie). I colori sono nelle variabili in cima a `src/assets/stile.css` e `src/assets/legale.css`. Il passaggio tra i temi è animato (cerchio dal pulsante, o dissolvenza); con "riduci animazioni" è immediato. La barra fissa dei pulsanti in basso è costruita per Safari 26 (vedi `docs/DECISIONS.md`): non spostare sfondo e sfocatura sull'elemento fisso.

## Note legali, privacy e cookie

In fondo alla landing ci sono i dati del titolare (P.IVA obbligatoria, art. 35 DPR 633/72) e i collegamenti a termini, privacy e cookie policy, scritte per questa pagina: niente vendite online, contatti via telefono e WhatsApp, recensioni da Google, caratteri in casa, cookie solo per Google Ads e solo con consenso. Le scelte già scritte, da confermare o cambiare: messaggi WhatsApp conservati al massimo 12 mesi, nessun DPO, risposta "Sì" al pagamento con carta (obbligo di legge), tempi di servizio come impegno e non garanzia. Su Hostinger accettare il DPA nell'area clienti.

Banner cookie: compare solo con `google.adsId` impostato. Prima della scelta non parte nulla verso Google; "Accetta" carica il tag con la modalità consenso (solo misurazione, niente personalizzazione); "Rifiuta", la X e il tasto Esc non caricano nulla; i due pulsanti sono identici; la scelta dura 6 mesi e si cambia da "Preferenze cookie"; la revoca cancella i cookie di Google Ads e ricarica la pagina senza tag.

## Misurazione

- Parole chiave WhatsApp: `DOMIZIANA LAVORO`, `DOMIZIANA SOSTA`, `DOMIZIANA`.
- Al tavolo: "Come ci hai trovato?", con l'opzione "Google".
- Ogni lunedì: spesa della campagna, indicazioni stradali, chiamate, clic WhatsApp, costo per azione.
