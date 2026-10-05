const dati = JSON.parse(document.getElementById("dati").textContent);
const radice = document.documentElement;
const gruppo = radice.dataset.g || "";
const FUSO = "Europe/Rome";
const $ = (id) => document.getElementById(id);

// localStorage lancia un'eccezione quando il browser blocca l'archiviazione (navigazione privata, cookie disattivati):
// la pagina funziona lo stesso, solo senza ricordare tema e scelta sui cookie.
const memoria = {
  leggi(chiave) { try { return localStorage.getItem(chiave); } catch { return null; } },
  scrivi(chiave, valore) { try { localStorage.setItem(chiave, valore); return true; } catch { return false; } },
  cancella(chiave) { try { localStorage.removeItem(chiave); return true; } catch { return false; } },
};
const pocheAnimazioni = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Titolo per gruppo di annunci (?g=lavoro | ?g=sosta)
const titolo = $("titolo");
if (gruppo && titolo.getAttribute("data-titolo-" + gruppo)) titolo.textContent = titolo.getAttribute("data-titolo-" + gruppo);

// Data di oggi e orari del giorno, nel fuso di Roma; si rinnovano da soli alla mezzanotte successiva.
const GIORNI_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formato = (opzioni) => new Intl.DateTimeFormat("it-IT", { timeZone: FUSO, ...opzioni });
function msAllaMezzanotte(adesso) {
  const parti = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: FUSO, hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" })
    .formatToParts(adesso).map((p) => [p.type, Number(p.value)]));
  return ((24 - parti.hour) * 3600 - parti.minute * 60 - parti.second) * 1000 + 1000;
}
function aggiornaData() {
  const adesso = new Date();
  const giorno = GIORNI_EN.indexOf(new Intl.DateTimeFormat("en-US", { timeZone: FUSO, weekday: "short" }).format(adesso));
  const fasce = dati.orari[giorno];
  const completa = formato({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(adesso);
  $("data-oggi").textContent = ", " + formato({ weekday: "long", day: "numeric", month: "long" }).format(adesso);
  $("data-striscia").textContent = completa.charAt(0).toUpperCase() + completa.slice(1);
  document.querySelectorAll("[data-orario]").forEach((el) => { el.textContent = fasce.join(" e "); });
  document.querySelectorAll("[data-pasti]").forEach((el) => { el.textContent = fasce.length > 1 ? "a pranzo e a cena" : "a pranzo"; });
  setTimeout(aggiornaData, msAllaMezzanotte(adesso));
}
aggiornaData();

// Google Ads: il tag parte solo con l'ID impostato e solo dopo "Accetta" nel banner; la scelta vale 6 mesi.
window.dataLayer = window.dataLayer || [];
window.gtag = function () { window.dataLayer.push(arguments); };
const ads = dati.google.adsId;
const consenso = { chiave: "cookie-consenso", mesi: 6, banner: $("consenso"), link: $("preferenze-cookie"), caricato: false };
function consensoLetto() {
  const salvato = JSON.parse(memoria.leggi(consenso.chiave) || "null");
  if (!salvato || (salvato.scelta !== "accettati" && salvato.scelta !== "rifiutati")) return "";
  const scadenza = new Date(salvato.quando);
  scadenza.setMonth(scadenza.getMonth() + consenso.mesi);
  if (Date.now() < scadenza.getTime()) return salvato.scelta;
  memoria.cancella(consenso.chiave);
  return "";
}
function cancellaCookieAds() {
  const parti = location.hostname.split(".");
  for (const c of document.cookie.split(";")) {
    const nome = c.split("=")[0].trim();
    if (!nome.startsWith("_gcl_") && !nome.startsWith("_gac_")) continue;
    document.cookie = `${nome}=; Max-Age=0; path=/`;
    for (let i = 0; i < parti.length - 1; i++) document.cookie = `${nome}=; Max-Age=0; path=/; domain=${parti.slice(i).join(".")}`;
  }
  memoria.cancella("_gcl_ls");
  sessionStorage.removeItem("_gcl_ss");
}
function caricaAds() {
  if (consenso.caricato) return;
  consenso.caricato = true;
  window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
  window.gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted" });
  window.gtag("js", new Date());
  window.gtag("config", ads);
  const tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ads);
  document.head.appendChild(tag);
}
if (ads) {
  consenso.link.hidden = false;
  consenso.link.addEventListener("click", (e) => { e.preventDefault(); consenso.banner.hidden = false; });
  consenso.banner.querySelectorAll("[data-consenso]").forEach((b) => {
    b.addEventListener("click", () => {
      const scelta = b.dataset.consenso;
      memoria.scrivi(consenso.chiave, JSON.stringify({ scelta, quando: Date.now() }));
      consenso.banner.hidden = true;
      if (scelta === "accettati") {
        if (consenso.caricato) window.gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted" });
        else caricaAds();
      } else if (consenso.caricato) {
        window.gtag("consent", "update", { ad_storage: "denied", ad_user_data: "denied" });
        cancellaCookieAds();
        location.reload();
      }
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !consenso.banner.hidden) consenso.banner.querySelector(".consenso-chiudi").click();
  });
  const salvata = consensoLetto();
  if (salvata === "accettati") caricaAds();
  else if (!salvata) consenso.banner.hidden = false;
}
document.querySelectorAll("[data-azione]").forEach((a) => {
  a.addEventListener("click", () => {
    const azione = a.dataset.azione;
    window.dataLayer.push({ event: "clic_pulsante", azione, gruppo });
    const etichetta = dati.google.conversioni[azione];
    if (consenso.caricato && etichetta) window.gtag("event", "conversion", { send_to: `${ads}/${etichetta}`, gruppo, transport_type: "beacon" });
  });
});

// Tema chiaro/scuro: senza una scelta segue il sistema; il pulsante nella testata la ricorda nel browser.
const tema = { bottone: $("tema"), sistema: matchMedia("(prefers-color-scheme: dark)") };
const temaScuro = () => (radice.dataset.tema ? radice.dataset.tema === "scuro" : tema.sistema.matches);
function temaAggiorna() {
  const scuro = temaScuro();
  tema.bottone.setAttribute("aria-pressed", String(scuro));
  tema.bottone.setAttribute("aria-label", scuro ? "Passa al tema chiaro" : "Passa al tema scuro");
  tema.bottone.querySelector("use").setAttribute("href", scuro ? "#i-sole" : "#i-luna");
  document.querySelectorAll("meta[name='theme-color']").forEach((m) => m.setAttribute("content", scuro ? "#141210" : "#ffffff"));
}
function temaCambia() {
  const scelta = temaScuro() ? "chiaro" : "scuro";
  const icona = tema.bottone.querySelector("svg");
  const applica = () => {
    radice.dataset.tema = scelta;
    memoria.scrivi("tema", scelta);
    temaAggiorna();
    if (pocheAnimazioni()) return;
    icona.classList.remove("gira");
    void icona.offsetWidth;
    icona.classList.add("gira");
    icona.addEventListener("animationend", () => icona.classList.remove("gira"), { once: true });
  };
  if (pocheAnimazioni()) { applica(); return; }
  if (document.startViewTransition) {
    const r = tema.bottone.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const raggio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    radice.style.setProperty("--cerchio-x", x + "px");
    radice.style.setProperty("--cerchio-y", y + "px");
    radice.style.setProperty("--cerchio-da", r.width / 2 + "px");
    radice.style.setProperty("--cerchio-a", raggio + "px");
    radice.classList.add("tema-in-corso");
    const fine = () => radice.classList.remove("tema-in-corso");
    document.startViewTransition(applica).finished.then(fine, fine);
    return;
  }
  radice.classList.add("tema-transizione");
  applica();
  setTimeout(() => radice.classList.remove("tema-transizione"), 400);
}
tema.bottone.addEventListener("click", temaCambia);
tema.sistema.addEventListener("change", temaAggiorna);
temaAggiorna();

// Recensioni Google, lette da recensioni.json. Senza dati resta solo il link alla scheda: nessun segnaposto.
function senzaRecensioni() {
  $("recensioni-giostra").hidden = true;
  $("recensioni-info").hidden = true;
  $("sezione-prova").hidden = false;
}
const notaTasto = $("nota-tasto");
notaTasto.addEventListener("click", () => {
  const nota = $("nota-recensioni");
  const aperta = nota.classList.toggle("aperta");
  nota.setAttribute("aria-hidden", String(!aperta));
  notaTasto.setAttribute("aria-expanded", String(aperta));
});
function iconaStella() {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(NS, "use");
  use.setAttribute("href", "#i-stella");
  svg.appendChild(use);
  return svg;
}
function elemento(tag, classe, testo) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (testo !== undefined) el.textContent = testo;
  return el;
}
function linkEsterno(href, classe, testo) {
  const a = elemento("a", classe, testo);
  a.href = href; a.target = "_blank"; a.rel = "noopener";
  return a;
}
const NOMI_LINGUE = { en: "in inglese", de: "in tedesco", fr: "in francese", es: "in spagnolo" };
function schedaRecensione(r) {
  const scheda = elemento("blockquote", "recensione");
  const stelle = elemento("div", "stelle");
  const n = Math.max(1, Math.min(5, Math.round(r.valutazione)));
  stelle.setAttribute("aria-label", `${n} stelle su 5`);
  for (let i = 0; i < n; i++) stelle.appendChild(iconaStella());
  const testo = elemento("p", "", `"${r.testo}"`);
  const azioni = elemento("div", "recensione-azioni");
  const mostra = elemento("button", "mostra-tutto", "Mostra tutto");
  mostra.type = "button"; mostra.hidden = true; mostra.setAttribute("aria-expanded", "false");
  mostra.addEventListener("click", () => {
    const aperta = scheda.classList.toggle("aperta");
    mostra.textContent = aperta ? "Riduci" : "Mostra tutto";
    mostra.setAttribute("aria-expanded", String(aperta));
  });
  azioni.appendChild(mostra);
  if (r.link) azioni.appendChild(linkEsterno(r.link, "leggi-tutto", "Vedi su Google"));
  const cite = document.createElement("cite");
  cite.appendChild(r.autoreLink ? linkEsterno(r.autoreLink, "", r.autore) : document.createTextNode(r.autore));
  const lingua = r.lingua && r.lingua !== "it" ? NOMI_LINGUE[r.lingua] || `in ${r.lingua}` : "";
  cite.appendChild(document.createTextNode((r.quando ? ` · ${r.quando}` : "") + (lingua ? ` · ${lingua}` : "")));
  if (r.segnala) {
    const segnala = linkEsterno(r.segnala, "segnala", "Segnala");
    segnala.setAttribute("aria-label", "Segnala questa recensione a Google");
    cite.appendChild(document.createTextNode(" · "));
    cite.appendChild(segnala);
  }
  scheda.append(stelle, testo, azioni, cite);
  return scheda;
}
// Il pulsante "Mostra tutto" compare solo sulle recensioni che il limite di righe del CSS ha davvero accorciato.
function aggiornaMostraTutto() {
  document.querySelectorAll(".recensione").forEach((scheda) => {
    const p = scheda.querySelector("p");
    scheda.querySelector(".mostra-tutto").hidden = !scheda.classList.contains("aperta") && p.scrollHeight <= p.clientHeight + 1;
  });
}
function mostraRecensioni(scheda) {
  if (!scheda || !scheda.scelte || !scheda.scelte.length) { senzaRecensioni(); return; }
  if (typeof scheda.valutazione === "number" && scheda.numeroRecensioni) {
    $("titolo-prova").textContent = `${scheda.valutazione.toFixed(1).replace(".", ",")} su Google, con ${scheda.numeroRecensioni} recensioni`;
  }
  if (scheda.nome) $("nome-scheda").textContent = `«${scheda.nome}»`;
  const viste = new Set();
  const carte = [];
  for (const r of [...scheda.scelte.slice(0, 3), ...(scheda.tutte || [])]) {
    const chiave = `${r.autore}|${r.testo}`;
    if (viste.has(chiave) || r.valutazione < dati.recensioni.stelleMinime) continue;
    viste.add(chiave);
    carte.push(r);
  }
  if (!carte.length) { senzaRecensioni(); return; }
  $("recensioni").replaceChildren(...carte.map(schedaRecensione));
  if (scheda.googleMapsUri) document.querySelectorAll("[data-link='recensioni']").forEach((a) => a.setAttribute("href", scheda.googleMapsUri));
  $("sezione-prova").hidden = false;
  giostraCostruisci();
}

// Giostra delle recensioni: scorre da sola ogni N secondi; si ferma con il mouse sopra, per 15 secondi dopo che
// l'utente l'ha sfogliata, con il fuoco da tastiera dentro, con il pulsante "Ferma" e quando la scheda è nascosta.
const giostra = {
  area: $("recensioni-giostra"), pista: $("recensioni"), comandi: $("recensioni-comandi"), punti: $("recensioni-punti"), pausa: $("recensioni-pausa"),
  timer: null, indice: 0, posizioni: 1, pausaFino: 0, animazioneFino: 0, sopra: false, fuoco: false, fermata: false, ritardoScroll: null,
  secondi: dati.recensioni.rotazioneSecondi,
};
const giostraCarte = () => [...giostra.pista.querySelectorAll(".recensione")];
function giostraPasso() {
  const c = giostraCarte();
  return c.length > 1 ? c[1].offsetLeft - c[0].offsetLeft : (c[0] ? c[0].offsetWidth : 1);
}
function giostraVisibili() {
  const c = giostraCarte();
  if (!c.length) return 1;
  return Math.max(1, Math.round((giostra.pista.clientWidth + (giostraPasso() - c[0].offsetWidth)) / giostraPasso()));
}
const giostraPosizioni = () => Math.max(1, giostraCarte().length - giostraVisibili() + 1);
const giostraIndiceDaScroll = () => Math.min(giostra.posizioni - 1, Math.max(0, Math.round(giostra.pista.scrollLeft / giostraPasso())));
const giostraPausa = () => { giostra.pausaFino = Date.now() + 15000; };
const giostraAutomatica = () => giostra.secondi > 0 && giostra.posizioni > 1;
function giostraSegna() {
  [...giostra.punti.children].forEach((p, k) => p.setAttribute("aria-current", String(k === giostra.indice)));
}
function giostraVai(i) {
  const c = giostraCarte(), n = giostra.posizioni;
  if (!c.length) return;
  giostra.indice = ((i % n) + n) % n;
  giostra.animazioneFino = Date.now() + 1500;
  giostra.pista.scrollTo({ left: c[giostra.indice].offsetLeft - c[0].offsetLeft, behavior: pocheAnimazioni() ? "auto" : "smooth" });
  giostraSegna();
}
function giostraAvvia() {
  clearInterval(giostra.timer);
  giostra.timer = null;
  giostra.pausa.hidden = !giostraAutomatica();
  if (!giostraAutomatica()) return;
  giostra.timer = setInterval(() => {
    if (giostra.fermata || document.hidden || giostra.sopra || giostra.fuoco || Date.now() < giostra.pausaFino) return;
    giostraVai(giostra.indice + 1);
  }, giostra.secondi * 1000);
}
function giostraCostruisci() {
  aggiornaMostraTutto();
  const n = giostraPosizioni();
  giostra.animazioneFino = Date.now() + 1500;
  if (n !== giostra.punti.children.length) {
    giostra.punti.replaceChildren();
    for (let k = 0; k < n; k++) {
      const p = elemento("button");
      p.type = "button";
      p.setAttribute("aria-label", `Posizione ${k + 1} di ${n}`);
      p.addEventListener("click", () => { giostraPausa(); giostraVai(k); });
      giostra.punti.appendChild(p);
    }
  }
  giostra.posizioni = n;
  giostra.comandi.hidden = n <= 1;
  giostra.indice = Math.min(giostra.indice, n - 1);
  giostraSegna();
  giostraAvvia();
}
document.querySelectorAll("[data-giostra]").forEach((b) => {
  b.addEventListener("click", () => { giostraPausa(); giostraVai(giostra.indice + Number(b.dataset.giostra)); });
});
giostra.pausa.addEventListener("click", () => {
  giostra.fermata = !giostra.fermata;
  giostra.pausa.setAttribute("aria-pressed", String(giostra.fermata));
  giostra.pausa.setAttribute("aria-label", giostra.fermata ? "Riprendi lo scorrimento automatico" : "Ferma lo scorrimento automatico");
  giostra.pausa.querySelector("use").setAttribute("href", giostra.fermata ? "#i-riprendi" : "#i-pausa");
});
// Uno scorrimento avviato dal codice (giostraVai) non conta come sfogliata dell'utente.
giostra.pista.addEventListener("scroll", () => {
  if (Date.now() > giostra.animazioneFino) giostraPausa();
  clearTimeout(giostra.ritardoScroll);
  giostra.ritardoScroll = setTimeout(() => { giostra.indice = giostraIndiceDaScroll(); giostraSegna(); }, 150);
});
// Solo il mouse vero mette in pausa "finché è sopra": sui telefoni un tocco simula mouseenter ma non mouseleave.
document.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") giostra.sopra = giostra.pista.contains(e.target); });
giostra.pista.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") giostra.sopra = false; });
radice.addEventListener("mouseleave", () => { giostra.sopra = false; });
// Il fuoco ferma lo scorrimento solo se arriva dalla tastiera (:focus-visible): un clic col mouse su un comando no.
function fuocoDaTastiera() {
  const el = document.activeElement;
  return !!el && giostra.area.contains(el) && el.matches(":focus-visible");
}
giostra.area.addEventListener("focusin", () => setTimeout(() => { giostra.fuoco = fuocoDaTastiera(); }, 0));
giostra.area.addEventListener("focusout", () => setTimeout(() => { giostra.fuoco = fuocoDaTastiera(); }, 0));
let giostraRitardo = null;
addEventListener("resize", () => { clearTimeout(giostraRitardo); giostraRitardo = setTimeout(giostraCostruisci, 150); });

fetch("recensioni.json", { cache: "no-cache" })
  .then((r) => (r.ok ? r.json() : null))
  .then(mostraRecensioni)
  .catch(senzaRecensioni);
