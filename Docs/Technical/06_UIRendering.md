# UI Rendering

## Scopo

Questo documento descrive come il gioco disegna l'interfaccia utente e gli elementi sulla mappa, le funzioni di rendering, i graphics objects utilizzati, i pannelli HTML sovrapposti e le interazioni con l'input del giocatore.

## Graphics objects

Il gioco utilizza diversi oggetti `Phaser.GameObjects.Graphics` per disegnare sulla scena. Vengono creati in `create()` e riutilizzati ogni frame tramite `clear()` e ridisegno.

- `gridGraphics`: disegna le celle della griglia in base alla densità di cibo. Usato anche per evidenziare la cella selezionata.

- `popGraphics`: disegna le spedizioni come cerchi colorati in base allo stato, con indicatori di selezione, percorso, area di raccolta.

- `campGraphics`: disegna il campo (quadrato marrone con bordo) e il raggio locale quando il campo è selezionato.

- `warningGraphics`: disegna i triangoli rossi persistenti per le celle sotto soglia (in modalità camp) o sul campo (in modalità mappa).

Tutti i graphics objects hanno un depth specifico per l'ordine di sovrapposizione:

- `gridGraphics`: depth di default (0)

- `popGraphics`: depth di default

- `campGraphics`: depth di default

- `warningGraphics`: depth 300

- testi vari: depth vari (150 per etichette lavoratori, 200 per info panel, 100 per tooltip temporanei)

## Creazione della scena (create)

La funzione `create()` in `main.js`:

1. Chiama `createGrid()` e `initializeForageDensity()` per popolare la griglia.

2. Crea i graphics objects: `gridGraphics`, `campGraphics`, `popGraphics`, `warningGraphics`.

3. Disegna la griglia iniziale con un loop su tutte le celle (in realtà ridondante perché `drawGrid` viene chiamato ogni frame, ma serve per l'aspetto iniziale).

4. Aggiunge il testo di debug in alto a sinistra.

5. Chiama `enableDebugClick(this)` per attivare i listener di input.

6. Salva il riferimento alla scena in `gameScene`.

7. Crea i testi UI: `infoText`, `campText`, `speedText`.

8. Chiama `drawPops()`, `drawCamp()` e `updateCellWorkerLabels()` per il primo disegno.

## Griglia (drawGrid)

La funzione `drawGrid()` ridisegna tutte le celle della griglia in base al valore di `forageDensity`. Viene chiamata ogni frame in `update()`.

Per ogni cella:

- Si legge `cell.forageDensity`.

- Si sceglie un colore in base a intervalli precisi:
  
  - `>= 0.90`: verde scuro (`0x1a4d0a`)
  
  - `>= 0.75`: verde medio (`0x2d6b14`)
  
  - `>= 0.50`: verde chiaro (`0x4a8c1f`)
  
  - `>= 0.25`: giallo (`0xc4a80b`)
  
  - `>= 0.05`: arancione (`0xc46e0b`)
  
  - `> 0.00`: rosso (`0x8b1a0a`)
  
  - `0.00`: nessun colore (sfondo)

- Si disegna un rettangolo pieno con `gridGraphics.fillRect`.

La funzione è computazionalmente onerosa su griglie grandi, ma attualmente la mappa è limitata a `1280x720` pixel con celle di 10px (128x72 celle). In futuro potrà essere ottimizzata disegnando solo le celle visibili o usando texture precalcolate.

## Spedizioni (drawPops)

La funzione `drawPops()` disegna tutte le spedizioni attive come cerchi colorati. Viene chiamata ogni frame in `update()`.

Per ogni spedizione:

- Il colore del cerchio dipende dallo stato:
  
  - `gathering`: verde (`0x00ff00`)
  
  - `returningToCamp`: arancione (`0xff8800`)
  
  - `resting`: grigio (`0x888888`)
  
  - altri stati: bianco (`0xffffff`)

- Si disegna il cerchio con `popGraphics.fillCircle(x, y, 8)`.

- Se `isForced`, si disegna un bordo rosso con `strokeCircle(x, y, 10)`.

- Se `!useAssignedArea`, si disegna un bordo blu semitrasparente con `strokeCircle(x, y, 12)`.

- Se la spedizione è selezionata (`selectedExpedition`):
  
  - Si disegna un bordo giallo con `strokeCircle(x, y, 10)`.
  
  - Se `useAssignedArea`, si disegna un percorso tratteggiato dal campo al centro dell'area con `drawDashedLine`, e un cerchio giallo semitrasparente attorno al centro dell'area.
  
  - Se `!useAssignedArea`, si disegna un percorso tratteggiato dal campo alla posizione corrente della spedizione, e un cerchio giallo attorno alla spedizione stessa.

- Se lo stato è `travellingToArea` o `returningToCamp`, si disegna una linea bianca semitrasparente verso il target.

## Campo (drawCamp)

La funzione `drawCamp()` disegna il campo e, se selezionato, il raggio locale. Viene chiamata ogni frame in `update()`.

- Si disegna un quadrato marrone (`0x8b5e3c`) di lato 30 pixel centrato su `CAMP_X`, `CAMP_Y`, con bordo color cuoio (`0xc4a46c`).

- Se `campSelected`:
  
  - Si disegna un bordo giallo attorno al quadrato.
  
  - Si calcola `getLocalGatherRadiusPx()` e si disegna un cerchio giallo semitrasparente (`lineStyle(1, 0xffff00, 0.3)`) centrato sul campo.

- Si aggiunge un'etichetta testuale "CAMP" sopra il quadrato. Attenzione: l'etichetta viene creata ogni frame con `gameScene.add.text()`, il che causa una crescita continua di oggetti testo. Questo è un bug noto da correggere.

## Cella selezionata (drawSelectedCell)

La funzione `drawSelectedCell()` disegna un bordo giallo attorno alla cella selezionata (`selectedLocalCell`). Viene chiamata ogni frame in `update()` dopo `drawGrid()`.

- Se `selectedLocalCell` è `null`, non fa nulla.

- Altrimenti, calcola le coordinate pixel della cella e disegna un rettangolo con `lineStyle(2, 0xffff00, 0.8)` e `strokeRect`.

## Warning (updateWarningIndicators)

La funzione `updateWarningIndicators()` disegna i triangoli rossi persistenti per le celle sotto soglia. Viene chiamata ogni frame in `update()`.

- Pulisce `warningGraphics`.

- Se `gameState === 'camp'`: per ogni chiave in `warningCells`, converte `"cx,cy"` in coordinate numeriche, calcola la posizione centrale della cella e disegna un triangolo rosso sopra di essa.

- Altrimenti (modalità mappa): se `warningCells.length > 0`, disegna un triangolo rosso sopra il campo.

## Etichette lavoratori (updateCellWorkerLabels)

La funzione `updateCellWorkerLabels()` gestisce i testi sopra le celle che mostrano il numero di lavoratori assegnati.

- Viene chiamata quando cambia l'assegnazione (in `debug.js`) e all'avvio (in `create()`).

- I testi sono memorizzati nell'oggetto globale `cellWorkerTexts` con chiave `"cx,cy"`.

- Per ogni cella con `assignedWorkers > 0`:
  
  - Se il testo esiste, aggiorna il contenuto con `setText`.
  
  - Se non esiste, crea un nuovo `Phaser.Text` con sfondo semitrasparente, centrato sulla cella, con depth 150.

- Se `assignedWorkers` diventa 0, distrugge il testo e lo rimuove dall'oggetto.

## Info panel (infoText)

Il pannello info è un oggetto `Phaser.Text` creato in `create()` in alto a destra (`1280 - 260, 10`). Ha larghezza 250 pixel con `wordWrap` attivo per evitare tagli.

La funzione `updateInfoText()` aggiorna il contenuto in base alla selezione corrente:

- Se `selectedExpedition`: mostra id, workerCount, stato, provviste, cibo, capacità, flag `[FORCED]` e `[AUTO]`.

- Se `selectedLocalCell && gameState === 'camp'`: mostra coordinate, densità, lavoratori, cibo raccolto daily, cibo rimanente alle soglie, giorni alle soglie, incremento con un lavoratore in più, giorni ridotti con un lavoratore in più.

- Se `campSelected && gameState === 'camp'`: mostra cibo, non assegnati, gatheredDaily, consumedDaily, cibo rimanente nell'area locale (to 25% e to 0%), e statistiche dei gatherer (locali, spedizioni, disponibili).

- Altrimenti: stringa vuota.

`updateInfoText()` viene chiamata ogni frame in `update()` e anche nei punti in cui cambia la selezione (click, assegnazione lavoratori). Viene inoltre chiamata da `updateLocalWorkerPanel()`? No, è il contrario: `updateInfoText()` chiama `updateLocalWorkerPanel()` alla fine, per aggiornare la visibilità del pannello.

## Speed indicator (speedText)

Un oggetto `Phaser.Text` creato in `create()` in alto a sinistra (`10, 30`). Mostra la velocità corrente con `updateSpeedText()`, che legge `TimeManager.getSpeedLabel()`.

## Camp text (campText)

Un oggetto `Phaser.Text` creato in `create()` in basso a sinistra (`10, 720 - 30`). Mostra cibo, popolazione totale, non assegnati e giorno corrente. Aggiornato ogni frame con `updateCampText()`.

## Pannello debug (HTML)

Il pannello debug è un `<div>` in `index.html` con id `debug-panel`, nascosto di default. Viene mostrato/nascosto dal pulsante `debug-toggle`. Contiene un input per ogni parametro di `GameConfig`, con id `cfg-<nomeParametro>`. La logica è in `debug.js`:

- `populateDebugPanel()` viene chiamata all'apertura e popola i campi con i valori correnti.

- Ogni input ha un listener `input` che aggiorna `GameConfig` in tempo reale.

- Il pulsante `Reset to Defaults` ripristina i valori originali (copia di `defaultConfig`).

- Il pulsante `Apply & Reload` ricarica la pagina per applicare modifiche strutturali.

Il pannello ha larghezza 360px, font 11px, `max-height:80%`, `overflow-y:auto`, `overflow-x:hidden`. Le etichette lunghe sono state abbreviate.

## Pannello lavoratori locali (HTML)

Un `<div>` con id `local-worker-panel`, nascosto di default. Viene mostrato/nascosto da `updateLocalWorkerPanel()`.

- Se `selectedLocalCell && gameState === 'camp'`, il pannello è visibile.

- Mostra le coordinate della cella e il numero di lavoratori assegnati.

- Contiene i bottoni `+` e `-` con id `local-worker-add` e `local-worker-remove`.

- I listener in `debug.js` gestiscono l'assegnazione e la rimozione, aggiornando il Pop, il campo, il pannello e le etichette.

## Input del giocatore

### Mouse

- **Click sinistro**:
  
  - Se su una spedizione: la seleziona.
  
  - Se sul campo: entra/esce dalla modalità camp.
  
  - Se in modalità camp e su una cella entro il raggio locale: seleziona la cella.
  
  - Se in modalità camp e fuori dal raggio: esce dalla modalità camp e deseleziona tutto.
  
  - Altrimenti: deseleziona tutto.

- **Shift + click sinistro** su una cella: ispezione debug, mostra densità e coordinate in un tooltip temporaneo.

- **Click destro**:
  
  - Se sul campo (con campo selezionato): crea spedizione automatica (funzione da rimuovere).
  
  - Se su una spedizione selezionata: aggiorna l'area di raccolta e la fa ripartire.
  
  - Altrimenti (con campo o spedizione selezionata): crea una nuova spedizione verso il punto cliccato.

- **Shift + click destro**: crea una spedizione forzata.

### Tastiera

- **R**: richiama la spedizione selezionata al campo.

- **F**: attiva/disattiva modalità forzata sulla spedizione selezionata.

- **A**: attiva/disattiva modalità automatica (area assegnata vs libera).

- **C**: cancella la spedizione selezionata (rientro + scioglimento).

- **Spazio**: pausa/play.

- **0-4**: imposta velocità (0 = 0.5x, 1 = 1x, 2 = 2x, 3 = 4x, 4 = 8x).

- **+ / -**: aumenta/diminuisce velocità.

Tutti i comandi da tastiera sono ignorati se un input HTML ha il focus (`isInputFocused()`).

## Game state

Il gioco ha due stati principali, gestiti dalla variabile globale `gameState`:

- `'map'`: stato mappa. I click selezionano spedizioni o deselezionano. Il campo non è selezionato.

- `'camp'`: stato gestione campo. Il campo è selezionato. I click su celle entro il raggio locale selezionano la cella. I click fuori dal raggio escono dallo stato.

Il passaggio tra stati avviene cliccando sul campo. Il campo è selezionato quando `campSelected === true`, che è sempre `true` in stato `'camp'`.

## Note e limiti attuali

- L'etichetta "CAMP" viene ricreata ogni frame in `drawCamp()`, causando un aumento continuo di oggetti testo. Va corretto creandola una sola volta e aggiornandone la posizione se necessario.

- Il pannello info viene aggiornato ogni frame con `updateInfoText()`, anche se non ci sono cambiamenti. In futuro potrà essere ottimizzato.

- La griglia viene ridisegnata completamente ogni frame. Su mappe grandi potrebbe diventare un collo di bottiglia.

- I warning sono persistenti ma i triangoli vengono ridisegnati ogni frame, il che è accettabile.

## Interazioni con altri moduli

- `config.js`: fornisce parametri per colori, soglie, raggi.

- `world.js`: fornisce celle e densità per il rendering.

- `units.js`: fornisce spedizioni, Pop, campo.

- `debug.js`: gestisce i pannelli HTML e le interazioni con input.

- `time.js`: fornisce lo stato di velocità per l'indicatore.