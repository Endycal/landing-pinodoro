# Landing "Pranzo sulla Domiziana" - Lido Pino d'Oro

```
Pagina autonoma per la campagna Google Performance Max (obiettivo: visite al locale).
Non dipende dal sito principale: nessun backend, nessun widget, nessun database.
Si carica cosi' com'e' su qualsiasi spazio web.

COSA C'E' IN QUESTO REPOSITORY
  index.html      la pagina (testi, stile e script sono tutti dentro questo file)
  logo.png        il logo
  logo-scuro.png  il logo con la scritta chiara, per il tema scuro (generato dal logo)
  termini.html    termini e condizioni d'uso (note legali)
  privacy.html    informativa sulla privacy (artt. 13 e 14 GDPR)
  cookie.html     cookie policy
  legale.css      stile delle tre pagine legali (stessi colori e temi della landing)
  caratteri/      i caratteri tipografici, ospitati qui (licenza in caratteri/OFL.txt): la pagina non chiama Google Fonts
  foto/           qui vanno le due foto (vedi sotto)
  README.md       questo file
  recensioni.json valutazione, numero di recensioni e recensioni della scheda Google: generato a ogni
                  pubblicazione, NON salvato nel repository (vedi "Recensioni Google automatiche")
  scripts/        aggiorna-recensioni.mjs (scarica le recensioni da Google, per GitHub Actions) e
                  prepara-sito.sh (copia in _sito/ i soli file da pubblicare)
  LICENSE         licenza BSD del solo codice: testi, foto, logo e icone restano riservati
  recensioni.php            su Hostinger risponde al posto di recensioni.json e lo rinnova da Google ogni giorno
  aggiorna-recensioni.php   aggiornamento forzato (cron di hPanel o browser con token), per Hostinger
  recensioni-escluse.txt    elenco manuale delle recensioni da non mostrare mai (non viene pubblicato)
  recensioni-lib.php        funzioni comuni ai due file PHP
  config.example.php        modello del file con la chiave, solo per Hostinger
  .htaccess       regole di protezione per Hostinger (GitHub Pages le ignora)
  .github/        gli automatismi: pubblicazione su GitHub Pages, aggiornamento delle recensioni, caricamento FTP facoltativo
  .nojekyll       serve solo a GitHub Pages (dice di pubblicare i file cosi' come sono)

COME SI PUBBLICA
  Opzione 1 - GitHub Pages (gratis, senza hosting): Settings > Pages > Source "Deploy from a branch",
    branch main, cartella "/ (root)". La pagina sara' su https://NOMEUTENTE.github.io/landing-domiziana/
    e si puo' collegare a un dominio proprio dalla stessa schermata.
  Opzione 2 - Hostinger (o altro hosting con PHP): carica il contenuto del repository, cosi' com'e',
    dove vuoi che stia la pagina: nella radice di un dominio dedicato (public_html/) oppure in una
    sottocartella (es. public_html/domiziana/). La pagina funziona subito; per le recensioni
    automatiche segui la sezione "SU HOSTINGER" qui sotto.

INDIRIZZI DA METTERE NEGLI ANNUNCI
  Gruppo 1 - Pranzo di lavoro:       https://TUODOMINIO/?g=lavoro
  Gruppo 2 - Sosta sulla Domiziana:  https://TUODOMINIO/?g=sosta
  (in una sottocartella: https://TUODOMINIO/domiziana/?g=lavoro e https://TUODOMINIO/domiziana/?g=sosta)
  Il parametro cambia il titolo, mette per prima la scheda giusta e viene allegato a ogni conversione.

PULSANTI
  Chiama e WhatsApp usano gia' il numero 388 787 7008.
  I messaggi WhatsApp sono precompilati e diversi per pulsante, per capire da dove arriva il cliente:
    scheda "pausa pranzo"   DOMIZIANA LAVORO - arrivo tra 10 minuti, siamo in [ ]
    scheda "in viaggio"     DOMIZIANA SOSTA - arriviamo tra 10 minuti, siamo in [ ] (bambini: [ ])
    pulsanti generici       DOMIZIANA - arrivo tra 10 minuti, siamo in [ ]
  "Portami li'" apre Google Maps sulla scheda del Lido (con il Place ID atterra esattamente sulla scheda).

COSA COMPLETARE PRIMA DI ANDARE ONLINE
  Apri index.html con un editor di testo.
  1. In cima al file: l'elenco dei dati da completare, con la posizione di ciascuno.
  2. In fondo al file, blocco CONFIG: orari di pranzo e cena con i giorni della cena, Place ID della scheda Google,
     ID Google Ads ed etichette di conversione.
  3. Nel testo, i dati mancanti sono tra parentesi quadre dentro <span class="dc">...</span>
     (in giallo oro sulla pagina): sostituisci il testo e togli lo span.

FOTO
  Nella cartella foto/, ogni foto in due larghezze (-1200.jpg per desktop, -720.jpg per telefono):
    tavolo-spiaggia-*.jpg    in alto: il tavolo apparecchiato sulla sabbia
    tavolo-terrazza-*.jpg    blocco 3, provvisoria: al suo posto va lo Spaghetto ai Lupini visto dall'alto
                             (salvarlo come spaghetto-ai-lupini-1200.jpg e -720.jpg, poi cambiare src, srcset,
                             alt e didascalia del blocco 3 in index.html)
    terrazza-mare-*.jpg e terrazza-pergola-*.jpg   striscia "La terrazza" sotto il blocco 3
  Facoltativa: uno scatto invernale del tavolo sulla spiaggia al posto di tavolo-spiaggia.
  Se un file manca, al suo posto compare una cornice dorata con la didascalia.

RECENSIONI GOOGLE AUTOMATICHE
  Il blocco "La prova" (voto, numero di recensioni e tre recensioni) si aggiorna da solo dalla scheda
  Google del Lido: ogni mattina (7:23 ora italiana d'estate, 6:23 d'inverno) un automatismo
  (Actions > "Aggiorna le recensioni Google", lanciabile anche a mano in qualsiasi momento) interroga
  l'API ufficiale di Google Maps Platform (Places API), scrive recensioni.json e ripubblica la pagina.
  Google espone al massimo 5 recensioni per scheda (le piu' rilevanti) per ogni lingua richiesta.
  Lo script le chiede in italiano e in inglese (costante LINGUE negli script): le inglesi entrano solo
  se scritte davvero in inglese, restano nella loro lingua e nella pagina portano la nota "in inglese";
  voto, conteggio e le tre in evidenza vengono sempre dall'italiano; in italiano entrano solo le
  recensioni scritte in italiano (mai le traduzioni automatiche di Google).
  Il file contiene solo le recensioni che Google fornisce in quel momento: le condizioni di Google Maps
  Platform non permettono di conservarle, e recensioni.json viene generato a ogni pubblicazione e non e'
  salvato nel repository (cosi' niente resta nella cronologia pubblica di git). Nel file entrano solo le
  recensioni che la pagina puo' mostrare: almeno 4 stelle (VALUTAZIONE_MIN negli script), almeno 20
  caratteri, pubblicate da meno di due anni (legge 34/2026), senza parole dell'elenco PAROLE_ESCLUSE
  (italiano e inglese, es. "rubbish", "pessimo") e non presenti in recensioni-escluse.txt.
  Lo script sceglie le 3 in evidenza, una per categoria del documento (lavoro/servizio, viaggio/famiglia,
  cibo), copiate parola per parola; oltre i 320 caratteri il testo viene accorciato.
  Ogni scheda mostra l'attribuzione come la fornisce Google: nome pubblico dell'autore con il link al suo
  profilo, link alla recensione su Google ("Vedi su Google" / "Leggi tutto su Google") e link "Segnala";
  le condizioni di Google non permettono di modificarla (quindi niente nomi abbreviati). Sotto la giostra
  c'e' l'attribuzione "forniti da Google Maps": Google chiede il suo logo, da scaricare dalla pagina delle
  linee guida di attribuzione di Google Maps Platform e mettere al posto del testo (commento in index.html).
  Esclusione manuale: recensioni-escluse.txt, una riga per recensione, preferibilmente un pezzo del link
  della recensione (cosi' nel file non compare nessun nome) oppure il nome come appare su Google. Basta
  salvarlo: al prossimo aggiornamento la recensione sparisce. Il file non viene pubblicato (prepara-sito.sh
  non lo copia; su Hostinger e' bloccato da .htaccess), ma il repository e' pubblico: per questo meglio il link.
  La pagina dice ai visitatori come sceglie e ordina le recensioni (nota sotto la giostra e termini.html,
  punto 7), come chiedono il Codice del consumo e la legge 34/2026. Senza dati la sezione mostra solo
  il link alla scheda Google: niente segnaposto.

  Per attivarlo, una volta sola:
  1. Su https://console.cloud.google.com crea un progetto, attiva "Places API (New)" e la fatturazione
     (obbligatoria per Google Maps Platform; la quota gratuita mensile copre ampiamente le circa 60
     chiamate al mese di questo automatismo, due al giorno; imposta comunque un avviso di budget).
  2. Crea una chiave API (APIs & Services > Credentials) limitata alla sola "Places API (New)".
  3. Nel repository: Settings > Secrets and variables > Actions.
       Secrets   -> GOOGLE_PLACES_API_KEY = la chiave
       Variables -> GOOGLE_PLACE_ID = il Place ID della scheda del Lido
                    (si trova con https://developers.google.com/maps/documentation/places/web-service/place-id)
                    In alternativa GOOGLE_PLACE_QUERY = "Lido Pino d'Oro <comune>": lo script cerca la scheda
                    e stampa il Place ID nel log, da salvare poi in GOOGLE_PLACE_ID.
  4. Actions > "Aggiorna le recensioni Google" > Run workflow: se tutto e' a posto, in un minuto la pagina
     mostra le recensioni vere. Da li' in poi va da solo.
  Il Place ID trovato viene usato anche da "Portami li'" e "Leggi tutte le recensioni su Google",
  se CONFIG.googlePlaceId in index.html e' vuoto.

SU HOSTINGER (recensioni automatiche senza GitHub)
  La copia su Hostinger e' indipendente da GitHub: quello che GitHub aggiorna ogni giorno NON arriva
  da solo su Hostinger (a meno del caricamento FTP facoltativo descritto in fondo). Su Hostinger
  l'aggiornamento avviene cosi': la regola in .htaccess fa rispondere recensioni.php al posto di
  recensioni.json; se config.php contiene la chiave e il file ha piu' di un giorno, recensioni.php
  lo rinnova da Google prima di servirlo. Quindi basta caricare i file e compilare config.php: la prima
  visita dopo 24 ore rinnova le recensioni da sola, senza cron. Se Google non risponde, resta il
  file precedente e si riprova al massimo ogni ora. Il cron di hPanel (passo 3) e' facoltativo: serve
  solo se vuoi che il rinnovo avvenga a un'ora precisa invece che alla prima visita.
  La pagina non cambia: chiede sempre recensioni.json.
  1. Carica i file su Hostinger. Per averla come sottopagina del sito esistente (es. tuodominio.it/domiziana/):
       - hPanel > File Manager > public_html (la cartella del sito esistente);
       - crea una cartella con il nome che vuoi nell'indirizzo, tutto minuscolo e senza spazi (es. domiziana);
       - entra nella cartella, carica lo zip "piatto" della landing (i file senza cartella esterna) ed estrailo
         li': index.html deve trovarsi direttamente in public_html/domiziana/, non in una sottocartella;
       - attiva "Mostra file nascosti" e controlla che ci sia anche .htaccess.
     La pagina risponde su https://tuodominio.it/domiziana/ e gli annunci useranno
     https://tuodominio.it/domiziana/?g=lavoro e https://tuodominio.it/domiziana/?g=sosta.
     Servono i file che scripts/prepara-sito.sh --hostinger mette in _sito/ (lo zip "piatto" li contiene gia'):
     pagina, note legali, stile, loghi, icone, foto, caratteri, i file PHP, config.example.php, .htaccess e
     recensioni-escluse.txt. Le cartelle .github e scripts servono solo a GitHub.
     Per gli annunci a pagamento usa l'indirizzo su Hostinger: GitHub Pages e' un servizio gratuito con limiti
     d'uso, non pensato per siti commerciali; tienilo come anteprima.
     Il sito esistente non cambia: la cartella e' indipendente, e le sue regole .htaccess valgono solo li' dentro
     (quelle del sito principale continuano a valere e non danno fastidio).
     Se il sito e' WordPress: funziona allo stesso modo. WordPress gestisce solo gli indirizzi che non
     corrispondono a file o cartelle reali, quindi public_html/domiziana/ viene servita direttamente,
     senza tema, plugin o cache di WordPress. Due accortezze: non creare in WordPress una pagina con lo
     stesso slug (es. "domiziana"), e metti la cartella nella radice del dominio (public_html, accanto a
     wp-config.php), non dentro wp-content. Il file .htaccess della landing la isola dalle regole di
     WordPress e imposta index.html come pagina di ingresso.
  2. Nel File Manager duplica config.example.php, rinomina la copia in config.php e compila:
       'api_key' => la chiave di Google Maps Platform (la stessa usata su GitHub, o una nuova);
       'token'   => una frase lunga e segreta a tua scelta.
     config.php viene eseguito da PHP e non e' mai mostrato ai visitatori; .htaccess lo blocca anche
     da download diretto.
  3. (Facoltativo) hPanel > Avanzate > Cron Job: crea un cron giornaliero, ogni giorno alle 7, con il comando
       php /home/UTENTE/domains/TUODOMINIO/public_html/CARTELLA/aggiorna-recensioni.php
     Il percorso esatto della cartella lo vedi in alto nel File Manager (inizia con /home/u...).
     Con la pianificazione "Personalizzata": minuto 0, ora 7, giorno *, mese *, giorno della settimana *.
  4. Prova subito dal browser: https://TUODOMINIO/CARTELLA/aggiorna-recensioni.php?token=IL_TOKEN
     Risponde con una riga ("Aggiornato recensioni.json: ..." oppure "Nessuna novita': ...").
     Senza token, o con token sbagliato, risponde "Accesso negato".
  5. Ricarica la pagina: nel blocco "La prova" compaiono voto, numero di recensioni e le tre recensioni.

  Se le recensioni non si aggiornano:
  - apri https://TUODOMINIO/CARTELLA/recensioni.json: la riga "aggiornato" dice quando e' stato rinnovato
    il file l'ultima volta; se e' piu' vecchia di un giorno, l'aggiornamento automatico non e' partito;
  - nella stessa risposta, tra le intestazioni (strumenti per sviluppatori del browser, scheda Rete),
    X-Recensioni dice cosa e' successo: non-necessario (file recente), aggiornato, invariato, rinviato
    (Google ha fallito da poco, si riprova entro un'ora), fallito (dettagli nel log errori PHP di hPanel);
  - controlla che config.php esista nella cartella con la chiave giusta, e che .htaccess sia stato
    caricato (file nascosto): senza .htaccess recensioni.json viene servito come file statico e non si rinnova;
  - per forzare subito: https://TUODOMINIO/CARTELLA/aggiorna-recensioni.php?token=IL_TOKEN.

  Facoltativo - caricamento automatico da GitHub a Hostinger (per chi modifica la pagina su GitHub):
  a ogni push, e ogni mattina dopo l'aggiornamento delle recensioni, i workflow caricano via FTP la cartella
  _sito/ preparata da scripts/prepara-sito.sh --hostinger.
  Si attiva impostando nel repository (Settings > Secrets and variables > Actions):
    Variables: HOSTINGER_FTP_HOST (es. ftp.tuodominio.it), HOSTINGER_FTP_DIR (es. public_html/domiziana/,
               con la barra finale), HOSTINGER_FTP_PROTOCOL (ftps; mettere ftp solo se ftps non funziona)
    Secrets:   HOSTINGER_FTP_USER, HOSTINGER_FTP_PASSWORD (hPanel > File > Account FTP)
  Con questo attivo il cron su Hostinger non serve piu': le recensioni arrivano gia' aggiornate da GitHub.
  Senza queste impostazioni il caricamento FTP non parte e non da' errori.

TEMA SCURO
  La pagina segue il tema del telefono o del computer (chiaro o scuro). Il pulsante rotondo in alto a
  destra, accanto al logo (luna o sole), permette di scegliere l'altro tema: la scelta resta nel browser
  del visitatore (localStorage, nessun cookie, memorizzazione tecnica che non richiede consenso) e vale
  per le visite successive. Il tema scuro usa lo stesso oro su fondo notte e il logo con la scritta
  chiara (logo-scuro.png). Il passaggio da un tema all'altro e' animato: un cerchio che si apre dal
  pulsante (browser recenti) o una dissolvenza dei colori; con "riduci animazioni" il cambio e' immediato.
  I colori sono nelle variabili in cima al CSS di index.html: il blocco :root
  e' il tema chiaro, i due blocchi subito sotto (identici) sono il tema scuro.

SAFARI 26 (LIQUID GLASS)
  Su iPhone, iPad e Mac con Safari 26 la barra di Safari e' di vetro e si tinge da sola: ignora theme-color
  e legge lo sfondo degli elementi fissi ai bordi della pagina, altrimenti lo sfondo della pagina. Per questo
  la barra fissa dei pulsanti in basso non ha sfondo: sfondo, sfocatura e bordo stanno sul figlio .barra-vetro.
  Non spostarli sull'elemento fisso. La pagina arriva ai bordi dello schermo (viewport-fit=cover) e tiene
  conto dei margini di sicurezza con env(safe-area-inset-*): striscia della data sotto la barra di stato,
  barra dei pulsanti sopra l'indicatore Home, margini laterali con la tacca in orizzontale.

NOTE LEGALI, PRIVACY E COOKIE
  In fondo alla landing ci sono i dati del titolare (P.IVA obbligatoria in home page, art. 35 DPR 633/72) e i
  collegamenti a termini.html, privacy.html e cookie.html. Le tre pagine sono scritte per questa landing:
  niente vendite online, contatti via telefono e WhatsApp, recensioni prese da Google, caratteri in casa,
  cookie solo per Google Ads e solo con consenso.
  Da completare, una volta sola (i punti sono evidenziati in giallo nelle pagine, come nella landing):
    - ragione sociale (o nome e cognome del titolare), via e numero civico, P.IVA, REA, PEC
      -> pie' di pagina di index.html, termini.html (punto 2) e privacy.html (punto 1);
    - solo se societa': ufficio del Registro delle imprese e numero, capitale sociale (srl/spa), socio unico
      o liquidazione (art. 2250 c.c.) -> termini.html punto 2 e privacy.html punto 1; se ditta individuale,
      cancellare la riga. Facoltativo: estremi SCIA e concessione demaniale -> termini.html punto 2;
    - dominio della copia su Hostinger, paese del data center (hPanel) e giorni di conservazione dei log di
      accesso -> privacy.html, punti 2.a e 3; su Hostinger accettare il DPA nell'area clienti;
    - giorni di validita' del menu PLUS e coperto dei piatti alla carta -> landing e termini.html punto 3;
    - dominio e cookie policy del sito principale -> cookie.html punto 2 (solo se la landing sta nel sito WordPress);
    - tempi di servizio: oggi "ti serviamo in 30 minuti" e' un impegno; per scrivere "garantito" servono
      condizioni e rimedio, sia nella landing sia in termini.html punto 4 (vedi commento in index.html);
    - le scelte gia' scritte, da confermare o cambiare: messaggi WhatsApp conservati al massimo 12 mesi,
      nessun DPO nominato, risposta "Si'" al pagamento con carta (obbligo di legge), domande su parcheggio
      e cani nascoste finche' non c'e' la risposta (commento in index.html).
  Banner cookie: compare solo quando CONFIG.googleAdsId e' impostato. Prima della scelta non parte nulla verso
  Google; "Accetta" carica il tag con la modalita' consenso (solo misurazione, niente personalizzazione);
  "Rifiuta", la X in alto a destra o il tasto Esc non caricano nulla; i due pulsanti sono identici (pari
  evidenza, come chiede il Garante); la scelta resta 6 mesi di calendario e si cambia da "Preferenze cookie"
  in fondo alla pagina; revocando il consenso la pagina cancella i cookie di Google Ads del dominio e si
  ricarica senza tag. Senza ID Google Ads la pagina non usa cookie e il banner non serve: la cookie policy lo dice.
  Prima di far partire annunci a pagamento compilare i dati del titolare: una pagina con segnaposto visibili
  e' un'omissione informativa (art. 22 Codice del consumo) e viola le regole Google Ads sui contenuti.
  Licenza: il file LICENSE (BSD) copre solo il codice; testi, foto, logo e icone restano riservati.
  Caratteri: Montserrat e Cormorant Garamond sono in caratteri/ (sottoinsieme latino dei font variabili di
  Google Fonts, licenza SIL OFL): il browser dei visitatori non contatta piu' Google per i font.

GOOGLE ADS
  Crea cinque conversioni (Portami li', Chiama, WhatsApp Lavoro, WhatsApp Sosta, WhatsApp generico),
  copia l'ID del tag (AW-...) e le cinque etichette nel blocco CONFIG. Il tag si carica solo se
  l'ID e' presente e solo dopo il consenso nel banner (vedi "Note legali, privacy e cookie").

MISURAZIONE (foglio 4-MARKETING)
  - Parole chiave WhatsApp: DOMIZIANA LAVORO, DOMIZIANA SOSTA, DOMIZIANA (accanto a PRANZO e DOMENICA).
  - Al tavolo: "Come ci hai trovato?", con l'opzione "Google".
  - Ogni lunedi': spesa della campagna, indicazioni stradali, chiamate, clic WhatsApp, costo per azione.
```
