# Entities Units

## Scopo

Questo documento descrive le entità principali del gioco: il campo (Camp), i Pop (gruppi di lavoratori) e le spedizioni (Expedition). Include proprietà, metodi e interazioni.

## Camp

Il campo è il punto di riferimento della tribù. È rappresentato da un oggetto globale `camp` definito in `units.js`.

Proprietà:

- `x`, `y`: posizione in pixel sulla mappa (inizializzata da `GameConfig.campX` e `GameConfig.campY`).

- `foodStock`: scorte globali di cibo (inizializzate da `GameConfig.startingFoodStock`).

- `unassignedPopulation`: numero di individui non ancora assegnati a nessun Pop (inizializzato da `GameConfig.startingUnassignedPopulation`).

- `pops`: array di oggetti Pop presenti al campo.

- `expeditions`: array di spedizioni attive (alias globale `expeditions`).

- `localGatherers`: numero totale di lavoratori assegnati a celle locali (somma di `assignedWorkers` di tutte le celle).

- `foodGatheredToday`: cibo raccolto localmente oggi (accumulato durante il giorno).

- `foodConsumedToday`: cibo consumato dalla popolazione nell'ultimo giorno completato (valore in tempo reale, ma mostrato solo a fine giornata).

- `gatheredDaily`: cibo raccolto localmente nel giorno precedente (aggiornato a fine giornata).

- `consumedDaily`: cibo consumato dalla popolazione nel giorno precedente (aggiornato a fine giornata).

All'inizio del gioco, tutta la popolazione è in `unassignedPopulation`. Quando il giocatore assegna lavoratori a una cella locale o crea una spedizione, parte della popolazione viene convertita nel Pop `gatherer`.

## Pop

Un Pop rappresenta un insieme di individui con le stesse caratteristiche (occupazione, cultura, religione, status, etnia). Per il prototipo attuale, l'unica occupazione è `gatherer`.

Proprietà:

- `type`: tipo di Pop (es. `gatherer`).

- `totalWorkers`: numero totale di individui appartenenti a questo Pop.

- `availableWorkers`: lavoratori attualmente al campo, pronti per essere assegnati a spedizioni o compiti locali.

- `assignedWorkers`: lavoratori attualmente in spedizione.

- `localWorkers`: lavoratori assegnati a celle locali di raccolta attorno al campo.

Metodi:

- `addWorkers(count)`: incrementa `totalWorkers` e `availableWorkers` di `count`. Usato quando si converte popolazione non assegnata in gatherer.

- `takeWorkers(count)`: preleva fino a `count` lavoratori da `availableWorkers`, li sposta in `assignedWorkers` e restituisce il numero effettivamente prelevato. Se `availableWorkers` è minore di `count`, preleva solo quelli disponibili.

- `returnWorkers(count)`: sposta `count` lavoratori da `assignedWorkers` a `availableWorkers`. Usato al rientro di una spedizione.

Comportamento:

- Quando una spedizione torna al campo, i lavoratori rientrano in `availableWorkers` (non tornano automaticamente in `unassignedPopulation`).

- Quando un lavoratore viene assegnato a una cella locale, incrementa `localWorkers` e `totalWorkers` (se non era già nel Pop), e decrementa `unassignedPopulation`.

- Solo un'azione esplicita del giocatore (non ancora implementata) potrebbe riconvertire un gatherer in popolazione non assegnata.

- In futuro potranno esistere più Pop con specializzazioni diverse (cacciatori, pescatori, artigiani) e con etnie o religioni diverse.

## Expedition

Una spedizione è un'entità mobile sulla mappa, creata prelevando `n` lavoratori da un Pop (o dalla popolazione non assegnata, creando il Pop al volo).

Proprietà:

- `id`: identificativo univoco (formato `exp_<timestamp>`).

- `popType`: tipo di Pop da cui proviene (es. `gatherer`).

- `workerCount`: numero di individui in questa spedizione.

- `x`, `y`: posizione corrente in pixel.

- `targetX`, `targetY`: destinazione corrente.

- `speed`: velocità in pixel al secondo, calcolata dinamicamente con `getExpeditionSpeed()`.

- `state`: stato attuale (vedi sotto).

- `maxCapacity`: capacità massima di carico, calcolata come `workerCount * GameConfig.maxCapacityPerWorker`.

- `inventory`: oggetto con `provisions` (provviste rimanenti) e `food` (cibo raccolto).

- `areaCenter`: `{ x, y }` centro dell'area di raccolta assegnata.

- `areaRadius`: raggio dell'area di raccolta in pixel (inizializzato da `GameConfig.areaRadius`).

- `campRef`: riferimento all'oggetto `camp`.

- `cooldownRemaining`: secondi di riposo rimanenti.

- `lastCellEvaluation`: tempo trascorso dall'ultima valutazione di cambio cella.

- `isForced`: se `true`, la spedizione ignora l'esaurimento delle provviste per il ritorno.

- `useAssignedArea`: se `true`, la spedizione raccoglie solo all'interno dell'area assegnata; se `false`, vaga liberamente.

- `toBeDisbanded`: se `true`, la spedizione verrà sciolta all'arrivo al campo.

- `tripStartGameTime`: tempo di gioco all'inizio del viaggio, usato per calcolare la durata e quindi il riposo.

Stati:

- `travellingToArea`: in viaggio verso l'area di raccolta.

- `movingToCell`: in movimento verso una cella specifica all'interno dell'area.

- `gathering`: sta raccogliendo dalla cella corrente.

- `returningToCamp`: sta tornando al campo.

- `resting`: a riposo al campo prima di ripartire.

Metodi:

- `cellScore(cx, cy)`: calcola il punteggio di una cella in base a densità e distanza. Restituisce `density * cellScoreDensityWeight - distance * cellScoreDistanceWeight`. Restituisce `-Infinity` se la densità è 0.

- `findBetterCell()`: cerca la cella con il punteggio migliore attorno alla posizione corrente della spedizione. Esclude la cella del campo. Usata in modalità automatica.

- `findBestCellInArea(fromX, fromY)`: cerca la cella con il punteggio migliore all'interno del cerchio definito da `areaCenter` e `areaRadius`. Testa la distanza dal centro dell'area con `Phaser.Math.Distance.Between`. Usata in modalità area assegnata.

- `update(delta)`: gestisce il comportamento della spedizione in base allo stato corrente. Consuma provviste, si muove, raccoglie, rientra, riposa e riparte.

## Unità generica

Ogni entità mobile (in prospettiva futura: pop, branchi) possiede almeno:

- `id`: stringa

- `type`: `pop` oppure `herd`

- `x`, `y`: posizione continua in pixel

- `targetX`, `targetY`: destinazione

- `speed`: pixel al secondo a velocità 1x

- `state`: `idle`, `moving` oppure `working`

Nel prototipo attuale, l'unica entità mobile è `Expedition`. Il Pop non è un'entità mobile (i suoi lavoratori locali non si spostano sulla mappa). I branchi saranno introdotti in MVP2.

## Branco (futuro)

Entità prevista per MVP2. Proprietà previste:

- `species`: es. `deer`, `bison`

- `herdSize`: numero di capi

- `habitat`: tipo di terreno preferito

- Comportamento AI: movimento lento casuale entro l'habitat, fuga se minacciato.

## Interazioni con altri moduli

- `config.js`: fornisce i parametri di partenza e le funzioni derivate.

- `world.js`: la spedizione usa `getCell` e `reduceCellDensity` per la raccolta.

- `main.js`: crea e rimuove spedizioni, aggiorna il Pop, disegna le entità.

- `debug.js`: assegna o rimuove lavoratori locali, aggiornando il Pop.