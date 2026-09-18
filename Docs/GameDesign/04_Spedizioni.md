# Spedizioni

## Scopo

Questo documento descrive il funzionamento delle spedizioni: gruppi mobili di lavoratori che si allontanano dal campo per raccogliere cibo o svolgere altri compiti futuri.

## Definizione

Una spedizione è un'entità mobile sulla mappa, creata prelevando un certo numero di lavoratori da un Pop (inizialmente solo il Pop `gatherer`). La spedizione si muove, raccoglie risorse e torna al campo per scaricarle.

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
- `areaRadius`: raggio dell'area di raccolta
- `campRef`: riferimento al campo per il ritorno
- `cooldownRemaining`: secondi di riposo rimanenti
- `lastCellEvaluation`: tempo trascorso dall'ultima valutazione cella
- `isForced`: se true, la spedizione ignora l'esaurimento delle provviste per il ritorno
- `useAssignedArea`: se true, la spedizione raccoglie solo all'interno dell'area assegnata; se false, vaga liberamente
- `toBeDisbanded`: se true, la spedizione verrà sciolta all'arrivo al campo
- `tripStartGameTime`: tempo di gioco all'inizio del viaggio (per calcolare il riposo)

---

## Stati di una spedizione

- `travellingToArea`: in viaggio verso l'area di raccolta
- `movingToCell`: in movimento verso una cella specifica migliore all'interno dell'area
- `gathering`: sta raccogliendo dalla cella corrente
- `returningToCamp`: sta tornando al campo
- `resting`: a riposo al campo prima di ripartire

---

## Comportamento automatico

### Partenza

- La spedizione riceve provviste dalle scorte del campo.

- La quantità di provviste è calcolata dinamicamente in base a distanza, velocità, numero di lavoratori e margine di sicurezza.

- Se le provviste calcolate superano la capacità massima, la spedizione parte con meno provviste e tornerà prima.

- Il campo scala le proprie scorte di cibo della quantità data.
  
  ### Viaggio di andata

- La spedizione si muove verso il centro dell'area assegnata o verso la cella migliore trovata.

- Durante il viaggio consuma provviste in modo continuo:

consumoViaggio = workers * travelConsumptionPerSec * deltaSec

text

### Raccolta

- Arrivata all'area, la spedizione individua la cella con `forageDensity` più alta entro il raggio dell'area.
- Inizia a raccogliere da quella cella.
- Quando la densità della cella corrente scende sotto la **soglia di abbandono** (`cellAbandonThreshold`), la spedizione cerca un'altra cella migliore.
- Se trova una cella con densità superiore alla soglia e con un punteggio migliore oltre una certa soglia di switch, si sposta.
- Se nessuna cella supera la soglia, continua sulla cella corrente fino a esaurimento o fino a quando le provviste lo permettono.
- Durante la raccolta consuma provviste:

consumoRaccolta = workers * gatheringConsumptionPerSec * deltaSec

### Ritorno

La spedizione torna al campo quando:

- L'inventario è pieno (`food + provisions >= maxCapacity`).

- Le provviste scendono sotto la soglia minima per il viaggio di ritorno (a meno che non sia forzata).

- Il giocatore ordina il ritorno manualmente (tasto R).

- Viene ordinata la cancellazione (tasto C).
  
  ### Scarico e riposo

- Al ritorno al campo, la spedizione deposita il cibo raccolto in `camp.foodStock`.

- I lavoratori rientrano nel Pop di origine (`availableWorkers`).

- La spedizione entra in stato `resting` con durata proporzionale alla durata del viaggio appena concluso.

- Se la spedizione era marcata per lo scioglimento (`toBeDisbanded`), viene rimossa.
  
  ### Ripartenza

- Terminato il riposo, se ci sono ancora lavoratori disponibili nel Pop e l'area non è stata disattivata, la spedizione riparte automaticamente.

- Le provviste vengono ricalcolate come alla partenza iniziale.

---

## Scelta della cella migliore

- Periodicamente (ogni `cellEvaluationInterval`), la spedizione valuta se spostarsi su una cella migliore.
- Il punteggio di una cella è dato da:

score = density * cellScoreDensityWeight - distance * cellScoreDistanceWeight

text

- Si passa a una nuova cella se il punteggio è maggiore del punteggio corrente moltiplicato per `cellSwitchScoreThreshold`.
- La nuova cella deve avere densità >= `cellAbandonThreshold`.
- Le funzioni di ricerca celle escludono sempre la cella del campo.

---

## Modalità operative

### Area assegnata (`useAssignedArea = true`)

- La spedizione raccoglie solo all'interno del cerchio definito da `areaCenter` e `areaRadius`.

- La scelta iniziale e i cambi cella avvengono tramite `findBestCellInArea`.
  
  ### Modalità automatica (`useAssignedArea = false`)

- La spedizione vaga liberamente e sceglie la cella migliore attorno alla propria posizione corrente (`findBetterCell`).

- Non è limitata a un'area prestabilita.
  
  ### Modalità forzata (`isForced = true`)

- La spedizione non torna al campo per esaurimento provviste.

- Continua a raccogliere finché l'inventario non è pieno o il giocatore ordina il ritorno.

---

## Interazione del giocatore

- **Click destro su mappa** (con campo selezionato o spedizione selezionata), **fuori dal raggio di raccolta locale**: crea una nuova spedizione di raccolta o aggiorna l'area di una esistente.
- **Click destro dentro il raggio di raccolta locale** (il cerchio attorno al campo): non crea spedizioni né aggiorna aree; quell'area è riservata alla raccolta locale.
- **Shift + click destro** (fuori dal raggio locale): crea una spedizione forzata.

- **Tasto R**: richiama la spedizione selezionata al campo.
- **Tasto F**: attiva/disattiva la modalità forzata.
- **Tasto A**: attiva/disattiva la modalità automatica (area assegnata vs libera).
- **Tasto C**: cancella la spedizione selezionata. Se è al campo, viene sciolta immediatamente; altrimenti torna al campo e poi viene rimossa.
- **Click su una spedizione**: la seleziona e mostra le informazioni.

---

## Priorità di assegnazione lavoratori

Quando viene creata una spedizione, i lavoratori vengono presi in questo ordine:

1. Dalla popolazione non assegnata (`camp.unassignedPopulation`) → vengono spostati nel Pop gatherer e poi prelevati.
2. Dai lavoratori disponibili del Pop gatherer (`availableWorkers`).
   Se non ci sono lavoratori disponibili, la spedizione non viene creata.

---

## Bug noti e comportamenti da correggere

- Se rimando una spedizione e ho gatherers disponibili, non prende quelli, ma ne crea di nuovi. La logica corretta è: se vi sono gatherers disponibili, prendere prima quelli. In futuro il giocatore potrà scegliere da quale pool pescare.
- A volte la spedizione va fuori dall'area assegnata, perché valuta celle sul bordo e da lì vede celle migliori nel raggio. Deve rimanere sempre all'interno dell'area quando `useAssignedArea` è true.

---

## Note a lungo termine

- In futuro, le spedizioni potranno essere composte da individui di Pop diversi (es. un gatherer cristiano e uno musulmano).
- Il campo potrà spostarsi fisicamente durante le migrazioni o il nomadismo; tutte le spedizioni attive aggiorneranno il punto di ritorno alla nuova posizione.
- Le spedizioni potranno trasportare risorse diverse (legna, carne, pesce, assi) con inventari differenziati.

---

## Interazioni con altri sistemi

- **Popolazione**: le spedizioni prelevano e restituiscono lavoratori al Pop di origine.
- **Risorse**: riducono la densità delle celle di raccolta e portano cibo al campo.
- **Tempo**: consumano provviste in tempo reale.
- **UI**: mostrano stato, inventario e percorsi quando selezionate.

---

## Formule di riferimento

Le formule per consumo, provviste e riposo sono descritte in `02_Raccolta_Cibo.md`. Qui si richiamano solo quelle specifiche:

- Consumo viaggio: `workers * travelConsumptionPerSec * deltaSec`
- Consumo raccolta: `workers * gatheringConsumptionPerSec * deltaSec`
- Provviste necessarie: `workerCount * travelConsumptionPerSec * (distance / expeditionSpeed * 2) * safetyMultiplier`
- Riposo: `tripDuration * restMultiplier`