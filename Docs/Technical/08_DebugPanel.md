# Debug Panel

## Scopo

Questo documento descrive il pannello di debug HTML, la sua logica di collegamento ai parametri di `GameConfig` e le funzionalità di reset e reload. Il modulo è implementato in `js/debug.js` e in una porzione di `index.html`.

## Struttura HTML

Il pannello debug è composto da:

- Un pulsante `debug-toggle` in alto a destra con testo "Debug".

- Un div `debug-panel`, nascosto di default (`display:none`), con:
  
  - Un titolo `Game Config`.
  
  - Un input numerico per ogni parametro di `GameConfig`, con id `cfg-<nomeParametro>`.
  
  - Un pulsante `debug-reset` (Reset to Defaults).
  
  - Un pulsante `debug-apply` (Apply & Reload).

Il pannello ha larghezza 360px, font 11px, `max-height: 80%`, `overflow-y: auto`, `overflow-x: hidden`. Le etichette lunghe sono state abbreviate per evitare overflow orizzontale.

Inoltre, esiste un pannello separato `local-worker-panel` (anch'esso in HTML) per l'assegnazione dei lavoratori locali, ma la sua logica è descritta in `05_Local_Gathering.md`.

## Variabile defaultConfig

All'avvio di `debug.js`, viene creata una copia dei valori iniziali di `GameConfig`:

text

const defaultConfig = { ...GameConfig };

Questa copia viene usata dal pulsante Reset per ripristinare i valori originali.

## Funzione populateDebugPanel

La funzione `populateDebugPanel()` scorre tutte le proprietà di `GameConfig`. Per ogni chiave:

- Cerca un elemento HTML con id `cfg-<chiave>`.

- Se esiste, imposta il valore con `input.value = GameConfig[key]`.

- Aggiunge un listener `input` che, al cambiamento, aggiorna `GameConfig[key]` con il valore parsato come float. Se il valore non è un numero valido, viene ignorato.

- Stampa in console il valore aggiornato.

La funzione viene chiamata quando il pannello viene aperto (vedi sotto).

## Apertura e chiusura del pannello

Il pulsante `debug-toggle` ha un listener che:

- Se il pannello è nascosto, lo mostra e chiama `populateDebugPanel()` per popolare i campi.

- Se il pannello è visibile, lo nasconde.

Questo garantisce che i campi siano sempre sincronizzati con i valori correnti di `GameConfig` al momento dell'apertura.

## Reset to Defaults

Il pulsante `debug-reset` ha un listener che:

- Scorre tutte le chiavi di `defaultConfig`.

- Ripristina `GameConfig[key]` con il valore di default.

- Aggiorna il campo HTML corrispondente.

- Mostra un alert all'utente per ricordare che alcune modifiche (es. `cellSize`, `worldWidth`, `worldHeight`) richiedono il reload della pagina.

## Apply & Reload

Il pulsante `debug-apply` ha un listener che ricarica la pagina (`location.reload()`). Serve per applicare modifiche ai parametri strutturali che non possono essere aggiornati a runtime.

## Pannello lavoratori locali

Il pannello `local-worker-panel` è un div separato, nascosto di default. La sua visibilità è gestita da `updateLocalWorkerPanel()`:

- Se `selectedLocalCell && gameState === 'camp'`, il pannello è visibile e mostra le coordinate della cella e il numero di lavoratori assegnati.

- Altrimenti, è nascosto.

I due bottoni `local-worker-add` e `local-worker-remove` hanno listener che:

### Aggiunta (+)

- Verifica che la cella selezionata esista e che `camp.unassignedPopulation > 0`.

- Cerca il Pop `gatherer`. Se non esiste, lo crea.

- Incrementa `cell.assignedWorkers`, decrementa `camp.unassignedPopulation`, incrementa `camp.localGatherers`, `pop.totalWorkers`, `pop.localWorkers`.

- Aggiorna i pannelli e le etichette chiamando `updateInfoText()`, `updateCampText()`, `updateLocalWorkerPanel()` e `updateCellWorkerLabels()`.

### Rimozione (-)

- Verifica che la cella selezionata esista e che `cell.assignedWorkers > 0`.

- Cerca il Pop `gatherer`. Se esiste e ha `localWorkers > 0`:
  
  - Decrementa `cell.assignedWorkers`, incrementa `camp.unassignedPopulation`, decrementa `camp.localGatherers`, `pop.totalWorkers`, `pop.localWorkers`.

- Aggiorna i pannelli e le etichette.

## Ordine di caricamento

In `index.html`, il file `debug.js` viene caricato dopo i pannelli HTML (`debug-panel` e `local-worker-panel`), in fondo al body. Questo è essenziale perché gli elementi HTML referenziati (es. `document.getElementById('debug-reset')`) devono esistere quando `debug.js` viene eseguito.

Se `debug.js` fosse caricato nel `<head>` o prima dei pannelli, gli addEventListener sui pulsanti genererebbero un errore "Cannot read properties of null".

## Integrazione con il pannello GameConfig

Il pannello debug non definisce nuovi parametri: legge e scrive su `GameConfig`. Per aggiungere un nuovo parametro, occorre:

1. Aggiungerlo a `GameConfig` in `config.js`.

2. Aggiungere un input HTML in `debug-panel` con id `cfg-<nomeParametro>`.

3. Il resto è automatico: `populateDebugPanel` lo troverà e lo collegherà.

## Note e limiti attuali

- I parametri con valori molto grandi o molto piccoli potrebbero richiedere step appropriati. Gli step degli input HTML sono definiti direttamente in `index.html`.

- Il pannello non ha un pulsante "Salva preset" o "Carica preset". In futuro si potrà aggiungere.

- I parametri strutturali (`cellSize`, `worldWidth`, `worldHeight`) non possono essere aggiornati a runtime perché la griglia è costruita all'avvio con costanti derivate. Serve il reload.

- Il pannello non gestisce valori non numerici. Solo float.

## Interazioni con altri moduli

- `config.js`: fornisce `GameConfig` e `defaultConfig` (copia dei valori iniziali).

- `world.js`: legge i parametri modificati per dimensioni e comportamento delle celle.

- `units.js`: legge i parametri modificati per velocità, consumi, capacità.

- `main.js`: legge i parametri modificati per raccolta locale, previsioni, rendering.

- `time.js`: non è influenzato direttamente, ma la velocità di gioco può essere modificata con le scorciatoie, non dal pannello debug.