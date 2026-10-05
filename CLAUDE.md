# CLAUDE.md — Landing "Pranzo sulla Domiziana", Lido Pino d'Oro

Istruzioni per chi (umano o IA) lavora su questo repository. Il progetto è la pagina di destinazione della campagna Google Ads del **Lido Pino d'Oro**, ristorante sulla spiaggia a Mondragone (CE): una pagina statica, le sue tre note legali e l'automatismo che legge le recensioni dalla scheda Google.

## Panoramica del progetto

- `data/restaurant.json`, `data/menu.json`: l'unica fonte di prezzi, orari, contatti, dati del titolare e impostazioni. Un campo `null` è un dato ancora da avere (compare nelle pagine come `TODO(titolare)`), un campo `""` è "non applicabile".
- `src/`: i modelli HTML (`index.html`, `termini.html`, `privacy.html`, `cookie.html`) con segnaposto `{{chiave}}`, e `src/assets/` con stile, script, foto (WebP), loghi, caratteri.
- `scripts/costruisci.mjs`: genera `_sito/` (la cartella pubblicata) da `data/` e `src/`; con `--hostinger` aggiunge i file di `hostinger/`.
- `scripts/aggiorna-recensioni.mjs` e `hostinger/recensioni-lib.php`: stessa logica in due linguaggi (GitHub Actions e hosting PHP); i test confrontano i due risultati.
- `test/`: suite offline con risposte di esempio dell'API di Google (non serve la chiave).
- `docs/DECISIONS.md`: il perché delle scelte; `docs/voce.md`: voce di marca e affermazioni da confermare con il titolare.

Comandi: `npm test`, `npm run build`, `npm run build:hostinger`, `npm run dev` (costruisce e serve `_sito/` in locale). Node 20.10 o superiore, nessuna dipendenza: non aggiungerne senza motivo.

## Regole di lavoro

1. **Prima di dire "fatto" esegui `npm test`** e riporta l'esito vero.
2. Modifiche minime: fai ciò che serve alla richiesta, senza riscritture o file nuovi non richiesti.
3. Le chiavi (`GOOGLE_PLACES_API_KEY`, `config.php` su Hostinger, token e credenziali FTP) restano solo lato server e fuori dal repository. Mai nel codice o nel browser.
4. Se i dati sono in dubbio (prezzi, orari, allergeni, piatti), chiedi: non inventarli.

## Contenuti: nessun dato inventato

- **Mai inventare** numeri, recensioni, premi, citazioni, testate giornalistiche, anni di apertura, statistiche («oltre X coperti…»).
- Le recensioni vanno copiate **integralmente** da fonti reali, con link e data, senza ripulirle né uniformarle. Qui arrivano solo dalla scheda Google tramite l'API ufficiale; senza dati la sezione mostra solo il link alla scheda.
- Foto, storia del locale, nomi di persone e aneddoti arrivano dal titolare. Se mancano, lascia un segnaposto chiaramente marcato `TODO(titolare)`.
- Prezzi, orari e disponibilità si leggono solo da `data/`. Sono una fonte unica: non duplicarli nei modelli HTML.
- Nessuna affermazione di qualità o di classifica («N.1», «il migliore») senza prova verificabile.

## Voce e testi

- Voce di marca stabilita dal titolare, non dall'IA: le frasi di esempio stanno in `docs/voce.md` (da completare insieme al titolare).
- Scrivi in modo semplice e concreto, come parlerebbe una persona del locale. Evita:
  - formule a terne e antitesi («Non lo dico io: lo dicono loro»);
  - slogan a effetto e metafore ripetute su un unico tema;
  - elenchi perfettamente paralleli in ogni sezione;
  - numeri tondi «oltre N» usati come decorazione.
- Alcune imperfezioni sono normali: frasi di lunghezza diversa, qualche dettaglio specifico, anche un limite dichiarato.
- L'IA può bozzare e rifinire. L'approvazione finale è sempre di una persona.

## Codice

- **Nessun commento di processo nel codice pubblicato**: niente riferimenti a decisioni interne, ticket, date di sessione, «come chiesto dal titolare», «letto il…», «mai confermato». Ogni commento deve spiegare *perché* una riga è non ovvia, in poche parole, oppure non esistere.
- **Niente debug in produzione**: nessun parametro tipo `?prova=1`, nessun `console.*` residuo, nessun flag di anteprima o di test nel codice servito (un test lo controlla).
- **Niente codice difensivo senza motivo**: no `try/catch` vuoti, no controlli su API che esistono ovunque, no polling "di sicurezza". Se un controllo serve, scrivi il test che lo giustifica o spiega il perché in `docs/DECISIONS.md`.
- **Un solo layout responsive** (CSS grid/flex, `clamp()`, media query). Niente versioni separate mobile/desktop scambiate a runtime.
- Nomi coerenti e brevi, in italiano come nel resto dei file. Non riportare nei nomi il processo («atteso», «prova»).
- Dopo ogni gruppo di correzioni, un passaggio di **semplificazione**: rimuovi ciò che i cerotti precedenti hanno reso inutile.
- Le note del "perché" vanno in `docs/DECISIONS.md` (o nel messaggio di commit), mai nell'HTML o nel JS servito.

## SEO e dati strutturati

- JSON-LD `Restaurant` generato da `data/restaurant.json` con **solo dati veri** (indirizzo, orari, telefono, mappa). Niente premi, `sameAs`, `aggregateRating` o `award` non verificati.
- Poche pagine, ciascuna con contenuto davvero diverso. Vietato produrre in serie pagine «piatto + città» con lo stesso scheletro.
- Nessun blocco di testo scritto "per le IA" fuori dal contenuto normale della pagina.
- Una FAQ è lecita solo se le domande sono reali e le risposte coincidono con `data/`.

## Privacy e cookie

- Nessun tracciamento prima del consenso. Il consenso parte con tutto negato; il tag di Google Ads si carica solo dopo "Accetta".
- Ogni nuovo servizio esterno (analytics, pixel, font, mappe) va dichiarato in `src/cookie.html` e `src/privacy.html` prima di essere aggiunto.
- I messaggi dei clienti (WhatsApp, e-mail) non si registrano oltre il necessario.

## Accessibilità e prestazioni

- `lang="it"`, link «Salta al contenuto», testo alternativo vero sulle immagini, contrasto sufficiente, focus visibile.
- `aria-hidden` solo sugli elementi davvero decorativi.
- Immagini in WebP con dimensioni esplicite. Niente moduli o iframe pesanti caricati subito.

## Git

- Un branch per richiesta, commit piccoli con messaggi chiari in italiano.
- Non fare push su `main`. Apri una pull request in bozza e descrivi cosa cambia e come l'hai verificato.

## Checklist prima di consegnare

- [ ] `npm test` passa
- [ ] Nessun commento di processo, nessun `console.*`, nessun flag di debug nel codice servito
- [ ] Nessun dato, numero o recensione inventati
- [ ] Prezzi, orari e contatti letti da `data/`, non copiati a mano
- [ ] Testi riletti da una persona del locale
- [ ] Accessibilità e prestazioni controllate sul telefono
