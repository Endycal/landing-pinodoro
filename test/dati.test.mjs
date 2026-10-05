import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { leggiDati, fraseOrari, prezzo, elenco, dataItaliana, RADICE } from "../scripts/costruisci.mjs";

const { ristorante, menu } = leggiDati();
const FASCIA = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

test("gli orari coprono i sette giorni con fasce HH:MM-HH:MM in ordine", () => {
  for (const giorno of ["0", "1", "2", "3", "4", "5", "6"]) {
    const fasce = ristorante.orari[giorno];
    assert.ok(Array.isArray(fasce) && fasce.length >= 1, `giorno ${giorno} senza fasce`);
    for (const fascia of fasce) {
      assert.match(fascia, FASCIA);
      const [apre, chiude] = fascia.split("-");
      assert.ok(apre < chiude, `fascia ${fascia} al contrario`);
    }
  }
});

test("contatti e scheda Google sono nel formato atteso", () => {
  assert.match(ristorante.contatti.telefono, /^\+39 \d{3} \d{3} \d{4}$/);
  assert.match(ristorante.contatti.whatsapp, /^39\d{9,10}$/);
  assert.equal(ristorante.contatti.whatsapp, ristorante.contatti.telefono.replace(/[^\d]/g, ""));
  assert.match(ristorante.contatti.email, /^[^@\s]+@[^@\s]+\.[a-z]+$/);
  assert.match(ristorante.google.placeId, /^ChIJ[\w-]+$/);
  assert.ok(ristorante.recensioni.stelleMinime >= 1 && ristorante.recensioni.stelleMinime <= 5);
  assert.ok(ristorante.recensioni.rotazioneSecondi >= 0);
  for (const azione of ["portami-li", "chiama", "whatsapp-lavoro", "whatsapp-sosta", "whatsapp-generico"]) {
    assert.equal(typeof ristorante.google.conversioni[azione], "string", `conversione ${azione}`);
  }
  for (const azione of ["whatsapp-lavoro", "whatsapp-sosta", "whatsapp-generico"]) {
    assert.ok(ristorante.messaggiWhatsapp[azione].startsWith("DOMIZIANA"), `messaggio ${azione}`);
  }
});

test("il menu ha prezzi positivi, scelte e data di aggiornamento", () => {
  assert.match(menu.aggiornato, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(menu.coperto.prezzo > 0);
  assert.ok(menu.smart.prezzo > 0 && menu.plus.prezzo > menu.smart.prezzo);
  assert.ok(menu.smart.scelte.length >= 1 && menu.smart.scelte.length <= 10);
  assert.ok(menu.plus.primi.length >= 1 && menu.plus.secondi.length >= 1);
  assert.ok(menu.smart.minuti > 0 && menu.plus.minuti >= menu.smart.minuti);
  assert.ok(menu.allaCarta.length >= 1);
  for (const piatto of menu.allaCarta) {
    assert.ok(piatto.nome.length > 2 && piatto.prezzo > 0, `piatto ${piatto.nome}`);
  }
});

test("le costanti del PHP di Hostinger coincidono con data/restaurant.json", () => {
  const php = readFileSync(new URL("../hostinger/recensioni-lib.php", import.meta.url), "utf8");
  assert.match(php, new RegExp(`const PLACE_ID_PREDEFINITO = '${ristorante.google.placeId}';`));
  assert.match(php, new RegExp(`const VALUTAZIONE_MIN = ${ristorante.recensioni.stelleMinime};`));
});

test("le funzioni di formato producono testo italiano", () => {
  assert.equal(prezzo(16.7), "€ 16,70");
  assert.equal(prezzo(2), "€ 2,00");
  assert.equal(elenco(["A", "B", "C"]), "A, B e C");
  assert.equal(elenco(["A"]), "A");
  assert.equal(dataItaliana("2026-10-05"), "5 ottobre 2026");
  assert.equal(
    fraseOrari({ 0: ["12:00-15:30"], 1: ["12:00-15:00"], 2: ["12:00-15:00"], 3: ["12:00-15:00"], 4: ["12:00-15:00"], 5: ["12:00-15:00", "19:30-23:00"], 6: ["12:00-15:00", "19:30-23:30"] }),
    "dal lunedì al giovedì 12:00-15:00; venerdì 12:00-15:00 e 19:30-23:00; sabato 12:00-15:00 e 19:30-23:30; domenica 12:00-15:30",
  );
  assert.equal(fraseOrari({ 0: ["12:00-15:00"], 1: ["12:00-15:00"], 2: ["12:00-15:00"], 3: ["12:00-15:00"], 4: ["12:00-15:00"], 5: ["12:00-15:00"], 6: ["12:00-15:00"] }), "dal lunedì alla domenica 12:00-15:00");
  assert.equal(typeof RADICE, "string");
});
