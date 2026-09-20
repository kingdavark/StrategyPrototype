# js/config.js

## Scopo

Definisce `GameConfig`, l'oggetto centralizzato che contiene tutti i parametri di gioco modificabili, e le funzioni derivate che calcolano valori dinamici a partire da essi. È il primo script caricato (dopo Phaser) e non dipende da nessun altro modulo di gioco.

## Funzioni principali

Tutte le funzioni derivano il loro valore da `GameConfig`, così che modificando un parametro base si aggiornino automaticamente tutti i calcoli dipendenti.

### getSecondsPerGameHour()

Restituisce `dayLengthSeconds / 24`, cioè quanti secondi reali corrispondono a un'ora di gioco. Usata internamente da `getExpeditionSpeed()`.

### getBaseConsumptionPerSec()

Restituisce `foodConsumptionPerPersonPerDay / dayLengthSeconds`, cioè il consumo base di cibo per persona per secondo reale. È il punto di partenza per calcolare i consumi delle spedizioni.

### getPixelsPerKm()

Restituisce `GameConfig.pixelsPerKm`, cioè quanti pixel rappresentano un chilometro reale. Serve per convertire distanze in pixel in distanze reali (km) e viceversa.

### getHexRadiusPx()

Restituisce `(hexCenterDistanceKm / √3) * pixelsPerKm`, cioè il raggio dell'esagono (distanza vertice-centro) in pixel. È la base geometrica usata da `world.js` per costruire la griglia esagonale.

### getExpeditionSpeed()

Restituisce la velocità di spedizione in pixel per secondo reale. Formula: `(walkingSpeedKmh * pixelsPerKm) / (secondsPerGameHour * 3600)`. Viene ricalcolata ogni volta perché dipende da parametri modificabili a runtime.

### getTravelConsumptionPerSec()

Restituisce `getBaseConsumptionPerSec() * travelConsumptionMultiplier`, cioè il consumo di provviste per lavoratore per secondo reale durante il viaggio.

### getGatheringConsumptionPerSec()

Restituisce `getBaseConsumptionPerSec() * gatheringConsumptionMultiplier`, cioè il consumo di provviste per lavoratore per secondo reale durante la raccolta. È maggiore del consumo in viaggio perché lo sforzo fisico è superiore.

### getProvisionsNeeded(workerCount, distance)

Restituisce le provviste necessarie per una spedizione con `workerCount` lavoratori e una distanza `distance` (in pixel, andata). Formula: `workerCount * getTravelConsumptionPerSec() * (distance / getExpeditionSpeed() * 2) * safetyMultiplier`. Il `* 2` considera andata e ritorno. Il `safetyMultiplier` aggiunge un margine per raccolta e imprevisti.

### getRestDuration(tripDurationSec)

Restituisce `tripDurationSec * restMultiplier`, cioè il tempo di riposo dopo una spedizione durata `tripDurationSec` secondi reali.

### getLocalGatherRadiusPx()

Restituisce il raggio di cammino locale in pixel, calcolato come `walkingSpeedKmh * hoursWalkingRadius * pixelsPerKm`. Rappresenta 1.5 ore di cammino dal bordo del settlement. Il raggio effettivo parte dal bordo del settlement: `getSettlementRadiusPx(population) + getLocalGatherRadiusPx()`.

### getSettlementAreaKm2(population)

Restituisce l'area del settlement in km² per una data popolazione: `max(settlementMinAreaKm2, population * settlementGrowthPerPerson)`.

### getSettlementRadiusKm(population)

Restituisce il raggio del settlement in km: `sqrt(getSettlementAreaKm2(population) / π)`.

### getSettlementRadiusPx(population)

Restituisce il raggio del settlement in pixel: `getSettlementRadiusKm(population) * pixelsPerKm`.

## Parametri base in GameConfig

Ogni parametro è modificabile a runtime tramite la console o il pannello di debug. I valori di default sono quelli attuali del prototipo.

### Ciclo giorno

- **`dayLengthSeconds`** (default `10`)  
  Durata reale in secondi di un giorno di gioco. Influisce sul consumo della popolazione al campo (che avviene a fine giornata) e sul calcolo del raggio locale. Diminuendola, i giorni passano più velocemente e i consumi sono più frequenti.

- **`foodConsumptionPerPersonPerDay`** (default `0.01`)  
  Consumo base di cibo per persona al giorno. Usato per calcolare il consumo giornaliero della popolazione al campo e come base per i consumi delle spedizioni.

### Raccolta

- **`baseGatherRate`** (default `0.2`)  
  Cibo raccolto per secondo per lavoratore a densità 1.0. A densità più basse, il tasso è proporzionalmente ridotto. Parametro chiave per bilanciare la velocità della raccolta.

- **`densityReductionPerFood`** (default `0.001`)  
  Quantità di densità rimossa per ogni unità di cibo raccolta. Determina quanto velocemente le celle si esauriscono quando vengono lavorate.

### Geometria griglia (esagonale)

- **`hexCenterDistanceKm`** (default `1`)  
  Distanza in km tra i centri di esagoni adiacenti. Definisce la dimensione della cella nel mondo di gioco. Modificarlo richiede il reload della pagina.

- **`pixelsPerKm`** (default `20`)  
  Pixel per chilometro. Definisce la dimensione visiva della cella sullo schermo. Modificarlo richiede il reload della pagina.

### Movimento

- **`walkingSpeedKmh`** (default `4`)  
  Velocità di spostamento a piedi in km per ora di gioco. Determina la velocità delle spedizioni e il raggio locale. Modificarlo influisce su quanto lontano può arrivare una spedizione in un giorno.

### Consumo spedizioni

- **`travelConsumptionMultiplier`** (default `2.0`)  
  Moltiplicatore del consumo durante il viaggio rispetto al consumo base. Il valore 2.0 indica che camminare consuma il doppio rispetto allo stare fermi.

- **`gatheringConsumptionMultiplier`** (default `2.5`)  
  Moltiplicatore del consumo durante la raccolta. Il valore 2.5 indica che la raccolta consuma più del viaggio perché lo sforzo fisico è superiore.

### Provviste e riposo

- **`safetyMultiplier`** (default `1.25`)  
  Margine di sicurezza per il calcolo delle provviste. Un valore di 1.25 aggiunge il 25% alle provviste calcolate, per coprire imprevisti e tempo di raccolta.

- **`restMultiplier`** (default `0.5`)  
  Percentuale di riposo rispetto alla durata della spedizione precedente. Con 0.5, una spedizione durata 10 secondi impone 5 secondi di riposo prima di ripartire.

### Capacità

- **`maxCapacityPerWorker`** (default `1`)  
  Slot di inventario per lavoratore. La capacità massima di una spedizione è `workerCount * maxCapacityPerWorker`. Include sia cibo che provviste.

### Area e cambio cella

- **`areaRadius`** (default `150`)  
  Raggio predefinito dell'area di raccolta di una spedizione, in pixel. Una spedizione con area assegnata raccoglie solo all'interno di questo cerchio.

- **`cellAbandonThreshold`** (default `0.2`)  
  Soglia di densità sotto la quale la spedizione cerca un'altra cella. Se la densità della cella corrente scende sotto questa soglia, la spedizione valuta se spostarsi.

- **`cellSwitchScoreThreshold`** (default `1.1`)  
  Moltiplicatore del punteggio corrente necessario per cambiare cella. La nuova cella deve avere un punteggio superiore a `punteggio_corrente * cellSwitchScoreThreshold`.

- **`cellScoreDensityWeight`** (default `100`)  
  Peso della densità nel calcolo del punteggio di una cella. Un valore più alto rende la densità dominante rispetto alla distanza.

- **`cellScoreDistanceWeight`** (default `0.2`)  
  Peso della distanza nel calcolo del punteggio di una cella. Un valore più alto rende la vicinanza più importante.

- **`cellEvaluationInterval`** (default `1.0`)  
  Intervallo in secondi tra le valutazioni di cambio cella durante la raccolta. Un valore più basso rende le spedizioni più reattive a cambiare cella, ma consuma più calcoli.

### Valori di partenza

- **`startingFoodStock`** (default `10`)  
  Cibo iniziale disponibile nel campo.

- **`startingUnassignedPopulation`** (default `10`)  
  Popolazione non assegnata iniziale. Da questa pool vengono prelevati i lavoratori per le spedizioni e per la raccolta locale.

- **`startingExpeditionWorkers`** (default `5`)  
  Numero di lavoratori prelevati automaticamente quando si crea una nuova spedizione.

- **`settlementX`**, **`settlementY`** (default `100`, `100`)  
  Posizione iniziale del campo sulla mappa, in pixel.

### Crescita settlement

- **`settlementGrowthPerPerson`** (default `0.001`)  
  Area del settlement in km² per ogni persona. Con 30 persone il settlement è ~0.03 km², con 1000 ~1 km², con 4000 ~4 km².

- **`settlementMinAreaKm2`** (default `0.01`)  
  Area minima del settlement in km², usata con popolazioni molto piccole.

- **`settlementMinVisualRadiusPx`** (default `8`)  
  Raggio visivo minimo in pixel del cerchio del settlement, usato **solo** nel rendering (`drawSettlement` in `main.js`). La logica resta basata sul raggio reale.

- **`hoursWalkingRadius`** (default `1.5`)  
  Ore di cammino che definiscono il raggio locale di raccolta. Il raggio locale è `walkingSpeedKmh * hoursWalkingRadius` km.

### Mondo

- **`worldWidth`** (default `1280`)  
  Larghezza del mondo in pixel. Modificarla richiede il reload della pagina.

- **`worldHeight`** (default `720`)  
  Altezza del mondo in pixel. Modificarla richiede il reload della pagina.

### Gestione informazioni

- **`cellWarningThreshold`** (default `0.25`)  
  Soglia sotto la quale una cella viene considerata "in esaurimento". Quando la densità di una cella con lavoratori scende sotto questa soglia, viene mostrato un avviso persistente.

## Dipendenze in ingresso

Nessuna. Questo script viene caricato direttamente da `index.html`.

## Dipendenze in uscita

Nessuna. Questo script non chiama altri moduli.

## Stato globale modificato

- `GameConfig`: oggetto globale con tutti i parametri. All'avvio, gli eventuali valori salvati in `localStorage` (chiave `GAME_CONFIG_STORAGE_KEY`) vengono riapplicati prima che la griglia venga costruita.
- `GameConfigDefaults`: snapshot dei valori di default veri, creato prima di applicare eventuali valori persistiti. Usato da `debug.js` per il reset.
- `GAME_CONFIG_STORAGE_KEY`: costante con la chiave `localStorage` usata per salvare/caricare la configurazione.
- `gameTimeSec`: variabile globale che accumula il tempo di gioco effettivo (inizializzata a 0).

## Note per modifiche

- Ogni nuovo parametro di gioco va aggiunto a `GameConfig` e contestualmente esposto nel pannello di debug (in `index.html` con id `cfg-<nomeParametro>`, gestito da `05_Debug.md`).
- I parametri derivati non vanno mai salvati come costanti: vanno ricalcolati ogni volta che servono.
- I parametri strutturali (`hexCenterDistanceKm`, `pixelsPerKm`, `worldWidth`, `worldHeight`) richiedono il reload della pagina perché la griglia è costruita all'avvio con costanti derivate in `world.js`.
- Modifiche a questo file possono impattare tutti gli altri script, perché tutti leggono da `GameConfig`.
- Quando si aggiunge un parametro che influenza la fisica (es. velocità, consumi), aggiornare la sezione "Parametri GameConfig usati" dei documenti Technical degli script coinvolti.
- La persistenza della configurazione usa `localStorage`: i valori vengono salvati solo al click di "Apply & Reload" (in `debug.js`) e applicati all'avvio. `GameConfigDefaults` non va modificato a runtime.