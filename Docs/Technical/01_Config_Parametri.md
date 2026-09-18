# Config e Parametri

## Scopo

Questo documento descrive `GameConfig`, l'oggetto centralizzato che contiene tutti i parametri di gioco modificabili, e le funzioni derivate che calcolano valori dinamici a partire da essi. Serve come riferimento per capire quali valori sono configurabili e come si riflettono sul comportamento del gioco.

## Convenzioni

- I valori configurabili non devono essere copiati in costanti locali all'avvio. Vanno letti direttamente da `GameConfig` ogni volta che servono.

- Ogni nuovo parametro di gioco va aggiunto a `GameConfig`, esposto nel pannello di debug e utilizzato dinamicamente nel codice.

- I parametri strutturali (es. dimensione delle celle, dimensioni del mondo) richiedono un riavvio della pagina per essere applicati.

## Parametri base

Sono i dati primari da cui si derivano tutti gli altri. L'utente li può modificare liberamente.

### Ciclo giorno

- `dayLengthSeconds` – durata reale in secondi di un giorno di gioco.

- `foodConsumptionPerPersonPerDay` – consumo base di cibo per persona al giorno.

### Raccolta

- `baseGatherRate` – cibo raccolto per secondo per lavoratore a densità 1.0.

- `densityReductionPerFood` – densità rimossa per ogni unità di cibo raccolta.

- `gatherImpactRadius` – moltiplicatore per CELL_SIZE (attualmente non usato per la raccolta puntuale, riservato a effetti futuri).

### Movimento

- `cellSize` – dimensione in pixel di una cella.

- `cellSizeInKm` – quanti chilometri reali rappresenta una cella (default 10).

- `walkingSpeedKmh` – velocità di spostamento a piedi espressa in km/h.

### Moltiplicatori di consumo delle spedizioni

- `travelConsumptionMultiplier` – moltiplicatore del consumo durante il viaggio rispetto al consumo base.

- `gatheringConsumptionMultiplier` – moltiplicatore del consumo durante la raccolta.

### Provviste e riposo

- `safetyMultiplier` – margine di sicurezza per il calcolo delle provviste.

- `restMultiplier` – percentuale di riposo rispetto alla durata della spedizione precedente.

### Capacità

- `maxCapacityPerWorker` – slot di inventario per lavoratore (cibo + provviste).

### Area e cambio cella

- `areaRadius` – raggio predefinito dell'area di raccolta in pixel.

- `cellAbandonThreshold` – soglia di densità sotto la quale la spedizione cerca un'altra cella.

- `cellSwitchScoreThreshold` – moltiplicatore del punteggio corrente necessario per cambiare cella.

- `cellScoreDensityWeight` – peso della densità nel punteggio di una cella.

- `cellScoreDistanceWeight` – peso della distanza nel punteggio di una cella.

- `cellEvaluationInterval` – intervallo in secondi tra le valutazioni di cambio cella.

### Valori di partenza

- `startingFoodStock` – cibo iniziale nel campo.

- `startingUnassignedPopulation` – popolazione non assegnata iniziale.

- `startingExpeditionWorkers` – numero di lavoratori prelevati per una nuova spedizione.

- `campX`, `campY` – posizione iniziale del campo sulla mappa.

### Mondo

- `worldWidth` – larghezza del mondo in pixel.

- `worldHeight` – altezza del mondo in pixel.

### Gestione informazioni

- `cellWarningThreshold` – soglia sotto la quale una cella viene considerata in esaurimento (default 0.25).

## Parametri derivati

I seguenti valori non devono mai essere memorizzati come costanti, ma calcolati ogni volta che servono a partire dai parametri base.

- `getSecondsPerGameHour()` – restituisce `dayLengthSeconds / 24`, cioè quanti secondi reali corrispondono a un'ora di gioco.

- `getBaseConsumptionPerSec()` – restituisce `foodConsumptionPerPersonPerDay / dayLengthSeconds`, cioè il consumo base di cibo per persona per secondo reale.

- `getPixelsPerKm()` – restituisce `cellSize / cellSizeInKm`, cioè quanti pixel rappresentano un chilometro reale.

- `getExpeditionSpeed()` – restituisce la velocità di spedizione in pixel per secondo reale. Calcolata come `(walkingSpeedKmh * pixelsPerKm) / (secondsPerGameHour * 3600)`.

- `getTravelConsumptionPerSec()` – restituisce `getBaseConsumptionPerSec() * travelConsumptionMultiplier`, cioè il consumo di provviste per lavoratore per secondo reale durante il viaggio.

- `getGatheringConsumptionPerSec()` – restituisce `getBaseConsumptionPerSec() * gatheringConsumptionMultiplier`, cioè il consumo durante la raccolta.

- `getProvisionsNeeded(workerCount, distance)` – calcola le provviste necessarie per una spedizione. Formula: `workerCount * getTravelConsumptionPerSec() * (distance / getExpeditionSpeed() * 2) * safetyMultiplier`. Il `* 2` considera andata e ritorno.

- `getRestDuration(tripDurationSec)` – restituisce `tripDurationSec * restMultiplier`, cioè il tempo di riposo dopo una spedizione.

- `getLocalGatherRadiusPx()` – restituisce il raggio locale in pixel, calcolato come `getExpeditionSpeed() * dayLengthSeconds`. Rappresenta una giornata di viaggio dal campo.

## Come modificare i parametri

### Da console

Basta scrivere `GameConfig.nomeParametro = valore;` nella console del browser. Il gioco leggerà il nuovo valore al prossimo uso (per i parametri letti dinamicamente).

### Dal pannello di debug

Il pannello è accessibile dal pulsante **Debug** in alto a destra. Mostra un input per ogni parametro presente in `GameConfig`. Modificando un campo e premendo Invio o cliccando fuori, il valore viene aggiornato. I parametri strutturali (es. `cellSize`, `worldWidth`, `worldHeight`) richiedono il ricaricamento della pagina tramite il pulsante **Apply & Reload**.

### Reset

Il pulsante **Reset to Defaults** ripristina i valori originali di tutti i parametri.

## Interazioni con altri moduli

- `world.js` legge `cellSize` e le dimensioni del mondo per costruire la griglia.

- `units.js` legge i parametri di movimento, provviste, capacità e riposo.

- `main.js` usa le funzioni derivate per raccolta locale, consumo e disegno del raggio locale.

- `debug.js` collega gli input HTML a `GameConfig`.

- `time.js` non legge direttamente da GameConfig ma usa i secondi reali moltiplicati per la velocità.

## Note

- I parametri derivati non vanno mai salvati in variabili globali: vanno richiamati ogni volta che serve il valore aggiornato.

- Il pannello debug deve restare sincronizzato con `GameConfig`: se si aggiunge un nuovo parametro, va aggiunto anche un campo HTML con id `cfg-nomeParametro`.