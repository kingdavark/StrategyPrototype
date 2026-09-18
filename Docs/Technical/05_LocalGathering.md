# Local Gathering

## Scopo

Questo documento descrive la raccolta locale: come i lavoratori vengono assegnati alle celle entro il raggio locale del campo, come producono cibo direttamente al campo, come vengono calcolate le previsioni e come funzionano gli avvisi di soglia.

## Definizione di raccolta locale

La raccolta locale è l'attività di raccolta che avviene nelle celle entro il raggio locale del campo. I lavoratori locali:

- Non sono entità mobili sulla mappa.

- Producono cibo direttamente al campo, senza trasporto fisico.

- Sono assegnati manualmente a celle specifiche dal giocatore.

La raccolta locale si distingue dalle spedizioni, che sono gruppi mobili che si allontanano dal campo.

## Raggio locale

Il raggio locale è definito come "una giornata di viaggio" dai confini del campo.

Formula:

- `localGatherRadiusKm = walkingSpeedKmh * 24`

- Conversione in pixel: `localGatherRadiusPx = getExpeditionSpeed() * dayLengthSeconds`

Il raggio locale viene calcolato dinamicamente tramite la funzione `getLocalGatherRadiusPx()` in `config.js`. Viene visualizzato come cerchio giallo semitrasparente quando il campo è selezionato in modalità camp.

## Assegnazione dei lavoratori

I lavoratori locali vengono assegnati alle celle tramite il pannello `local-worker-panel` in `index.html`, con i bottoni `+` e `-`. La logica è in `debug.js`.

### Assegnazione (+)

Quando il giocatore clicca su `+` con una cella selezionata in modalità camp:

1. Si verifica che `camp.unassignedPopulation > 0`.

2. Si cerca il Pop `gatherer` in `camp.pops`. Se non esiste, viene creato e aggiunto.

3. Si incrementa `cell.assignedWorkers`.

4. Si decrementa `camp.unassignedPopulation`.

5. Si incrementa `camp.localGatherers`.

6. Si incrementa `pop.totalWorkers` e `pop.localWorkers`.

7. Si chiamano `updateInfoText()`, `updateCampText()`, `updateLocalWorkerPanel()` e `updateCellWorkerLabels()`.

Quando un lavoratore viene assegnato a una cella locale, diventa membro del Pop `gatherer`, anche se non fa parte di una spedizione.

### Rimozione (-)

Quando il giocatore clicca su `-` con una cella selezionata:

1. Si verifica che `cell.assignedWorkers > 0`.

2. Si cerca il Pop `gatherer`. Se esiste e ha `localWorkers > 0`:
   
   - Si decrementa `cell.assignedWorkers`.
   
   - Si incrementa `camp.unassignedPopulation`.
   
   - Si decrementa `camp.localGatherers`.
   
   - Si decrementano `pop.totalWorkers` e `pop.localWorkers`.

3. Si aggiornano i pannelli e le etichette.

## Raccolta effettiva

La raccolta effettiva avviene ogni frame in `updateLocalGathering(deltaSec)`, chiamata dalla funzione `update()` principale.

Procedura:

1. Si calcola il raggio locale con `getLocalGatherRadiusPx()`.

2. Si itera su tutte le celle della griglia.

3. Per ogni cella con `assignedWorkers > 0`:
   
   - Si calcola la distanza dal centro della cella al campo con `Phaser.Math.Distance.Between`.
   
   - Se la distanza è minore o uguale al raggio locale:
     
     - Se `density > 0`:
       
       text
       
       gathered = cell.assignedWorkers * GameConfig.baseGatherRate * density * deltaSec
       camp.foodStock += gathered
       camp.foodGatheredToday += gathered
       cell.foodGatheredToday += gathered
       reduction = gathered * GameConfig.densityReductionPerFood
       reduceCellDensity(cell, reduction)
     
     - Si controlla la soglia di warning (vedi sotto).

La riduzione della densità avviene **solo sulla cella esatta**, non sulle celle vicine. Questo garantisce che il cibo venga prelevato solo dove viene effettivamente raccolto.

## Previsioni

Le previsioni vengono calcolate in `updateInfoText()` quando una cella locale è selezionata (in modalità camp).

Dati disponibili:

- `density` (densità corrente della cella)

- `workers` (numero di lavoratori assegnati)

- `baseRate` (`GameConfig.baseGatherRate`)

- `reductionPerFood` (`GameConfig.densityReductionPerFood`)

Calcoli:

- **Cibo rimanente fino a soglia 0.25**:
  
  text
  
  foodTo25 = max(0, (density - GameConfig.cellWarningThreshold) / reductionPerFood)

- **Cibo rimanente teorico fino a 0**:
  
  text
  
  foodTo0 = density / reductionPerFood

- **Tasso di riduzione densità con i lavoratori attuali**:
  
  text
  
  k = workers * baseRate * reductionPerFood

- **Giorni al raggiungimento della soglia 0.25** (solo se `workers > 0` e `density > soglia`):
  
  text
  
  daysTo25 = (-ln(GameConfig.cellWarningThreshold / density) / k) / GameConfig.dayLengthSeconds

- **Giorni al raggiungimento della soglia 0** (usando 0.001 come "vuoto"):
  
  text
  
  daysTo0 = (-ln(0.001 / density) / k) / GameConfig.dayLengthSeconds

- **Aumento di cibo al giorno con un lavoratore in più**:
  
  text
  
  increasePerDay = baseRate * density * GameConfig.dayLengthSeconds

- **Giorni ridotti per raggiungere le soglie con un lavoratore in più**:
  
  text
  
  k2 = (workers + 1) * baseRate * reductionPerFood
  daysTo25_extra = (-ln(cellWarningThreshold / density) / k2) / dayLengthSeconds
  daysTo0_extra = (-ln(0.001 / density) / k2) / dayLengthSeconds
  reducedDays25 = max(0, daysTo25 - daysTo25_extra)
  reducedDays0 = max(0, daysTo0 - daysTo0_extra)

I calcoli usano il modello di decadimento esponenziale della densità, non un semplice calcolo lineare. Questo riflette il fatto che, man mano che la densità cala, anche il tasso di raccolta diminuisce.

## Riepilogo campo

Quando il campo è selezionato ma nessuna cella è selezionata (in modalità camp), viene mostrato un riepilogo.

Dati disponibili:

- **Cibo rimanente sfruttabile nell'area locale (fino a 0.25)**: si itera su tutte le celle entro il raggio locale (non solo quelle lavorate) e si somma:
  
  text
  
  foodTo25Total += max(0, (d - cellWarningThreshold) / reductionPerFood)
  
  dove `d` è la densità corrente della cella.

- **Cibo rimanente teorico (fino a 0)**:
  
  text
  
  foodTo0Total += d / reductionPerFood

- **Cibo raccolto nel giorno precedente**: `camp.gatheredDaily`

- **Cibo consumato nel giorno precedente**: `camp.consumedDaily`

- **Lavoratori per Pop**: `localWorkers`, `assignedWorkers`, `availableWorkers` del Pop gatherer.

## Dati giornalieri

Durante il giorno vengono accumulati:

- `camp.foodGatheredToday`: cibo raccolto localmente oggi.

- `cell.foodGatheredToday`: cibo raccolto da una cella specifica oggi.

A fine giornata (nel ciclo giorno di `update()`):

- `camp.gatheredDaily = camp.foodGatheredToday`

- `camp.consumedDaily = consumed` (consumo totale della giornata)

- `camp.foodGatheredToday = 0`

- Per ogni cella:
  
  - `cell.gatheredDaily = cell.foodGatheredToday`
  
  - `cell.foodGatheredToday = 0`

Nel riepilogo del campo e nelle info cella si mostrano i valori **daily** (del giorno precedente), non quelli in tempo reale.

## Avvisi di soglia

- Soglia unica: `GameConfig.cellWarningThreshold` (default 0.25).

- Quando una cella con lavoratori scende sotto la soglia:
  
  - Viene aggiunta alla lista globale `warningCells` (array di stringhe `"cx,cy"`).
  
  - Viene emesso un avviso in console la prima volta.
  
  - Viene impostato `cell.warningShown = true`.

- Quando una cella risale sopra soglia:
  
  - Viene rimossa da `warningCells`.
  
  - `cell.warningShown = false`.

Gli avvisi sono **persistenti**: rimangono visibili finché la cella non torna sopra soglia.

### Visualizzazione dei warning

La funzione `updateWarningIndicators()` disegna i triangoli rossi:

- In modalità camp (`gameState === 'camp'`): un triangolo sopra ogni cella in `warningCells`.

- In modalità mappa (`gameState === 'map'`): un triangolo sopra il campo se `warningCells.length > 0`.

Viene chiamata ogni frame in `update()`.

## Etichette lavoratori sulle celle

La funzione `updateCellWorkerLabels()` gestisce i testi sopra le celle che mostrano il numero di lavoratori assegnati.

- Viene chiamata quando cambia l'assegnazione (in `debug.js`) e all'avvio (in `create()`).

- Per ogni cella con `assignedWorkers > 0`, crea o aggiorna un `Phaser.Text` con il numero.

- Se `assignedWorkers` diventa 0, distrugge il testo.

- I testi sono memorizzati nell'oggetto globale `cellWorkerTexts` con chiave `"cx,cy"`.

Non viene chiamata ogni frame, per evitare overhead.

## Selezione della cella

In `main.js`, quando il gioco è in modalità camp e il giocatore clicca su una cella:

1. Si verifica che la cella sia dentro la griglia.

2. Si calcola la distanza dal centro della cella al campo.

3. Se la distanza è <= `getLocalGatherRadiusPx()`, la cella viene selezionata (`selectedLocalCell`).

4. Si chiama `updateInfoText()` per aggiornare il pannello.

5. Se la cella è fuori dal raggio, si esce dalla modalità camp e si deseleziona tutto.

Qualsiasi cella entro il raggio può essere selezionata, non solo quelle verdi.

## Visualizzazione della cella selezionata

La funzione `drawSelectedCell()` disegna un bordo giallo attorno alla cella selezionata. Viene chiamata ogni frame in `update()`, dopo `drawGrid()`, così il bordo rimane visibile sopra la griglia.

## Visualizzazione del raggio locale

Il raggio locale viene disegnato in `drawCamp()` quando `campSelected === true`. È un cerchio giallo semitrasparente centrato sul campo con raggio `getLocalGatherRadiusPx()`. Viene ridisegnato ogni frame con `campGraphics.clear()` all'inizio di `drawCamp()`.

## Interazioni con altri moduli

- `config.js`: fornisce il raggio locale, i tassi di raccolta, le soglie.

- `world.js`: fornisce le celle e `reduceCellDensity`.

- `units.js`: definisce il Pop gatherer e il campo.

- `main.js`: gestisce input, aggiornamento, rendering, previsioni e warning.

- `debug.js`: gestisce assegnazione/rimozione lavoratori tramite pannello HTML.

- `time.js`: fornisce il delta di gioco per la raccolta.