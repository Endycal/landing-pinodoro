// Scarica dalla scheda Google del Lido (Places API (New) di Google Maps Platform):
// valutazione media, numero totale di recensioni e le recensioni che Google espone
// (al massimo 5, le piu' rilevanti). Sceglie le 3 da mostrare e scrive recensioni.json.
//
// Variabili d'ambiente:
//   GOOGLE_PLACES_API_KEY   chiave API (obbligatoria; nel repository: Settings > Secrets and variables > Actions > Secrets)
//   GOOGLE_PLACE_ID         Place ID della scheda (Settings > ... > Variables), oppure la costante PLACE_ID_PREDEFINITO qui sotto
//   GOOGLE_PLACE_QUERY      in mancanza del Place ID: testo con cui cercare la scheda (es. "Lido Pino d'Oro Mondragone")
//   PLACES_FIXTURE          solo per le prove senza rete: file con una risposta di esempio dell'API
//
// Uso: node scripts/aggiorna-recensioni.mjs   (esce con 0 anche se la chiave manca: scrive solo un avviso)

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const PLACE_ID_PREDEFINITO = "ChIJcV_Xya3fOhMRWT5u9UL0X08"; // Place ID della scheda "Ristorante Pino D'Oro", Mondragone (se vuoto, viene cercato con QUERY_PREDEFINITA)
const QUERY_PREDEFINITA = "Lido Pino d'Oro Mondragone"; // testo con cui cercare la scheda quando manca il Place ID
const USCITA = new URL("../recensioni.json", import.meta.url);
const CAMPI = "id,displayName,rating,userRatingCount,reviews,googleMapsUri";
const LINGUE = ["it", "en"]; // Google da' 5 recensioni per lingua: la prima e' la principale (voto, conteggio, testi in italiano),
                             // le altre aggiungono le recensioni scritte in quella lingua, mostrate nella loro lingua.
const MEMORIA_GIORNI = 0;   // nessuna conservazione: il file contiene solo le recensioni che Google fornisce oggi (le condizioni di Google
                            // non consentono di tenere in cache recensioni e nomi; solo il Place ID puo' essere conservato)
const MASSIMO_TUTTE = 10;   // numero massimo di recensioni nel file (5 per lingua)
const ETA_MASSIMA_GIORNI = 730; // recensioni piu' vecchie di due anni non entrano (legge 11 marzo 2026, n. 34)
const TESTO_MIN_FILE = 20;  // recensioni piu' corte non entrano nel file (stessa soglia della giostra in index.html)
const TESTO_MAX = 320;      // caratteri mostrati per recensione (oltre: "..." e link "Leggi tutto")
const TESTO_MIN = 40;       // recensioni piu' corte non vengono scelte
const VALUTAZIONE_MIN = 4;  // recensioni con meno stelle non vengono scelte
// Parole che, anche in una recensione a 5 stelle, non vogliamo in evidenza: la recensione viene lasciata fuori.
const PAROLE_ESCLUSE = ["rubbish", "terrible", "awful", "horrible", "disgusting", "worst", "rude", "dirty", "overpriced", "rip off", "rip-off", "scam", "avoid", "never again", "disappoint", "unfriendly",
  "pessim", "orribil", "terribil", "schifo", "maleducat", "sporc", "delus", "scaden", "sconsigli", "mai più", "mai piu", "da evitare", "fregatura", "vergogn"];
// Esclusioni manuali: righe di recensioni-escluse.txt (meglio un pezzo del link della recensione; oppure il nome come appare su Google).
const FILE_ESCLUSE = new URL("../recensioni-escluse.txt", import.meta.url);

// Una recensione per ciascuna categoria del documento della campagna, in quest'ordine.
const CATEGORIE = [
  { id: "lavoro", parole: ["lavoro", "pausa", "veloc", "rapid", "servizio", "cortes", "gentil", "tempi", "puntual", "personale", "attent", "professional"] },
  { id: "viaggio", parole: ["viaggio", "passaggio", "famiglia", "bambin", "figli", "vacanz", "sosta", "strada", "domiziana", "torner", "fermat", "tappa"] },
  { id: "cibo", parole: ["lupin", "spaghett", "pesce", "fritt", "cucina", "piatt", "buon", "mangiat", "fresc", "qualit", "porzion", "ottim", "delizios"] },
];

const chiave = process.env.GOOGLE_PLACES_API_KEY || "";
const fixture = process.env.PLACES_FIXTURE || "";
let placeId = process.env.GOOGLE_PLACE_ID || PLACE_ID_PREDEFINITO;
const query = process.env.GOOGLE_PLACE_QUERY || QUERY_PREDEFINITA;

function avviso(msg) { console.log(`::warning::${msg}`); }

async function chiama(url, { metodo = "GET", corpo, campi } = {}) {
  const risposta = await fetch(url, {
    method: metodo,
    headers: { "X-Goog-Api-Key": chiave, "X-Goog-FieldMask": campi, "Content-Type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const testo = await risposta.text();
  if (!risposta.ok) throw new Error(`Places API ${risposta.status}: ${testo.slice(0, 300)}`);
  return JSON.parse(testo);
}

async function trovaPlaceId() {
  const r = await chiama("https://places.googleapis.com/v1/places:searchText", {
    metodo: "POST", corpo: { textQuery: query, languageCode: "it", regionCode: "IT" },
    campi: "places.id,places.displayName,places.formattedAddress",
  });
  const primo = (r.places || [])[0];
  if (!primo) throw new Error(`Nessuna scheda trovata per "${query}"`);
  console.log(`Scheda trovata: ${primo.displayName?.text} - ${primo.formattedAddress} - Place ID: ${primo.id}`);
  console.log("Salva questo Place ID nella variabile GOOGLE_PLACE_ID del repository (o in PLACE_ID_PREDEFINITO nello script).");
  return primo.id;
}

async function dettagli(lingua) {
  if (fixture) { // prove senza rete: PLACES_FIXTURE per la lingua principale, PLACES_FIXTURE_EN ecc. per le altre (se mancano, nessuna recensione)
    const file = lingua === LINGUE[0] ? fixture : process.env[`PLACES_FIXTURE_${lingua.toUpperCase()}`];
    return file ? JSON.parse(readFileSync(file, "utf8")) : { reviews: [] };
  }
  if (!placeId && query) placeId = await trovaPlaceId();
  if (!placeId) throw new Error("Manca il Place ID: imposta GOOGLE_PLACE_ID (o GOOGLE_PLACE_QUERY per cercarlo).");
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${lingua}&regionCode=IT`;
  return chiama(url, { campi: lingua === LINGUE[0] ? CAMPI : "reviews" });
}

// Tempo trascorso in italiano ("3 settimane fa"), uguale per tutte le lingue.
function quandoItaliano(publishTime, adesso) {
  const t = Date.parse(publishTime || "");
  if (!t) return "";
  const giorni = Math.max(0, Math.floor((adesso - t) / 86400000));
  if (giorni < 1) return "oggi";
  if (giorni === 1) return "ieri";
  if (giorni < 7) return `${giorni} giorni fa`;
  const settimane = Math.floor(giorni / 7);
  if (giorni < 30) return settimane === 1 ? "una settimana fa" : `${settimane} settimane fa`;
  const mesi = Math.floor(giorni / 30.44);
  if (giorni < 365) return mesi <= 1 ? "un mese fa" : `${mesi} mesi fa`;
  const anni = Math.floor(giorni / 365.25);
  return anni <= 1 ? "un anno fa" : `${anni} anni fa`;
}

function accorcia(testo) {
  if (testo.length <= TESTO_MAX) return { testo, troncata: false };
  const taglio = testo.lastIndexOf(" ", TESTO_MAX);
  return { testo: testo.slice(0, taglio > TESTO_MAX / 2 ? taglio : TESTO_MAX).replace(/[\s,;:]+$/, "") + "…", troncata: true };
}

function punteggio(testo, parole) {
  const t = testo.toLowerCase();
  return parole.reduce((n, p) => n + (t.includes(p) ? 1 : 0), 0);
}

function scegli(recensioni) {
  const valide = recensioni.filter((r) => r.testoIntero.length >= TESTO_MIN && r.valutazione >= VALUTAZIONE_MIN);
  const usate = new Set();
  const scelte = [];
  for (const categoria of CATEGORIE) {
    let migliore = null, max = 0;
    for (const r of valide) {
      if (usate.has(r)) continue;
      const s = punteggio(r.testoIntero, categoria.parole);
      if (s > max) { max = s; migliore = r; }
    }
    if (migliore) { usate.add(migliore); scelte.push({ ...migliore, categoria: categoria.id }); }
  }
  const italiana = (r) => (r.lingua === LINGUE[0] ? 1 : 0);
  for (const r of [...valide].sort((a, b) => italiana(b) - italiana(a) || b.valutazione - a.valutazione || b.data.localeCompare(a.data))) {
    if (scelte.length >= 3) break;
    if (!usate.has(r)) { usate.add(r); scelte.push({ ...r, categoria: "altro" }); }
  }
  return scelte.map(({ testoIntero, ...r }) => r);
}

// Identita' di una recensione: il suo link su Google (uno per recensione), altrimenti autore e testo.
function chiaveRecensione(r) {
  return r.link && r.link.includes("/reviews/") ? r.link : `${r.autore}|${r.testo}`;
}

// Unisce le recensioni appena scaricate con quelle del file precedente non piu' restituite da Google,
// tenendo queste ultime per MEMORIA_GIORNI dall'ultima volta in cui Google le aveva date.
function unisci(nuove, precedente, adesso) {
  const presenti = new Set(nuove.map(chiaveRecensione));
  const ultimaLettura = Date.parse(precedente?.aggiornato || "") || 0;
  const conservate = [];
  for (const r of precedente?.tutte || []) {
    if (presenti.has(chiaveRecensione(r))) continue;
    const vista = Date.parse(r.ultimaVoltaVista || "") || ultimaLettura;
    if (!vista || adesso - vista > MEMORIA_GIORNI * 86400000) continue;
    conservate.push({ ...r, ultimaVoltaVista: new Date(vista).toISOString() });
  }
  return [...nuove, ...conservate].sort((a, b) => b.data.localeCompare(a.data)).slice(0, MASSIMO_TUTTE);
}

function normalizza(dati, extra, precedente, adesso) {
  // Attribuzione come la fornisce Google (nome pubblico scelto dall'autore, link al profilo, link alla recensione, link per
  // segnalare): le condizioni di Google Maps Platform non permettono di modificarla. Il testo e' quello originale dell'autore,
  // mai la traduzione automatica di Google. La data e' conservata con precisione al giorno (minimizzazione).
  const converti = (r, lingua) => {
    const testoIntero = String(r.originalText?.text || r.text?.text || "").replace(/\s+/g, " ").trim();
    const { testo, troncata } = accorcia(testoIntero);
    return {
      autore: String(r.authorAttribution?.displayName || "Utente Google").trim(),
      autoreLink: r.authorAttribution?.uri || "",
      valutazione: Number(r.rating) || 0,
      testo, troncata, testoIntero,
      quando: quandoItaliano(r.publishTime, adesso),
      data: String(r.publishTime || "").slice(0, 10),
      link: r.googleMapsUri || dati.googleMapsUri || "",
      segnala: r.flagContentUri || "",
      lingua,
    };
  };
  // Lingua principale: solo le recensioni scritte davvero in quella lingua (le altre arriverebbero tradotte da Google).
  const scaricate = (dati.reviews || [])
    .filter((r) => !r.originalText?.languageCode || r.originalText.languageCode === LINGUE[0])
    .map((r) => converti(r, LINGUE[0])).filter((r) => r.testoIntero);
  // Altre lingue: solo le recensioni scritte davvero in quella lingua e non gia' presenti.
  const presenti = new Set(scaricate.map(chiaveRecensione));
  for (const { lingua, reviews } of extra) {
    for (const r of reviews) {
      if ((r.originalText?.languageCode || "") !== lingua) continue;
      const c = converti(r, lingua);
      if (!c.testoIntero || presenti.has(chiaveRecensione(c))) continue;
      presenti.add(chiaveRecensione(c));
      scaricate.push(c);
    }
  }
  const manuali = escluseManuali();
  // Nel file restano solo le recensioni che la pagina puo' mostrare (minimizzazione, art. 5.1.c GDPR):
  // abbastanza stelle, testo non troppo corto, non piu' vecchie di due anni, nessuna parola esclusa, nessuna esclusione manuale.
  const tutte = unisci(scaricate.map(({ testoIntero, ...r }) => ({ ...r, testoIntero })), precedente, adesso)
    .filter((r) => r.valutazione >= VALUTAZIONE_MIN && (r.testoIntero ?? r.testo).length >= TESTO_MIN_FILE)
    .filter((r) => !r.data || adesso - Date.parse(r.data) <= ETA_MASSIMA_GIORNI * 86400000)
    .filter((r) => !daEscludere({ ...r, testoIntero: r.testoIntero ?? r.testo }, manuali));
  return {
    aggiornato: new Date(adesso).toISOString(),
    placeId: dati.id || placeId || "",
    nome: dati.displayName?.text || "",
    googleMapsUri: dati.googleMapsUri || "",
    valutazione: typeof dati.rating === "number" ? dati.rating : null,
    numeroRecensioni: typeof dati.userRatingCount === "number" ? dati.userRatingCount : null,
    scelte: scegli(tutte.map((r) => ({ ...r, testoIntero: r.testoIntero ?? r.testo }))),
    tutte: tutte.map(({ testoIntero, ...r }) => r),
  };
}

function escluseManuali() {
  if (!existsSync(FILE_ESCLUSE)) return [];
  return readFileSync(FILE_ESCLUSE, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => l.toLowerCase());
}
function daEscludere(r, manuali) {
  const t = r.testoIntero.toLowerCase();
  if (PAROLE_ESCLUSE.some((p) => t.includes(p))) return true;
  const autore = r.autore.toLowerCase(), link = (r.link || "").toLowerCase();
  return manuali.some((m) => autore === m || (link && link.includes(m)));
}

function senzaData(o) { const c = { ...o }; delete c.aggiornato; return JSON.stringify(c); }

if (!chiave && !fixture) {
  avviso("GOOGLE_PLACES_API_KEY non impostata: recensioni.json non viene aggiornato. Vedi README.md, sezione 'Recensioni Google automatiche'.");
  process.exit(0);
}

const precedente = existsSync(USCITA) ? JSON.parse(readFileSync(USCITA, "utf8")) : null;
const adesso = Date.parse(process.env.RECENSIONI_ADESSO || "") || Date.now(); // RECENSIONI_ADESSO: solo per le prove
const base = await dettagli(LINGUE[0]);
const extra = [];
for (const lingua of LINGUE.slice(1)) extra.push({ lingua, reviews: (await dettagli(lingua)).reviews || [] });
const nuovo = normalizza(base, extra, precedente, adesso);
if (precedente && senzaData(precedente) === senzaData(nuovo)) {
  console.log(`Nessuna novita': ${nuovo.valutazione} su Google, ${nuovo.numeroRecensioni} recensioni, ${nuovo.scelte.length} mostrate.`);
  process.exit(0);
}
writeFileSync(USCITA, JSON.stringify(nuovo, null, 2) + "\n");
console.log(`Aggiornato recensioni.json: ${nuovo.valutazione} su Google, ${nuovo.numeroRecensioni} recensioni, ${nuovo.scelte.length} mostrate (${nuovo.scelte.map((r) => r.categoria).join(", ")}).`);
