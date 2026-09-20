# js/units.js

## Scopo

Definisce le entità principali del gioco: il campo (`settlement`), i Pop (gruppi di lavoratori) e le spedizioni (`Expedition`). Contiene anche l'alias globale `expeditions` che punta all'array delle spedizioni attive del campo.

## Struttura dati

### settlement

L'accampamento è il punto di riferimento della tribù. È un oggetto globale definito in questo file.

Proprietà:

- `x`, `y` – posizione in pixel sulla mappa. Inizializzati da `GameConfig.settlementX` e `GameConfig.settlementY`.
- `foodStock` – scorte globali di cibo. Inizializzato da `GameConfig.startingFoodStock`.
- `unassignedPopulation` – numero di individui non ancora assegnati a nessun Pop. Inizializzato da `GameConfig.startingUnassignedPopulation`.
- `pops` – array di oggetti Pop presenti al campo. All'inizio è vuoto.
- `expeditions` – array di spedizioni attive. Alias globale: `expeditions`.
- `localGatherers` – numero totale di lavoratori assegnati a celle locali (somma di `assignedWorkers` di tutte le celle).
- `foodGatheredToday` – cibo raccolto localmente oggi (accumulato durante il giorno).
- `foodConsumedToday` – cibo consumato dalla popolazione nell'ultimo giorno completato (valore in tempo reale, ma mostrato solo a fine giornata).
- `gatheredDaily` – cibo raccolto localmente nel giorno precedente (aggiornato a fine giornata).
- `consumedDaily` – cibo consumato dalla popolazione nel giorno precedente (aggiornato a fine giornata).
- `cell` – cella della griglia occupata dal settlement (`{ cx, cy }`). Inizialmente `null`, valorizzata in `create()` (in `main.js`). È solo informativa: il calcolo di `urbanizedFraction` usa `settlement.x`/`settlement.y` come centro, non `settlement.cell`.

### Pop

Un Pop rappresenta un insieme di individui con le stesse caratteristiche (occupazione, cultura, religione, status, etnia). Nel prototipo attuale esiste solo il Pop `gatherer`.

Proprietà:

- `type` – tipo di Pop (es. `gatherer`).
- `totalWorkers` – numero totale di individui appartenenti a questo Pop.
- `availableWorkers` – lavoratori attualmente al campo, pronti per essere assegnati a spedizioni o compiti locali.
- `assignedWorkers` – lavoratori attualmente in spedizione.
- `localWorkers` – lavoratori assegnati a celle locali di raccolta attorno al campo.

Metodi:

- `addWorkers(count)` – incrementa `totalWorkers` e `availableWorkers` di `count`. Usato quando si converte popolazione non assegnata in gatherer.
- `takeWorkers(count)` – preleva fino a `count` lavoratori da `availableWorkers`, li sposta in `assignedWorkers` e restituisce il numero effettivamente prelevato. Se `availableWorkers` è minore di `count`, preleva solo quelli disponibili.
- `returnWorkers(count)` – sposta `count` lavoratori da `assignedWorkers` a `availableWorkers`. Usato al rientro di una spedizione.

### Expedition

Una spedizione è un'entità mobile sulla mappa, creata prelevando `n` lavoratori da un Pop (o dalla popolazione non assegnata, creando il Pop al volo).

Proprietà:

- `id` – identificativo univoco (formato `exp_<timestamp>`).
- `popType` – tipo di Pop da cui proviene (es. `gatherer`).
- `workerCount` – numero di individui in questa spedizione.
- `x`, `y` – posizione corrente in pixel.
- `targetX`, `targetY` – destinazione corrente.
- `speed` – velocità in pixel al secondo, calcolata dinamicamente con `getExpeditionSpeed()`.
- `state` – stato attuale (vedi sotto).
- `maxCapacity` – capacità massima di carico, calcolata come `workerCount * GameConfig.maxCapacityPerWorker`.
- `inventory` – oggetto con `provisions` (provviste rimanenti) e `food` (cibo raccolto).
- `areaCenter` – `{ x, y }` centro dell'area di raccolta assegnata.
- `areaRadius` – raggio dell'area di raccolta in pixel. Inizializzato da `GameConfig.areaRadius`.
- `settlementRef` – riferimento all'oggetto `settlement`.
- `cooldownRemaining` – secondi di riposo rimanenti.
- `lastCellEvaluation` – tempo trascorso dall'ultima valutazione di cambio cella.
- `isForced` – se `true`, la spedizione ignora l'esaurimento delle provviste per il ritorno.
- `useAssignedArea` – se `true`, la spedizione raccoglie solo all'interno dell'area assegnata; se `false`, vaga liberamente.
- `toBeDisbanded` – se `true`, la spedizione verrà sciolta all'arrivo al campo.
- `tripStartGameTime` – tempo di gioco all'inizio del viaggio, usato per calcolare la durata e quindi il riposo.

Stati:

- `travellingToArea` – in viaggio verso l'area di raccolta.
- `movingToCell` – in movimento verso una cella specifica all'interno dell'area.
- `gathering` – sta raccogliendo dalla cella corrente.
- `returningToSettlement` – sta tornando al campo.
- `resting` – a riposo al campo prima di ripartire.

## Funzioni e metodi principali

### getSettlementPopulation()

Restituisce la popolazione totale del settlement: `settlement.unassignedPopulation + somma(pop.totalWorkers)` per tutti i Pop. Include lavoratori locali e in spedizione.

### getEffectiveLocalGatherRadiusPx()

Restituisce il raggio locale effettivo in pixel: `getSettlementRadiusPx(getSettlementPopulation()) + getLocalGatherRadiusPx()`. Il raggio parte dal bordo del settlement (1.5 ore di cammino).

### Pop.addWorkers(count)

Incrementa `totalWorkers` e `availableWorkers` di `count`. Usato quando si converte popolazione non assegnata in gatherer. Non restituisce nulla.

### Pop.takeWorkers(count)

Preleva fino a `count` lavoratori da `availableWorkers`, li sposta in `assignedWorkers` e restituisce il numero effettivamente prelevato. Se `availableWorkers` è minore di `count`, preleva solo quelli disponibili. Restituisce un intero.

### Pop.returnWorkers(count)

Sposta `count` lavoratori da `assignedWorkers` a `availableWorkers`. Usato al rientro di una spedizione. Non restituisce nulla.

### Expedition.cellScore(cx, cy)

Calcola il punteggio di una cella in base a densità e distanza dalla posizione corrente della spedizione. Formula: `density * cellScoreDensityWeight - distance * cellScoreDistanceWeight`. Restituisce `-Infinity` se la densità è 0 o se la cella è totalmente urbanizzata (`urbanizedFraction >= 1`). Usato da `findBetterCell` e `findBestCellInArea`.

### Expedition.findBetterCell()

Cerca la cella con il punteggio migliore attorno alla posizione corrente della spedizione. Esclude la cella del campo. Usata in modalità automatica (`useAssignedArea = false`). Restituisce `{ cx, cy, score }`. Se nessuna cella valida, `cx = -1`.

### Expedition.findBestCellInArea(fromX, fromY)

Cerca la cella con il punteggio migliore all'interno del cerchio definito da `areaCenter` e `areaRadius`. Testa la distanza dal centro dell'area con `Phaser.Math.Distance.Between`. Salta le celle totalmente urbanizzate (`urbanizedFraction >= 1`). Usata in modalità area assegnata (`useAssignedArea = true`). Restituisce `{ cx, cy, score }`.

### Expedition.update(delta)

Gestisce il comportamento della spedizione in base allo stato corrente. Consuma provviste, si muove, raccoglie, rientra, riposa e riparte. È il cuore della logica delle spedizioni.

Durante la raccolta: se la cella corrente è totalmente urbanizzata (`urbanizedFraction >= 1`) la spedizione non raccoglie e cerca un'altra cella (o rientra); altrimenti la riduzione della densità è scalata per l'area libera: `densityReduction = gatherRate * densityReductionPerFood / (1 - urbanizedFraction)`.

Il comportamento dettagliato per ciascuno stato è descritto nel documento di Game Design `Docs/GameDesign/04_Spedizioni.md`.

## Dipendenze in ingresso

- `index.html` – carica lo script dopo `world.js`.
- `js/main.js` – crea le spedizioni (click destro su mappa), aggiorna Pop (tramite `debug.js`), disegna le spedizioni. Chiama `exp.update(delta)` ogni frame.
- `js/debug.js` – modifica Pop e settlement tramite l'assegnazione e la rimozione di lavoratori locali.

## Dipendenze in uscita

- `js/config.js` – per `GameConfig` (tutti i parametri usati dalle spedizioni), `getExpeditionSpeed()`, `getProvisionsNeeded()`, `getRestDuration()`, `getTravelConsumptionPerSec()`, `getGatheringConsumptionPerSec()`, `getSettlementRadiusPx()`, `getLocalGatherRadiusPx()` (per `getEffectiveLocalGatherRadiusPx()`).
- `js/world.js` – per `getCell`, `worldToCell`, `cellToWorld`, `reduceCellDensity`, `HEX_VERTICAL_SPACING_PX`, `GRID_COLS`, `GRID_ROWS`.
- `Phaser.Math.Distance.Between` – per il calcolo delle distanze.

## Parametri GameConfig usati

- `settlementX`, `settlementY` – posizione iniziale del campo.
- `startingFoodStock` – cibo iniziale.
- `startingUnassignedPopulation` – popolazione non assegnata iniziale.
- `maxCapacityPerWorker` – capacità per lavoratore.
- `areaRadius` – raggio predefinito dell'area di raccolta.
- `cellAbandonThreshold` – soglia di densità per abbandonare una cella.
- `cellSwitchScoreThreshold` – soglia di cambio cella.
- `cellScoreDensityWeight`, `cellScoreDistanceWeight` – pesi del punteggio cella.
- `cellEvaluationInterval` – intervallo di valutazione cambio cella.
- `baseGatherRate`, `densityReductionPerFood` – per la raccolta.

Indirettamente, tramite le funzioni di `config.js`: `dayLengthSeconds`, `walkingSpeedKmh`, `pixelsPerKm`, `hexCenterDistanceKm`, `travelConsumptionMultiplier`, `gatheringConsumptionMultiplier`, `safetyMultiplier`, `restMultiplier`, `settlementGrowthPerPerson`, `settlementMinAreaKm2`, `hoursWalkingRadius` (via `getSettlementRadiusPx` e `getLocalGatherRadiusPx`).

## Stato globale modificato

- `settlement` (oggetto globale) e tutte le sue proprietà.
- `expeditions` (alias di `settlement.expeditions`).
- Le celle della griglia (tramite `reduceCellDensity`).

## Note per modifiche

- Il Pop `gatherer` viene creato la prima volta che serve (assegnazione locale o creazione spedizione) e poi riutilizzato. Non ci sono più Pop con lo stesso `type`.
- Quando un lavoratore viene assegnato a una cella locale, incrementa `localWorkers` e `totalWorkers` del Pop (se non era già nel Pop), e decrementa `unassignedPopulation`.
- Solo un'azione esplicita del giocatore (non ancora implementata) potrebbe riconvertire un gatherer in popolazione non assegnata.
- La riduzione della densità durante la raccolta avviene **solo** sulla cella esatta tramite `reduceCellDensity`.
- Se si modifica la firma di un metodo pubblico di `Pop` o `Expedition`, aggiornare i documenti Technical degli script che li usano (`04_Main.md`, `05_Debug.md`).
- Se si aggiunge una nuova proprietà a `Expedition` o `Pop`, aggiornare le sezioni "Stato globale modificato" e "Parametri GameConfig usati" dei documenti Technical collegati.
- I bug noti delle spedizioni sono descritti in `Docs/GameDesign/04_Spedizioni.md`.