# js/debug.js

## Scopo

Gestisce il pannello di debug HTML e il pannello lavoratori locali. Collega gli input HTML ai parametri di `GameConfig` in tempo reale, e implementa l'assegnazione e la rimozione dei lavoratori locali sulle celle selezionate.

È caricato in fondo al body di `index.html`, dopo gli elementi HTML che referenzia.

## Elementi HTML gestiti

### Pannello debug

- `debug-toggle` – pulsante per mostrare/nascondere il pannello.
- `debug-panel` – div contenitore del pannello.
- `cfg-<nomeParametro>` – un input numerico per ogni parametro di `GameConfig`.
- `debug-reset` – pulsante "Reset to Defaults".
- `debug-apply` – pulsante "Apply & Reload".

### Pannello lavoratori locali

- `local-worker-panel` – div contenitore, nascosto di default.
- `local-worker-info` – testo con coordinate della cella e numero lavoratori.
- `local-worker-add` – pulsante `+`.
- `local-worker-remove` – pulsante `-`.

## Funzioni principali

### populateDebugPanel()

Scorre tutte le proprietà di `GameConfig`. Per ogni chiave:

- Cerca un elemento HTML con id `cfg-<chiave>`.
- Se esiste, imposta il valore con `input.value = GameConfig[key]`.
- Aggiunge un listener `input` che, al cambiamento, aggiorna `GameConfig[key]` con il valore parsato come float. Se il valore non è un numero valido, viene ignorato.
- Stampa in console il valore aggiornato.

Viene chiamata quando il pannello debug viene aperto.

### updateLocalWorkerPanel()

Mostra o nasconde il pannello `local-worker-panel` in base allo stato:

- Se `selectedLocalCell && gameState === 'settlement'`: mostra il pannello e aggiorna il testo con coordinate e `assignedWorkers`.
- Altrimenti: nasconde il pannello.

Viene chiamata da `updateInfoText()` in `main.js` e dai listener dei bottoni `+` e `-`.

## Listener

### debug-toggle

Al click:

- Se il pannello è nascosto, lo mostra e chiama `populateDebugPanel()`.
- Se il pannello è visibile, lo nasconde.

### debug-reset

Al click:

- Scorre tutte le chiavi di `defaultConfig` (copia dei valori di default veri, creata all'avvio con `{ ...GameConfigDefaults }`).
- Ripristina `GameConfig[key]` con il valore di default.
- Aggiorna il campo HTML corrispondente.
- Cancella la configurazione salvata in `localStorage`.
- Mostra un alert per ricordare che alcune modifiche (es. `hexCenterDistanceKm`, `pixelsPerKm`, `worldWidth`, `worldHeight`) richiedono il reload.

### debug-apply

Al click: salva i valori correnti di `GameConfig` in `localStorage` (chiave `GAME_CONFIG_STORAGE_KEY`) e ricarica la pagina (`location.reload()`). Serve per applicare modifiche ai parametri strutturali.

### local-worker-add

Al click, se una cella locale è selezionata e `gameState === 'settlement'`:

1. Verifica che `settlement.unassignedPopulation > 0`.
2. Cerca il Pop `gatherer` in `settlement.pops`. Se non esiste, lo crea e lo aggiunge.
3. Incrementa `cell.assignedWorkers`.
4. Decrementa `settlement.unassignedPopulation`.
5. Incrementa `settlement.localGatherers`.
6. Incrementa `pop.totalWorkers` e `pop.localWorkers`.
7. Chiama `updateInfoText()`, `updateSettlementText()`, `updateLocalWorkerPanel()`, `updateCellWorkerLabels()`.

### local-worker-remove

Al click, se una cella locale è selezionata e `gameState === 'settlement'`:

1. Verifica che `cell.assignedWorkers > 0`.
2. Cerca il Pop `gatherer`. Se esiste e ha `localWorkers > 0`:
   - Decrementa `cell.assignedWorkers`.
   - Incrementa `settlement.unassignedPopulation`.
   - Decrementa `settlement.localGatherers`.
   - Decrementa `pop.totalWorkers` e `pop.localWorkers`.
3. Aggiorna pannelli ed etichette.

## Variabili globali

- `defaultConfig` – copia dei valori di default veri di `GameConfig`, creata all'avvio con `{ ...GameConfigDefaults }`. Usata dal pulsante "Reset to Defaults".

## Dipendenze in ingresso

- `index.html` – carica lo script dopo i pannelli HTML.

## Dipendenze in uscita

- `js/config.js` – per `GameConfig` e `defaultConfig`.
- `js/world.js` – per `getCell` (usato nei listener `+` e `-`).
- `js/units.js` – per `settlement`, `Pop`, `selectedLocalCell` (indirettamente).
- `js/main.js` – per `updateInfoText`, `updateSettlementText`, `updateCellWorkerLabels`, `gameState`, `selectedLocalCell`, `isInputFocused`.

## Parametri GameConfig usati

Nessuno direttamente. Legge e scrive su `GameConfig` in modo generico, tramite iterazione sulle chiavi.

## Stato globale modificato

- `GameConfig` (tutti i parametri modificabili dal pannello).
- `settlement` (tramite i listener `+` e `-`).
- Il Pop `gatherer` in `settlement.pops`.
- Le celle della griglia (`assignedWorkers`).

## Note per modifiche

- L'ordine di caricamento è critico: `debug.js` deve essere caricato **dopo** i pannelli HTML, altrimenti gli `addEventListener` falliscono con errore "Cannot read properties of null".
- Per aggiungere un nuovo parametro al pannello debug, occorre:
  1. Aggiungerlo a `GameConfig` in `config.js`.
  2. Aggiungere un input HTML in `debug-panel` con id `cfg-<nomeParametro>`.
  3. Il resto è automatico: `populateDebugPanel` lo troverà e lo collegherà.
- Il pannello non gestisce valori non numerici (solo float).
- Il pannello non ha un pulsante "Salva preset" o "Carica preset".
- Se si modifica la logica di assegnazione lavoratori, verificare che `settlement.localGatherers`, `pop.localWorkers` e `cell.assignedWorkers` siano sempre coerenti.
- Se si aggiunge una nuova funzione chiamata da `main.js`, dichiararla prima dei listener per evitare errori di hoisting.