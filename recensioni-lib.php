<?php
declare(strict_types=1);

/**
 * Funzioni condivise per l'aggiornamento delle recensioni su hosting PHP (Hostinger e simili).
 * Le usano:
 *   - aggiorna-recensioni.php  (dal cron di hPanel o dal browser con token)
 *   - recensioni.php           (risponde al posto di recensioni.json e, se il file ha piu' di una settimana, lo rinnova prima)
 * Stessa logica di scripts/aggiorna-recensioni.mjs, la versione per GitHub Actions.
 */

const PLACE_ID_PREDEFINITO = 'ChIJcV_Xya3fOhMRWT5u9UL0X08'; // scheda "Ristorante Pino D'Oro", Mondragone
const CAMPI = 'id,displayName,rating,userRatingCount,reviews,googleMapsUri';
const LINGUE = ['it', 'en'];           // Google da' 5 recensioni per lingua: la prima e' la principale (voto, conteggio, testi in italiano),
                                       // le altre aggiungono le recensioni scritte in quella lingua, mostrate nella loro lingua.
const MEMORIA_GIORNI = 30;             // le recensioni uscite dalle 5 di Google restano visibili fino a 30 giorni dall'ultima volta viste (limite di Google)
const MASSIMO_TUTTE = 12;              // numero massimo di recensioni conservate nel file
const TESTO_MAX = 320;                 // caratteri mostrati per recensione (oltre: "..." e link "Leggi tutto")
const TESTO_MIN = 40;                  // recensioni piu' corte non vengono scelte
const VALUTAZIONE_MIN = 4;             // recensioni con meno stelle non vengono scelte
// Parole che, anche in una recensione a 5 stelle, non vogliamo in evidenza: la recensione viene lasciata fuori.
const PAROLE_ESCLUSE = ['rubbish', 'terrible', 'awful', 'horrible', 'disgusting', 'worst', 'rude', 'dirty', 'overpriced', 'rip off', 'rip-off', 'scam', 'avoid', 'never again', 'disappoint', 'unfriendly',
    'pessim', 'orribil', 'terribil', 'schifo', 'maleducat', 'sporc', 'delus', 'scaden', 'sconsigli', 'mai più', 'mai piu', 'da evitare', 'fregatura', 'vergogn'];
const TIMEOUT_SEC = 20;
const ETA_MASSIMA_SEC = 7 * 24 * 3600; // dopo una settimana recensioni.json va rinnovato
const RIPROVA_DOPO_SEC = 6 * 3600;     // se Google non risponde, si riprova al massimo ogni 6 ore

// Una recensione per ciascuna categoria del documento della campagna, in quest'ordine.
const CATEGORIE = [
    'lavoro' => ['lavoro', 'pausa', 'veloc', 'rapid', 'servizio', 'cortes', 'gentil', 'tempi', 'puntual', 'personale', 'attent', 'professional'],
    'viaggio' => ['viaggio', 'passaggio', 'famiglia', 'bambin', 'figli', 'vacanz', 'sosta', 'strada', 'domiziana', 'torner', 'fermat', 'tappa'],
    'cibo' => ['lupin', 'spaghett', 'pesce', 'fritt', 'cucina', 'piatt', 'buon', 'mangiat', 'fresc', 'qualit', 'porzion', 'ottim', 'delizios'],
];

mb_internal_encoding('UTF-8');

function percorsoRecensioni(): string
{
    return __DIR__ . '/recensioni.json';
}

/** Legge config.php (copia compilata di config.example.php); array vuoto se manca. */
function leggiConfig(): array
{
    if (!is_file(__DIR__ . '/config.php')) {
        return [];
    }
    $letto = require __DIR__ . '/config.php';
    return is_array($letto) ? $letto : [];
}

/** Secondi trascorsi dall'ultimo aggiornamento di recensioni.json; null se il file manca. */
function etaRecensioni(): ?int
{
    $file = percorsoRecensioni();
    if (!is_file($file)) {
        return null;
    }
    $dati = json_decode((string) file_get_contents($file), true);
    $quando = is_array($dati) ? strtotime((string) ($dati['aggiornato'] ?? '')) : false;
    if ($quando === false) {
        $quando = filemtime($file) ?: 0;
    }
    return max(0, time() - $quando);
}

// ---------------------------------------------------------------- lettura dalla scheda Google
function dettagli(string $chiave, string $placeId, string $fixture, string $lingua = 'it'): array
{
    if ($fixture !== '') {
        if ($lingua !== LINGUE[0]) { // prove senza rete: PLACES_FIXTURE_EN ecc. per le altre lingue
            $fixture = (string) getenv('PLACES_FIXTURE_' . strtoupper($lingua));
            if ($fixture === '') {
                return ['reviews' => []];
            }
        }
        $contenuto = @file_get_contents($fixture);
        if ($contenuto === false) {
            throw new RuntimeException('Risposta di prova non leggibile: ' . $fixture);
        }
        $dati = json_decode($contenuto, true);
        if (!is_array($dati)) {
            throw new RuntimeException('Risposta di prova non valida.');
        }
        return $dati;
    }
    $url = 'https://places.googleapis.com/v1/places/' . rawurlencode($placeId) . '?languageCode=' . rawurlencode($lingua) . '&regionCode=IT';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => TIMEOUT_SEC,
        CURLOPT_HTTPHEADER => ['X-Goog-Api-Key: ' . $chiave, 'X-Goog-FieldMask: ' . ($lingua === LINGUE[0] ? CAMPI : 'reviews'), 'Accept: application/json'],
    ]);
    $corpo = curl_exec($ch);
    $errore = curl_error($ch);
    $stato = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($corpo === false) {
        throw new RuntimeException('Google non raggiungibile: ' . $errore);
    }
    if ($stato !== 200) {
        throw new RuntimeException('Places API ' . $stato . ': ' . mb_substr((string) $corpo, 0, 300));
    }
    $dati = json_decode((string) $corpo, true);
    if (!is_array($dati)) {
        throw new RuntimeException('Risposta di Google non leggibile.');
    }
    return $dati;
}

/** Tempo trascorso in italiano ("3 settimane fa"), uguale per tutte le lingue. */
function quandoItaliano(string $publishTime, int $adesso): string
{
    $t = strtotime($publishTime);
    if (!$t) {
        return '';
    }
    $giorni = max(0, intdiv($adesso - $t, 86400));
    if ($giorni < 1) {
        return 'oggi';
    }
    if ($giorni === 1) {
        return 'ieri';
    }
    if ($giorni < 7) {
        return "$giorni giorni fa";
    }
    $settimane = intdiv($giorni, 7);
    if ($giorni < 30) {
        return $settimane === 1 ? 'una settimana fa' : "$settimane settimane fa";
    }
    $mesi = (int) floor($giorni / 30.44);
    if ($giorni < 365) {
        return $mesi <= 1 ? 'un mese fa' : "$mesi mesi fa";
    }
    $anni = (int) floor($giorni / 365.25);
    return $anni <= 1 ? 'un anno fa' : "$anni anni fa";
}

// ---------------------------------------------------------------- selezione (identica allo script Node)
function nomeBreve(?string $nome): string
{
    $parti = preg_split('/\s+/u', trim((string) $nome)) ?: [];
    $parti = array_values(array_filter($parti, static fn(string $p): bool => $p !== ''));
    if (!$parti) {
        return 'Cliente Google';
    }
    if (count($parti) === 1) {
        return $parti[0];
    }
    return $parti[0] . ' ' . mb_strtoupper(mb_substr($parti[count($parti) - 1], 0, 1)) . '.';
}

function accorcia(string $testo): array
{
    if (mb_strlen($testo) <= TESTO_MAX) {
        return [$testo, false];
    }
    $taglio = mb_strrpos(mb_substr($testo, 0, TESTO_MAX + 1), ' ');
    $fine = ($taglio !== false && $taglio > TESTO_MAX / 2) ? $taglio : TESTO_MAX;
    $breve = preg_replace('/[\s,;:]+$/u', '', mb_substr($testo, 0, $fine));
    return [$breve . "\u{2026}", true];
}

function punteggio(string $testo, array $parole): int
{
    $t = mb_strtolower($testo);
    $n = 0;
    foreach ($parole as $p) {
        if (str_contains($t, $p)) {
            $n++;
        }
    }
    return $n;
}

function scegli(array $recensioni): array
{
    $valide = array_values(array_filter($recensioni, static fn(array $r): bool =>
        mb_strlen($r['testoIntero']) >= TESTO_MIN && $r['valutazione'] >= VALUTAZIONE_MIN));
    $usate = [];
    $scelte = [];
    foreach (CATEGORIE as $categoria => $parole) {
        $migliore = null;
        $max = 0;
        foreach ($valide as $i => $r) {
            if (isset($usate[$i])) {
                continue;
            }
            $s = punteggio($r['testoIntero'], $parole);
            if ($s > $max) {
                $max = $s;
                $migliore = $i;
            }
        }
        if ($migliore !== null) {
            $usate[$migliore] = true;
            $scelte[] = $valide[$migliore] + ['categoria' => $categoria];
        }
    }
    $ordine = array_keys($valide);
    $italiana = static fn(array $r): int => (($r['lingua'] ?? LINGUE[0]) === LINGUE[0]) ? 1 : 0;
    usort($ordine, static fn(int $a, int $b): int =>
        [$italiana($valide[$b]), $valide[$b]['valutazione'], $valide[$b]['data']] <=> [$italiana($valide[$a]), $valide[$a]['valutazione'], $valide[$a]['data']]);
    foreach ($ordine as $i) {
        if (count($scelte) >= 3) {
            break;
        }
        if (!isset($usate[$i])) {
            $usate[$i] = true;
            $scelte[] = $valide[$i] + ['categoria' => 'altro'];
        }
    }
    return array_map(static function (array $r): array {
        unset($r['testoIntero']);
        return $r;
    }, $scelte);
}

/** Identita' di una recensione: il suo link su Google (uno per recensione), altrimenti autore e testo. */
function chiaveRecensione(array $r): string
{
    return (isset($r['link']) && str_contains((string) $r['link'], '/reviews/')) ? (string) $r['link'] : $r['autore'] . '|' . $r['testo'];
}

/** Unisce le recensioni scaricate con quelle del file precedente non piu' date da Google, tenute per MEMORIA_GIORNI. */
function unisci(array $nuove, ?array $precedente, int $adesso): array
{
    $presenti = [];
    foreach ($nuove as $r) {
        $presenti[chiaveRecensione($r)] = true;
    }
    $ultimaLettura = strtotime((string) ($precedente['aggiornato'] ?? '')) ?: 0;
    $conservate = [];
    foreach ($precedente['tutte'] ?? [] as $r) {
        if (!is_array($r) || isset($presenti[chiaveRecensione($r)])) {
            continue;
        }
        $vista = strtotime((string) ($r['ultimaVoltaVista'] ?? '')) ?: $ultimaLettura;
        if (!$vista || $adesso - $vista > MEMORIA_GIORNI * 86400) {
            continue;
        }
        $r['ultimaVoltaVista'] = gmdate('Y-m-d\TH:i:s.v\Z', $vista);
        $conservate[] = $r;
    }
    $tutte = array_merge($nuove, $conservate);
    usort($tutte, static fn(array $a, array $b): int => strcmp((string) $b['data'], (string) $a['data']));
    return array_slice($tutte, 0, MASSIMO_TUTTE);
}

function normalizza(array $dati, array $extra, string $placeId, ?array $precedente = null, ?int $adesso = null): array
{
    $adesso = $adesso ?? time();
    $converti = static function (array $r, string $lingua) use ($dati, $adesso): ?array {
        $testoIntero = trim((string) preg_replace('/\s+/u', ' ', (string) ($r['text']['text'] ?? ($r['originalText']['text'] ?? ''))));
        if ($testoIntero === '') {
            return null;
        }
        [$testo, $troncata] = accorcia($testoIntero);
        return [
            'autore' => nomeBreve($r['authorAttribution']['displayName'] ?? null),
            'valutazione' => (int) ($r['rating'] ?? 0),
            'testo' => $testo,
            'troncata' => $troncata,
            'testoIntero' => $testoIntero,
            'quando' => quandoItaliano((string) ($r['publishTime'] ?? ''), $adesso),
            'data' => (string) ($r['publishTime'] ?? ''),
            'link' => (string) ($r['googleMapsUri'] ?? ($dati['googleMapsUri'] ?? '')),
            'lingua' => $lingua,
        ];
    };
    // Lingua principale: tutto (i testi sono in italiano, tradotti da Google se serve).
    $scaricate = [];
    $presenti = [];
    foreach ($dati['reviews'] ?? [] as $r) {
        $c = $converti($r, LINGUE[0]);
        if ($c) {
            $scaricate[] = $c;
            $presenti[chiaveRecensione($c)] = true;
        }
    }
    // Altre lingue: solo le recensioni scritte davvero in quella lingua e non gia' presenti.
    foreach ($extra as $blocco) {
        foreach ($blocco['reviews'] ?? [] as $r) {
            if ((string) ($r['originalText']['languageCode'] ?? '') !== $blocco['lingua']) {
                continue;
            }
            $c = $converti($r, $blocco['lingua']);
            if (!$c || isset($presenti[chiaveRecensione($c)])) {
                continue;
            }
            $presenti[chiaveRecensione($c)] = true;
            $scaricate[] = $c;
        }
    }
    $manuali = escluseManuali();
    $tutte = array_values(array_filter(unisci($scaricate, $precedente, $adesso), static fn(array $r): bool => !daEscludere($r, $manuali)));
    $perScelta = array_map(static function (array $r): array {
        $r['testoIntero'] = $r['testoIntero'] ?? $r['testo'];
        return $r;
    }, $tutte);
    $valutazione = $dati['rating'] ?? null;
    $numero = $dati['userRatingCount'] ?? null;
    return [
        'aggiornato' => gmdate('Y-m-d\TH:i:s', $adesso) . '.000Z',
        'placeId' => (string) ($dati['id'] ?? $placeId),
        'nome' => (string) ($dati['displayName']['text'] ?? ''),
        'googleMapsUri' => (string) ($dati['googleMapsUri'] ?? ''),
        'valutazione' => is_int($valutazione) || is_float($valutazione) ? $valutazione : null,
        'numeroRecensioni' => is_int($numero) ? $numero : null,
        'scelte' => scegli($perScelta),
        'tutte' => array_map(static function (array $r): array {
            unset($r['testoIntero']);
            return $r;
        }, $tutte),
    ];
}

/** Esclusioni manuali: righe di recensioni-escluse.txt (nome abbreviato come nella pagina, es. "Tania G.", o un pezzo del link). */
function escluseManuali(): array
{
    $file = __DIR__ . '/recensioni-escluse.txt';
    if (!is_file($file)) {
        return [];
    }
    $righe = [];
    foreach (preg_split('/\r?\n/', (string) file_get_contents($file)) as $riga) {
        $riga = trim($riga);
        if ($riga !== '' && !str_starts_with($riga, '#')) {
            $righe[] = mb_strtolower($riga);
        }
    }
    return $righe;
}

function daEscludere(array $r, array $manuali): bool
{
    $t = mb_strtolower($r['testoIntero'] ?? $r['testo']);
    foreach (PAROLE_ESCLUSE as $p) {
        if (str_contains($t, $p)) {
            return true;
        }
    }
    $autore = mb_strtolower($r['autore']);
    $link = mb_strtolower((string) ($r['link'] ?? ''));
    foreach ($manuali as $m) {
        if ($autore === $m || ($link !== '' && str_contains($link, $m))) {
            return true;
        }
    }
    return false;
}

function codifica(array $dati): string
{
    return json_encode($dati, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION) . "\n";
}

function senzaData(array $dati): string
{
    unset($dati['aggiornato']);
    return json_encode($dati, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/**
 * Interroga Google e riscrive recensioni.json (sempre, cosi' la data "aggiornato" e' quella dell'ultimo controllo).
 * Ritorna ['cambiato' => bool, 'messaggio' => string]. Lancia un'eccezione se Google non risponde o il file non si scrive.
 */
function aggiornaRecensioni(array $config, string $fixture = ''): array
{
    $chiave = trim((string) ($config['api_key'] ?? ''));
    $placeId = trim((string) ($config['place_id'] ?? '')) ?: PLACE_ID_PREDEFINITO;
    if ($chiave === '' && $fixture === '') {
        throw new RuntimeException("Manca api_key: copia config.example.php in config.php e inserisci la chiave di Google Maps Platform.");
    }
    $file = percorsoRecensioni();
    $precedente = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
    $adesso = (PHP_SAPI === 'cli' && getenv('RECENSIONI_ADESSO')) ? (strtotime((string) getenv('RECENSIONI_ADESSO')) ?: time()) : time(); // solo per le prove
    $base = dettagli($chiave, $placeId, $fixture, LINGUE[0]);
    $extra = [];
    foreach (array_slice(LINGUE, 1) as $lingua) {
        $extra[] = ['lingua' => $lingua, 'reviews' => dettagli($chiave, $placeId, $fixture, $lingua)['reviews'] ?? []];
    }
    $nuovo = normalizza($base, $extra, $placeId, is_array($precedente) ? $precedente : null, $adesso);
    $cambiato = !(is_array($precedente) && senzaData($precedente) === senzaData($nuovo));
    $temporaneo = $file . '.tmp';
    if (file_put_contents($temporaneo, codifica($nuovo)) === false || !rename($temporaneo, $file)) {
        throw new RuntimeException('Non riesco a scrivere recensioni.json (controlla i permessi della cartella).');
    }
    $riassunto = sprintf('%s su Google, %s recensioni, %d mostrate', $nuovo['valutazione'] ?? '-', $nuovo['numeroRecensioni'] ?? '-', count($nuovo['scelte']));
    return [
        'cambiato' => $cambiato,
        'messaggio' => $cambiato
            ? "Aggiornato recensioni.json: $riassunto (" . implode(', ', array_column($nuovo['scelte'], 'categoria')) . ').'
            : "Nessuna novita': $riassunto (data di controllo aggiornata).",
    ];
}
