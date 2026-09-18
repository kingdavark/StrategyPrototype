# Expeditions

## Scopo

Questo documento descrive in dettaglio il comportamento delle spedizioni: creazione, movimento, consumo di provviste, raccolta, cambio cella, ritorno al campo, riposo e ripartenza. Include la logica di scelta delle celle e le interazioni con il resto del sistema.

## Creazione di una spedizione

Una spedizione viene creata quando il giocatore fa click destro su una posizione della mappa con il campo selezionato o con una spedizione selezionata.

Procedura:

1. Si cerca il Pop `gatherer` in `camp.pops`. Se non esiste, viene creato e aggiunto.

2. Si determina quanti lavoratori prelevare, con questa priorità:
   
   - Se `camp.unassignedPopulation > 0`, si spostano fino a `GameConfig.startingExpeditionWorkers` individui dalla popolazione non assegnata al Pop `gatherer` (chiamando `addWorkers`), poi si prelevano tramite `takeWorkers`.
   
   - Altrimenti, se `pop.availableWorkers > 0`, si prelevano fino a `GameConfig.startingExpeditionWorkers` lavoratori disponibili.
   
   - Se non ci sono lavoratori disponibili, la spedizione non viene creata.

3. Si crea una nuova istanza di `Expedition` con i dati necessari: id, tipo Pop, numero lavoratori, posizione di partenza (campo), posizione dell'area di raccolta (click), raggio area.

4. Si assegnano le provviste iniziali:
   
   - Si calcola la distanza tra campo e area target con `Phaser.Math.Distance.Between`.
   
   - Si chiama `getProvisionsNeeded(taken, dist)` per ottenere le provviste necessarie.
   
   - Si prelevano dal campo: `given = Math.min(needed, camp.foodStock, exp.maxCapacity)`.
   
   - Si aggiorna `exp.inventory.provisions = given` e `camp.foodStock -= given`.

5. Si aggiunge la spedizione all'array `expeditions`.

6. Se il tasto Shift era premuto al momento del click, la spedizione parte in modalità forzata (`isForced = true`).

## Stati e transizioni

La spedizione può trovarsi in uno di questi stati, e transita tra loro secondo la logica di `update(delta)`.

- `travellingToArea`: la spedizione sta andando verso l'area di raccolta. Quando arriva vicino al target (distanza < 2 pixel), passa a `gathering`.

- `movingToCell`: la spedizione sta andando verso una cella specifica all'interno dell'area (cambio cella). Quando arriva, passa a `gathering`.

- `gathering`: la spedizione sta raccogliendo dalla cella corrente. Può passare a `movingToCell` (cambio cella) o a `returningToCamp` (inventario pieno, provviste esaurite, ordine del giocatore).

- `returningToCamp`: la spedizione sta tornando al campo. Quando arriva (distanza < 5 pixel), scarica il cibo, i lavoratori tornano al Pop, e passa a `resting` (o viene rimossa se `toBeDisbanded`).

- `resting`: la spedizione è a riposo. Quando `cooldownRemaining <= 0`, se trova un target valido, passa a `travellingToArea`; altrimenti continua a riposare.

## Movimento

Il movimento avviene negli stati `travellingToArea`, `movingToCell` e `returningToCamp`.

Logica:

- Si calcola il vettore `(dx, dy)` dalla posizione corrente al target.

- Si calcola la distanza `dist = sqrt(dx*dx + dy*dy)`.

- Se `dist < 2`, la spedizione è arrivata: si aggiorna la posizione al target e si gestisce la transizione di stato.

- Altrimenti, si calcola il passo `step = speed * delta` e si sposta la spedizione di una frazione proporzionale: `ratio = min(step / dist, 1)`, `x += dx * ratio`, `y += dy * ratio`.

- La velocità `speed` viene aggiornata ogni frame con `getExpeditionSpeed()` per riflettere eventuali modifiche a `GameConfig`.

Durante il movimento (in tutti e tre gli stati), la spedizione consuma provviste:

text

consumed = workerCount * getTravelConsumptionPerSec() * delta
inventory.provisions -= consumed

Se `inventory.provisions < 0`, viene forzato a 0.

## Raccolta

Nello stato `gathering`:

1. Consumo provviste di raccolta:
   
   text
   
   consumed = workerCount * getGatheringConsumptionPerSec() * delta
   inventory.provisions -= consumed
   
   Se `provisions <= 0` e la spedizione non è forzata, la spedizione passa a `returningToCamp`.

2. Controllo capacità: se `inventory.food + inventory.provisions >= maxCapacity`, la spedizione passa a `returningToCamp`.

3. Valutazione cambio cella: ogni `GameConfig.cellEvaluationInterval` secondi, la spedizione valuta se spostarsi su una cella migliore.

4. Raccolta effettiva:
   
   - Si ottiene la cella corrente con `worldToCell(this.x, this.y)`.
   
   - Se `cellData.forageDensity > 0`, si raccoglie:
     
     text
     
     gatherRate = GameConfig.baseGatherRate * density * delta * workerCount
     inventory.food += gatherRate
     densityReduction = gatherRate * GameConfig.densityReductionPerFood
     reduceCellDensity(cellData, densityReduction)
   
   - Se la densità è 0, la spedizione cerca una cella migliore (in area se `useAssignedArea`, altrimenti attorno a sé). Se non trova nulla, torna al campo.

## Scelta della cella migliore

Il punteggio di una cella è dato da:

text

score = density * GameConfig.cellScoreDensityWeight - distance * GameConfig.cellScoreDistanceWeight

dove `density` è la densità della cella e `distance` è la distanza in pixel dalla posizione corrente (o dal centro dell'area, a seconda del contesto).

Le soglie di switch sono:

- La nuova cella deve avere densità >= `GameConfig.cellAbandonThreshold`.

- Il punteggio della nuova cella deve superare il punteggio corrente moltiplicato per `GameConfig.cellSwitchScoreThreshold`.

### findBetterCell

Cerca la cella migliore attorno alla posizione corrente della spedizione. L'iterazione avviene su un rettangolo di celle di lato `2 * ceil(areaRadius / CELL_SIZE) + 1` centrato sulla cella corrente. Per ogni cella:

- Si salta la cella del campo.

- Si calcola il punteggio con `cellScore`.

- Si tiene traccia della migliore.

Restituisce `{ cx, cy, score }`. Se nessuna cella supera il filtro, `cx = -1`.

### findBestCellInArea

Cerca la cella migliore all'interno del cerchio definito da `areaCenter` e `areaRadius`. L'iterazione avviene su un rettangolo di celle centrato su `areaCenter`. Per ogni cella:

- Si salta se la densità è 0.

- Si testa la distanza dal centro dell'area con `Phaser.Math.Distance.Between`. Se supera `areaRadius`, la cella viene esclusa.

- Si calcola il punteggio usando la distanza dalla posizione corrente della spedizione.

- Si tiene traccia della migliore.

Restituisce `{ cx, cy, score }`.

## Ritorno al campo

La spedizione passa a `returningToCamp` in queste situazioni:

- L'inventario è pieno (`food + provisions >= maxCapacity`).

- Le provviste scendono a 0 e la spedizione non è forzata.

- Il giocatore preme R per richiamarla.

- Il giocatore preme C per cancellarla (in questo caso viene marcata con `toBeDisbanded = true`).

Quando la spedizione è in stato `returningToCamp`, il controllo delle provviste viene saltato per evitare loop. La spedizione procede dritta verso il campo.

All'arrivo (distanza < 5 pixel):

- La posizione viene forzata a quella del campo.

- Se `toBeDisbanded` è `true`, si deposita il cibo in `camp.foodStock`, si chiama `pop.returnWorkers(workerCount)` e la spedizione viene rimossa da `expeditions`.

- Altrimenti, si deposita il cibo in `camp.foodStock`, si azzera l'inventario, si calcola la durata del viaggio (`gameTimeSec - tripStartGameTime`) e si assegna il riposo con `getRestDuration(tripDuration)`. Lo stato passa a `resting`.

## Riposo e ripartenza

Nello stato `resting`:

- `cooldownRemaining` viene decrementato ogni frame di `delta`.

- Quando `cooldownRemaining <= 0`, si cerca un nuovo target:
  
  - In modalità area assegnata: `findBestCellInArea(camp.x, camp.y)`.
  
  - In modalità automatica: `findBetterCell()`.

- Se viene trovato un target, si calcola la distanza `targetDist` dal campo e si prelevano nuove provviste:
  
  text
  
  needed = getProvisionsNeeded(workerCount, targetDist)
  taken = min(needed, camp.foodStock, maxCapacity)
  inventory.provisions = taken
  camp.foodStock -= taken
  tripStartGameTime = gameTimeSec
  state = 'travellingToArea'

- Se non viene trovato alcun target, il riposo viene esteso di un altro periodo (`dayLengthSeconds * restMultiplier`).

## Modalità operative

### Area assegnata (useAssignedArea = true)

La spedizione raccoglie solo all'interno del cerchio definito da `areaCenter` e `areaRadius`. La scelta iniziale e i cambi cella avvengono tramite `findBestCellInArea`.

### Modalità automatica (useAssignedArea = false)

La spedizione vaga liberamente e sceglie la cella migliore attorno alla propria posizione corrente (`findBetterCell`). Non è limitata a un'area prestabilita. Viene creata con `useAssignedArea = false` dalla funzione di click destro sul campo.

### Modalità forzata (isForced = true)

La spedizione non torna al campo per esaurimento provviste. Continua a raccogliere finché l'inventario non è pieno o il giocatore ordina il ritorno.

## Cancellazione di una spedizione

Il tasto C cancella la spedizione selezionata.

- Se la spedizione è già `resting` o `idle`, viene sciolta immediatamente: cibo depositato, lavoratori restituiti al Pop, spedizione rimossa da `expeditions`.

- Altrimenti, viene marcata con `toBeDisbanded = true` e passa a `returningToCamp`. All'arrivo al campo, viene rimossa.

## Interazione del giocatore (riepilogo)

- Click destro su mappa (con campo o spedizione selezionata): crea nuova spedizione o aggiorna area di una esistente.

- Shift + click destro: crea spedizione forzata.

- Click destro sul campo: crea spedizione automatica (free roaming). Questa funzione sarà rimossa in futuro.

- Tasto R: richiama la spedizione selezionata al campo.

- Tasto F: attiva/disattiva la modalità forzata.

- Tasto A: attiva/disattiva la modalità automatica.

- Tasto C: cancella la spedizione selezionata.

- Click su una spedizione: la seleziona e mostra le informazioni nel pannello info.

## Bug noti

- Se rimando una spedizione e ho gatherers disponibili, non prende quelli, ma ne crea di nuovi. La logica corretta è: se vi sono gatherers disponibili, prendere prima quelli.

- A volte la spedizione va fuori dall'area assegnata: valuta celle sul bordo e da lì vede celle migliori nel raggio, uscendo dall'area. Deve rimanere sempre all'interno quando `useAssignedArea` è true.

## Note a lungo termine

- Le spedizioni potranno essere composte da individui di Pop diversi (es. un gatherer cristiano e uno musulmano).

- Il campo potrà spostarsi fisicamente; tutte le spedizioni attive aggiorneranno il punto di ritorno.

- Le spedizioni potranno trasportare risorse diverse (legna, carne, pesce, assi) con inventari differenziati.

## Interazioni con altri moduli

- `config.js`: fornisce velocità, consumi, provviste, capacità, soglie.

- `world.js`: fornisce celle e `reduceCellDensity`.

- `units.js`: le spedizioni sono definite come classe in questo file.

- `main.js`: crea spedizioni, gestisce input, disegna le spedizioni sulla mappa.

- `time.js`: fornisce il delta di gioco per il movimento e i consumi.