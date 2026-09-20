# Spedizioni

## Scopo

Questo documento descrive il funzionamento delle spedizioni: gruppi mobili di lavoratori che si allontanano dal settlement per raccogliere cibo o svolgere altri compiti futuri.

## Definizione

Una spedizione è un'entità mobile sulla mappa, creata prelevando un certo numero di lavoratori da un Pop (inizialmente solo il Pop `gatherer`). La spedizione si muove, raccoglie risorse e torna al settlement per scaricarle.

## Proprietà di una spedizione

- `id`: identificativo univoco
- `popType`: tipo di Pop da cui proviene (es. `gatherer`)
- `workerCount`: numero di individui nella spedizione
- `x`, `y`: posizione continua in pixel
- `targetX`, `targetY`: destinazione corrente
- `speed`: velocità in pixel al secondo (derivata)
- `state`: stato attuale (vedi sotto)
- `maxCapacity`: capacità massima di carico (cibo + provviste)
- `inventory`: oggetto con `provisions` e `food` trasportati
- `areaCenter`: centro dell'area di raccolta assegnata
- `areaRadius`: raggio dell'area di raccolta in pixel
- `settlementRef`: riferimento al settlement per il ritorno
- `cooldownRemaining`: secondi di riposo rimanenti
- `lastCellEvaluation`: tempo trascorso dall'ultima valutazione esagono
- `isForced`: se true, la spedizione ignora l'esaurimento delle provviste per il ritorno
- `useAssignedArea`: se true, la spedizione raccoglie solo all'interno dell'area assegnata; se false, vaga liberamente
- `toBeDisbanded`: se true, la spedizione verrà sciolta all'arrivo al settlement
- `tripStartGameTime`: tempo di gioco all'inizio del viaggio (per calcolare il riposo)

---

## Stati di una spedizione

- `travellingToArea`: in viaggio verso l'area di raccolta
- `movingToCell`: in movimento verso un esagono specifico migliore all'interno dell'area
- `gathering`: sta raccogliendo dall'esagono corrente
- `returningToSettlement`: sta tornando al settlement
- `resting`: a riposo al settlement prima di ripartire

---

## Comportamento automatico

### Partenza

- La spedizione riceve provviste dalle scorte del settlement.
- La quantità di provviste è calcolata dinamicamente in base a distanza, velocità, numero di lavoratori e margine di sicurezza.
- Se le provviste calcolate superano la capacità massima, la spedizione parte con meno provviste e tornerà prima.
- Il settlement scala le proprie scorte di cibo della quantità data.

### Viaggio di andata

- La spedizione si muove in linea retta verso il centro dell'area assegnata o verso l'esagono migliore trovato.
- Durante il viaggio consuma provviste in modo continuo:

`consumoViaggio = workers * travelConsumptionPerSec * deltaSec`

### Raccolta

- Arrivata all'area, la spedizione individua l'esagono con `forageDensity` più alta entro il raggio dell'area.
- Inizia a raccogliere da quell'esagono.
- Quando la densità dell'esagono corrente scende sotto la soglia di abbandono (`cellAbandonThreshold`), la spedizione cerca un altro esagono migliore.
- Se trova un esagono con densità superiore alla soglia e con un punteggio migliore oltre una certa soglia di switch, si sposta.
- Se nessun esagono supera la soglia, continua su quello corrente fino a esaurimento o fino a quando le provviste lo permettono.
- Durante la raccolta consuma provviste:

`consumoRaccolta = workers * gatheringConsumptionPerSec * deltaSec`

- Se l'esagono ha `urbanizedFraction = 1`, la spedizione non può raccogliere lì e cerca un altro esagono.

### Ritorno

La spedizione torna al settlement quando:

- L'inventario è pieno (`food + provisions >= maxCapacity`).
- Le provviste scendono sotto la soglia minima per il viaggio di ritorno (a meno che non sia forzata).
- Il giocatore ordina il ritorno manualmente (tasto R).
- Viene ordinata la cancellazione (tasto C).

### Scarico e riposo

- Al ritorno al settlement, la spedizione deposita il cibo raccolto in `settlement.foodStock`.
- I lavoratori rientrano nel Pop di origine (`availableWorkers`).
- La spedizione entra in stato `resting` con durata proporzionale alla durata del viaggio appena concluso.
- Se la spedizione era marcata per lo scioglimento (`toBeDisbanded`), viene rimossa.

### Ripartenza

- Terminato il riposo, se ci sono ancora lavoratori disponibili nel Pop e l'area non è stata disattivata, la spedizione riparte automaticamente.
- Le provviste vengono ricalcolate come alla partenza iniziale.

---

## Scelta dell'esagono migliore

- Periodicamente (ogni `cellEvaluationInterval`), la spedizione valuta se spostarsi su un esagono migliore.
- Il punteggio di un esagono è dato da:

`score = density * cellScoreDensityWeight - distance * cellScoreDistanceWeight`

- Si passa a un nuovo esagono se il punteggio è maggiore del punteggio corrente moltiplicato per `cellSwitchScoreThreshold`.
- Il nuovo esagono deve avere densità >= `cellAbandonThreshold`.
- Le funzioni di ricerca esagoni escludono sempre l'esagono del settlement.

### Geometria dell'area di raccolta

L'area di raccolta è definita da un centro (`areaCenter`) e un raggio (`areaRadius`) in pixel. Gli esagoni validi sono quelli il cui **centro** è entro il raggio (distanza euclidea in pixel). Questo vale anche in modalità automatica (`useAssignedArea = false`), dove il raggio è relativo alla posizione corrente della spedizione.

---

## Modalità operative

### Area assegnata (`useAssignedArea = true`)

- La spedizione raccoglie solo all'interno del cerchio definito da `areaCenter` e `areaRadius`.
- La scelta iniziale e i cambi esagono avvengono tramite `findBestCellInArea`.

### Modalità automatica (`useAssignedArea = false`)

- La spedizione vaga liberamente e sceglie l'esagono migliore attorno alla propria posizione corrente (`findBetterCell`).
- Non è limitata a un'area prestabilita.

### Modalità forzata (`isForced = true`)

- La spedizione non torna al settlement per esaurimento provviste.
- Continua a raccogliere finché l'inventario non è pieno o il giocatore ordina il ritorno.

---

## Interazione del giocatore

- **Click destro su mappa** (con settlement selezionato o spedizione selezionata), **fuori dal raggio di raccolta locale**: crea una nuova spedizione di raccolta o aggiorna l'area di una esistente.

- **Click destro dentro il raggio di raccolta locale**: non crea spedizioni né aggiorna aree. Quell'area è riservata alla raccolta locale.

- **Shift + click destro** (fuori dal raggio locale): crea una spedizione forzata.

- **Tasto R**: richiama la spedizione selezionata al settlement.

- **Tasto F**: attiva/disattiva la modalità forzata.

- **Tasto A**: attiva/disattiva la modalità automatica (area assegnata vs libera).

- **Tasto C**: cancella la spedizione selezionata. Se è al settlement, viene sciolta immediatamente; altrimenti torna al settlement e poi viene rimossa.

- **Click su una spedizione**: la seleziona e mostra le informazioni.

---

## Priorità di assegnazione lavoratori

Quando viene creata una spedizione, i lavoratori vengono presi in questo ordine:

1. Dalla popolazione non assegnata (`settlement.unassignedPopulation`) → vengono spostati nel Pop gatherer e poi prelevati.
2. Dai lavoratori disponibili del Pop gatherer (`availableWorkers`).

Se non ci sono lavoratori disponibili, la spedizione non viene creata.

---

## Bug noti e comportamenti da correggere

- Se rimando una spedizione e ho gatherers disponibili, non prende quelli, ma ne crea di nuovi. La logica corretta è: se vi sono gatherers disponibili, prendere prima quelli. In futuro il giocatore potrà scegliere da quale pool pescare.
- A volte la spedizione va fuori dall'area assegnata, perché valuta esagoni sul bordo e da lì vede esagoni migliori nel raggio. Deve rimanere sempre all'interno dell'area quando `useAssignedArea` è true.

---

## Note a lungo termine

- In futuro, le spedizioni potranno essere composte da individui di Pop diversi (es. un gatherer cristiano e uno musulmano).
- Il settlement potrà spostarsi fisicamente durante le migrazioni o il nomadismo; tutte le spedizioni attive aggiorneranno il punto di ritorno alla nuova posizione.
- Le spedizioni potranno trasportare risorse diverse (legna, carne, pesce, assi) con inventari differenziati.

---

## Interazioni con altri sistemi

- Popolazione: le spedizioni prelevano e restituiscono lavoratori al Pop di origine.
- Risorse: riducono la densità degli esagoni di raccolta e portano cibo al settlement.
- Tempo: consumano provviste in tempo reale.
- UI: mostrano stato, inventario e percorsi quando selezionate.

---

## Formule di riferimento

Le formule per consumo, provviste e riposo sono descritte in `03_RaccoltaCibo.md`. Qui si richiamano solo quelle specifiche:

- Consumo viaggio: `workers * travelConsumptionPerSec * deltaSec`
- Consumo raccolta: `workers * gatheringConsumptionPerSec * deltaSec`
- Provviste necessarie: `workerCount * travelConsumptionPerSec * (distance / expeditionSpeed * 2) * safetyMultiplier`
- Riposo: `tripDuration * restMultiplier`