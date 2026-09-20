# js/main.js

## Scopo

È il modulo principale del prototipo. Inizializza la scena Phaser, gestisce l'input del giocatore, disegna tutti gli elementi sulla mappa (griglia, campo, spedizioni, warning, etichette), implementa la raccolta locale, le previsioni sulle celle e il ciclo giorno. È lo script più grande e più interconnesso del progetto.

## Variabili globali e stato

Variabili di scena (create in `create()`):

- `gameScene` – riferimento alla scena Phaser.
- `gridGraphics` – graphics per griglia e cella selezionata.
- `popGraphics` – graphics per spedizioni.
- `settlementGraphics` – graphics per il campo e il raggio locale.
- `warningGraphics` – graphics per i triangoli di warning (depth 300).
- `infoText` – pannello info in alto a destra (`Phaser.Text`).
- `settlementText` – riepilogo campo in basso a sinistra.
- `speedText` – indicatore di velocità in alto a sinistra.
- `settlementLabel` – etichetta testuale "SETTLEMENT", creata una sola volta (evita accumulo di oggetti ogni frame).

Variabili di stato globali:

- `gameState` – `'map'` o `'settlement'`. Determina il significato dei click.
- `settlementSelected` – `true` se il campo è selezionato (sempre `true` in `gameState === 'settlement'`).
- `selectedExpedition` – spedizione selezionata, o `null`.
- `selectedLocalCell` – cella locale selezionata (in modalità settlement), o `null`.
- `cellWorkerTexts` – mappa `"cx,cy"` → `Phaser.Text` con il numero di lavoratori sopra le celle.
- `warningCells` – array di stringhe `"cx,cy"` con le celle sotto soglia.
- `dayAccumulator` – accumula delta per il ciclo giorno.
- `gameDay` – contatore dei giorni di gioco.
- `gameTimeSec` – tempo di gioco effettivo (da `config.js`).
- `lastSettlementPopulation` – popolazione del settlement all'ultimo ricalcolo delle frazioni urbanizzate. Usato per ricalcolare `urbanizedFraction` solo quando la popolazione cambia.

## Funzioni principali

### preload()

Carica il plugin rexBoard (griglia esagonale) via `this.load.scenePlugin(...)` da CDN.

### create()

Inizializza la scena:

1. Chiama `createGrid(this)` (che inizializza la board esagonale rexBoard). Ancora il settlement alla cella che lo contiene: calcola la cella con `worldToCell(settlement.x, settlement.y)`, ne ricava il centro con `cellToWorld`, assegna `settlement.x/y` al centro e imposta `settlement.cell = { cx, cy }`. Poi chiama `initializeForageDensity()`, inizializza `lastSettlementPopulation` e calcola una prima volta `updateUrbanizedFractions(population)`.
2. Crea i graphics objects: `gridGraphics`, `settlementGraphics`, `popGraphics`, `warningGraphics`.
3. Disegna la griglia esagonale iniziale chiamando `drawGrid()`.
4. Aggiunge il testo di debug in alto a sinistra.
5. Chiama `enableDebugClick(this)` per attivare i listener di input.
6. Salva `gameScene = this`.
7. Crea i testi UI: `infoText`, `settlementText`, `speedText`.
8. Chiama `drawGrid()`, `drawPops()` e `drawSettlement()`.
9. Crea `warningGraphics` con depth 300.

### update(time, delta)

Chiamata ogni frame da Phaser. È il game loop.

1. Converte `delta` in secondi reali.
2. Chiama `TimeManager.getGameDelta(realDeltaSec)` per ottenere `deltaSec`.
3. Accumula `gameTimeSec += deltaSec`.
4. Ricalcola le frazioni urbanizzate se la popolazione è cambiata: confronta `getSettlementPopulation()` con `lastSettlementPopulation` e, se diversa, chiama `updateUrbanizedFractions(population)`.
5. Aggiorna tutte le spedizioni: `for (const exp of expeditions) exp.update(deltaSec)`.
6. Chiama `updateLocalGathering(deltaSec)`.
7. Gestisce il ciclo giorno: quando `dayAccumulator >= dayLengthSeconds`, incrementa `gameDay`, calcola il consumo, aggiorna `gatheredDaily` e `consumedDaily`, azzera i contatori giornalieri (settlement e celle).
8. Aggiorna i pannelli: `updateInfoText()`, `updateSpeedText()`, `updateSettlementText()`, `updateLocalWorkerPanel()`.
9. Ridisegna: `drawGrid()`, `drawSelectedCell()`, `drawPops()`, `drawSettlement()`, `updateWarningIndicators()`.

### enableDebugClick(scene)

Attiva i listener di input sulla scena. Gestisce click sinistro (selezione) e click destro (creazione/modifica spedizioni, futuro), oltre alle scorciatoie da tastiera.

**Click sinistro** (in ordine di priorità):

1. Se Shift premuto: ispezione cella (tooltip temporaneo con densità e coordinate).
2. Se clicca su una spedizione: la seleziona, entra in `gameState = 'map'`.
3. Se clicca sul campo (entro un raggio di tolleranza pari al raggio visivo del settlement `max(getSettlementRadiusPx(population), settlementMinVisualRadiusPx)`): toggle tra `gameState = 'map'` e `gameState = 'settlement'`.
4. Se in `gameState === 'settlement'` e clicca su una cella entro il raggio locale: la seleziona. Se clicca sulla cella già selezionata, la deseleziona e mostra di nuovo l'info del settlement.
5. Se in `gameState === 'settlement'` e clicca fuori dal raggio: esce dalla modalità settlement.
6. Altrimenti: deseleziona tutto.

**Click destro**:

1. Se c'è una spedizione selezionata: aggiorna la sua area di raccolta e la fa ripartire.
2. Altrimenti (con campo o spedizione selezionata): crea una nuova spedizione manuale verso il punto cliccato.

**Scorciatoie da tastiera**:

- `R` – richiama la spedizione selezionata.
- `F` – toggle modalità forzata.
- `A` – toggle modalità automatica.
- `C` – cancella spedizione selezionata.
- `Spazio` – pausa/play.
- `0-4` – imposta velocità.
- `+` / `-` – aumenta/diminuisce velocità.

Tutti i comandi sono ignorati se un input HTML ha il focus (`isInputFocused()`).

### isInputFocused()

Restituisce `true` se il focus è su un campo di input HTML (`INPUT`, `TEXTAREA`, `contentEditable`). Usata per evitare che le scorciatoie del gioco si attivino mentre si scrive nel pannello debug.

### drawGrid()

Ridisegna tutti gli esagoni della griglia in base a `forageDensity`. Viene chiamata ogni frame.

Per ogni cella, sceglie un colore con scala a 7 intervalli:

- `>= 0.90` – verde scuro (`0x1a4d0a`)
- `>= 0.75` – verde medio (`0x2d6b14`)
- `>= 0.50` – verde chiaro (`0x4a8c1f`)
- `>= 0.25` – giallo (`0xc4a80b`)
- `>= 0.05` – arancione (`0xc46e0b`)
- `> 0.00` – rosso (`0x8b1a0a`)
- `0.00` – nessun colore (sfondo)

Ogni esagono è disegnato con `hexBoard.getGridPoints(cx, cy)` (6 vertici) e `fillPoints(points, true)`. Applica culling: disegna solo le celle il cui centro è entro la finestra visibile (con un margine pari alle dimensioni dell'esagono). La mappa attuale è limitata a `1280x720` pixel, con esagoni di raggio ≈ 11.5 px.

### drawSelectedCell()

Disegna un bordo giallo esagonale attorno alla cella selezionata (`selectedLocalCell`) usando `hexBoard.getGridPoints` e `strokePoints(points, true)`. Viene chiamata ogni frame dopo `drawGrid()`. Se `selectedLocalCell` è `null`, non fa nulla.

### drawPops()

Disegna tutte le spedizioni come cerchi colorati in base allo stato:

- `gathering` – verde (`0x00ff00`)
- `returningToSettlement` – arancione (`0xff8800`)
- `resting` – grigio (`0x888888`)
- altri – bianco (`0xffffff`)

Se `isForced`, disegna un bordo rosso. Se `!useAssignedArea`, un bordo blu semitrasparente. Se selezionata, un bordo giallo e il percorso tratteggiato (dal campo al target). Per la spedizione selezionata, l'area di raccolta è mostrata come **bordo esterno esagonale** delle celle incluse (via `computeHexAreaBorder`): attorno alla posizione corrente in auto mode, attorno ad `areaCenter` in manual mode. Viene chiamata ogni frame.

### drawDashedLine(graphics, x1, y1, x2, y2, dashLength, gapLength)

Utility per disegnare una linea tratteggiata. Usata per il percorso delle spedizioni selezionate.

### edgeKey(a, b)

Restituisce una chiave canonica (ordine-indipendente) per un lato di esagono, arrotondando le coordinate per evitare mismatch di floating point tra celle adiacenti che condividono lo stesso lato.

### computeHexAreaBorder(centerX, centerY, radius)

Calcola il bordo esterno (solo i lati rivolti verso l'esterno) dell'insieme di celle il cui centro cade entro l'area circolare `(centerX, centerY, radius)`. Costruisce l'insieme delle celle incluse, conta quante celle rivendicano ogni lato (via `hexBoard.getGridPoints`) e restituisce solo i lati con conteggio 1 (esterni). Se nessuna cella è inclusa, restituisce `[]` (culling). Con una sola cella restituisce l'esagono completo. Restituisce un array di segmenti `{ x1, y1, x2, y2 }`.

### drawSettlement()

Disegna il campo come cerchio marrone pieno (raggio `max(getSettlementRadiusPx(population), settlementMinVisualRadiusPx)`) con bordo e, se `settlementSelected`, un anello di selezione giallo e il raggio locale effettivo come **bordo esterno esagonale** delle celle incluse (via `computeHexAreaBorder`). Il cerchio, la label, l'anello di selezione e il bordo sono centrati su `settlement.x`/`settlement.y`. L'etichetta "SETTLEMENT" è creata una sola volta (`settlementLabel`). Viene chiamata ogni frame.

### updateWarningIndicators()

Disegna i triangoli rossi persistenti per le celle sotto soglia. Viene chiamata ogni frame dopo `drawPops()` e `drawSettlement()`.

- In `gameState === 'settlement'`: triangolo sopra ogni cella in `warningCells`.
- In `gameState === 'map'`: triangolo sopra il campo (posizionato su `settlement.x`/`settlement.y`) se `warningCells.length > 0`.

### updateCellWorkerLabels()

Gestisce i testi sopra le celle con lavoratori assegnati. Viene chiamata solo quando cambia l'assegnazione (in `debug.js` e all'avvio), non ogni frame.

- Per ogni cella con `assignedWorkers > 0`, crea o aggiorna un `Phaser.Text` con il numero.
- Se `assignedWorkers` diventa 0, distrugge il testo.
- I testi sono memorizzati in `cellWorkerTexts` con chiave `"cx,cy"`.

### updateLocalGathering(deltaSec)

Esegue la raccolta locale ogni frame.

1. Calcola il raggio locale effettivo con `getEffectiveLocalGatherRadiusPx()` (1.5h di cammino dal bordo del settlement).
2. Itera su tutte le celle della griglia.
3. Per ogni cella con `assignedWorkers > 0` e distanza dal campo <= raggio effettivo:
   - Se `urbanizedFraction >= 1`: non raccoglie e logga una volta in console che i lavoratori andrebbero liberati (la logica completa di liberazione è rimandata).
   - Se `density > 0`, raccoglie: `gathered = assignedWorkers * baseGatherRate * density * deltaSec`. Aggiorna `settlement.foodStock`, `settlement.foodGatheredToday`, `cell.foodGatheredToday`, chiama `reduceCellDensity` con `reduction = gathered * densityReductionPerFood / (1 - urbanizedFraction)`.
   - Controlla la soglia `cellWarningThreshold`: se scende sotto e `warningShown` è `false`, aggiunge la cella a `warningCells` e mostra un avviso in console. Se risale sopra, rimuove la cella da `warningCells`.

La riduzione avviene **solo sulla cella esatta**, non sulle celle vicine.

### updateSettlementText()

Aggiorna il testo in basso a sinistra con cibo, popolazione totale, non assegnati e giorno corrente.

### updateSpeedText()

Aggiorna il testo in alto a sinistra con la velocità corrente, letta da `TimeManager.getSpeedLabel()`.

### updateInfoText()

Aggiorna il pannello info in alto a destra. Contenuto in base alla selezione:

- **Spedizione selezionata** – id, workerCount, stato, provviste, cibo, capacità, flag `[FORCED]` e `[AUTO]`.
- **Cella locale selezionata (in modalità settlement)** – coordinate, densità, lavoratori, frazione urbanizzata (`Urbanized: XX.X%`), cibo raccolto daily, cibo totale rimanente (scalato per l'area libera `1 - urbanizedFraction`), cibo rimanente alla soglia 25%, giorni alla soglia 25%, incremento con un lavoratore in più, giorni ridotti alla soglia 25%.
- **Campo selezionato (in modalità settlement)** – cibo, non assegnati, `gatheredDaily`, `consumedDaily`, cibo rimanente nell'area locale (to 25% e to 0%), statistiche dei gatherer (locali, spedizioni, disponibili).
- **Altrimenti** – stringa vuota.

Alla fine chiama `updateLocalWorkerPanel()` per aggiornare la visibilità del pannello lavoratori locali.

### updateLocalWorkerPanel()

Mostra o nasconde il pannello `local-worker-panel` in base a `selectedLocalCell` e `gameState === 'settlement'`. Aggiorna il testo con coordinate e numero di lavoratori. È definita in `debug.js`, ma viene chiamata anche da `main.js`.

## Dipendenze in ingresso

- `index.html` – carica lo script dopo `time.js`.
- Phaser – chiama `preload`, `create`, `update`.

## Dipendenze in uscita

- `js/config.js` – per `GameConfig` (tutti i parametri usati dal rendering e dalla raccolta), `getLocalGatherRadiusPx()`, `getSettlementRadiusPx()`, `getBaseConsumptionPerSec()` (indirettamente via `updateLocalGathering`), `getSecondsPerGameHour()` (indirettamente).
- `js/world.js` – per `createGrid`, `initializeForageDensity`, `getCell`, `worldToCell`, `cellToWorld`, `reduceCellDensity`, `updateUrbanizedFractions`, `hexBoard`, `HEX_WIDTH_PX`, `HEX_HEIGHT_PX`, `GRID_COLS`, `GRID_ROWS`.
- `js/units.js` – per `settlement`, `expeditions`, `Pop`, `Expedition`, `getSettlementPopulation`, `getEffectiveLocalGatherRadiusPx`.
- `js/time.js` – per `TimeManager` (delta, velocità, pausa).
- `js/debug.js` – per `updateLocalWorkerPanel`.
- `Phaser.Math.Distance.Between` – per calcolo distanze.

## Parametri GameConfig usati

- `baseGatherRate`, `densityReductionPerFood` – per la raccolta locale.
- `cellWarningThreshold` – per il warning.
- `dayLengthSeconds` – per il ciclo giorno.
- `foodConsumptionPerPersonPerDay` – per il consumo.
- `settlementX`, `settlementY` – per la posizione del campo.
- `areaRadius` – per il raggio predefinito dell'area spedizione.
- `settlementMinVisualRadiusPx` – per il raggio visivo minimo del cerchio del settlement.
- `cellEvaluationInterval` – indirettamente via `units.js`.
- Indirettamente via `getSettlementRadiusPx`/`getLocalGatherRadiusPx`: `settlementGrowthPerPerson`, `settlementMinAreaKm2`, `hoursWalkingRadius`.
- Altri parametri indirettamente tramite funzioni di `config.js`.

## Stato globale modificato

- `gameState`, `settlementSelected`, `selectedExpedition`, `selectedLocalCell`, `dayAccumulator`, `gameDay`.
- `warningCells`, `cellWorkerTexts`.
- `settlement` (tramite `create`, `updateLocalGathering` e `update`).
- `expeditions` (creazione e rimozione).
- Le celle della griglia (tramite `reduceCellDensity`).

## Note per modifiche

- La logica di rendering è mista a quella di gioco in questo file. In futuro potrà essere separata (`ui.js`).
- Il pannello info viene aggiornato ogni frame: possibile ottimizzazione futura.
- La griglia viene ridisegnata completamente ogni frame: collo di bottiglia su mappe grandi.
- I warning sono persistenti e ridisegnati ogni frame.
- Se si modifica la logica di input, verificare che non ci siano conflitti con i game state (`map` vs `settlement`).
- Se si modifica una funzione pubblica usata da altri script (es. `updateInfoText`, `updateCellWorkerLabels`, `updateLocalWorkerPanel`), aggiornare i documenti Technical collegati (`05_Debug.md`).
- Se si aggiunge una variabile globale, dichiararla in cima al file e documentarla in "Variabili globali e stato".
- Se si modifica la logica di raccolta locale, verificare che `updateLocalGathering` continui a ridurre solo la cella esatta (non le vicine).