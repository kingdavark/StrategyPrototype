# Raccolta del Cibo

## Scopo

Questo documento descrive come funziona la raccolta di cibo vegetale, sia tramite lavoratori locali assegnati agli esagoni attorno al settlement, sia tramite spedizioni che si spostano sulla mappa. Include formule, consumo, provviste, previsioni e avvisi.

## Tipi di raccolta

### Raccolta locale

- Il raggio locale è definito come il percorso che un pendolare può fare in mezza giornata di lavoro:
  - `localGatherRadiusKm = walkingSpeedKmh * hoursWalkingRadius`
  - `hoursWalkingRadius` = 1.5 ore (parametro configurabile)
  - Convertito in pixel con `pixelsPerKm`
- Il raggio parte dal bordo dell'area occupata dal settlement, non dal centro: un esagono è valido se la distanza tra il suo centro e il centro del settlement è `<= settlementRadiusPx + localGatherRadiusPx`

### Spedizioni di raccolta

- Gruppi mobili di lavoratori che si spostano sulla mappa per raccogliere cibo fuori dal raggio locale.
- Possono avere un'area di raccolta assegnata o vagare liberamente.
- Le spedizioni consumano provviste durante il viaggio e la raccolta, e riportano il cibo al settlement.

---

## Formule di raccolta

Tasso di raccolta per esagono (al secondo):

`gatherRate = baseGatherRate * density * workers`

dove `density` è la densità attuale dell'esagono e `workers` il numero di lavoratori.

Riduzione della densità (al secondo):

`densityReduction = gatherRate * densityReductionPerFood / (1 - urbanizedFraction)`

La densità segue un decadimento esponenziale:

`d(t) = d0 * exp(-k * t)`
`k = workers * baseGatherRate * densityReductionPerFood / (1 - urbanizedFraction)`

La riduzione della densità avviene solo sull'esagono esatto su cui lavorano i lavoratori (riduzione puntuale).

Se `urbanizedFraction = 1`, l'esagono è interamente coperto dal settlement: la raccolta è impossibile e i lavoratori eventualmente assegnati vengono liberati automaticamente con un avviso.

---

## Consumo di cibo

Popolazione al settlement: consuma una razione giornaliera fissa, calcolata per l'intera tribù a fine giornata:

`dailyConsumption = totalPopulation * foodConsumptionPerPersonPerDay`

Spedizioni in viaggio: consumano provviste in modo continuo, proporzionalmente al tempo trascorso e con un moltiplicatore maggiore rispetto al riposo:

`travelConsumptionPerSec = baseConsumptionPerSec * travelConsumptionMultiplier`

Spedizioni durante la raccolta: consumano ancora di più:

`gatheringConsumptionPerSec = baseConsumptionPerSec * gatheringConsumptionMultiplier`

`baseConsumptionPerSec` deriva da:

`baseConsumptionPerSec = foodConsumptionPerPersonPerDay / dayLengthSeconds`

---

## Provviste per spedizioni

Le provviste assegnate a una spedizione non sono un numero fisso, ma vengono calcolate alla partenza e a ogni ripartenza. Il calcolo considera:

- Distanza da percorrere (andata e ritorno)
- Velocità di spostamento della spedizione
- Numero di lavoratori
- Margine di sicurezza per tempo di raccolta e imprevisti

Formula:

`provisionsNeeded = workerCount * travelConsumptionPerSec * (distance / expeditionSpeed * 2) * safetyMultiplier`

Il limite principale è la capacità di carico: se le provviste calcolate superano la capacità massima, la spedizione parte con meno provviste e tornerà prima.Le provviste assegnate a una spedizione non sono un numero fisso, ma vengono calcolate alla partenza e a ogni ripartenza. Il calcolo considera:

- Distanza da percorrere (andata e ritorno)
- Velocità di spostamento della spedizione
- Numero di lavoratori
- Margine di sicurezza per imprevisti

Formula:

`provisionsNeeded = workerCount * travelConsumptionPerSec * (distance_km * 2 / expeditionSpeed) * safetyMultiplier`

Nota: il `safetyMultiplier` si applica SOLO al budget iniziale di partenza, non alla soglia di ritorno. Durante la raccolta, la spedizione può consumare anche il cibo raccolto come riserva (vedi `04_Spedizioni.md`, sezione "Ritorno"). La soglia di ritorno è calcolata sul costo puro del viaggio, senza margine di sicurezza.

---

## Riposo dopo la spedizione

Dopo una spedizione, i lavoratori devono riposare. Il tempo di riposo è proporzionale alla durata della spedizione appena conclusa:

`restDuration = tripDurationSec * restMultiplier`

Spedizioni lunghe richiedono riposi più lunghi.

---

## Previsioni sugli esagoni

Per ogni esagono selezionato (in modalità settlement) vengono calcolati:

Cibo rimanente sfruttabile fino a soglia 25%:

`foodTo25 = max(0, (density - cellWarningThreshold) / densityReductionPerFood * (1 - urbanizedFraction))`

Cibo totale rimanente stimato:

`ciboTotale = density / densityReductionPerFood * (1 - urbanizedFraction)`

Giorni al raggiungimento della soglia 25% con il ritmo attuale (tenendo conto del decadimento esponenziale della densità):

`daysTo25 = -ln(cellWarningThreshold / density) / k`

dove `k = workers * baseGatherRate * densityReductionPerFood / (1 - urbanizedFraction)`.

(solo se `workers > 0` e `density > cellWarningThreshold`)

Aumento di cibo raccolto al giorno aggiungendo un lavoratore (scalato per l'area libera):

`increasePerDay = baseGatherRate * density * dayLengthSeconds * (1 - urbanizedFraction)`

Giorni risparmiati per raggiungere la soglia se aggiungo un lavoratore:

`k2 = (workers + 1) * baseGatherRate * densityReductionPerFood / (1 - urbanizedFraction)`
`daysTo25_extra = -ln(cellWarningThreshold / density) / k2`
`reducedDays25 = max(0, daysTo25 - daysTo25_extra)`

---

## Avvisi di soglia

- Soglia unica di avviso: `cellWarningThreshold = 0.25`.
- Quando un esagono con lavoratori scende sotto la soglia, viene aggiunto alla lista `warningCells` e viene mostrato un indicatore persistente:
  - In modalità settlement: triangolo rosso sopra l'esagono.
  - In modalità mappa: triangolo rosso sopra il settlement.
- L'indicatore rimane finché l'esagono non torna sopra soglia.
- L'avviso in console viene emesso solo la prima volta che l'esagono scende sotto soglia.

### Avvisi per liberazione automatica dei lavoratori

Quando i lavoratori vengono liberati automaticamente (es. esagono totalmente urbanizzato, esagono fuori raggio dopo cambio velocità), viene mostrato un banner in alto a destra, sotto eventuali menu. Il banner è dismissibile con click destro.

---

## Dati giornalieri

Durante il giorno vengono accumulati:

- `settlement.foodGatheredToday`: cibo raccolto oggi da lavoratori locali.
- `hex.foodGatheredToday`: cibo raccolto oggi da uno specifico esagono.
- `settlement.foodConsumedToday`: cibo consumato oggi (in tempo reale, ma mostrato solo a fine giornata).

A fine giornata:

- `settlement.gatheredDaily = settlement.foodGatheredToday`
- `settlement.consumedDaily = consumoTotaleGiornaliero`
- `hex.gatheredDaily = hex.foodGatheredToday`
- I contatori `foodGatheredToday` vengono azzerati.

Nel riepilogo del settlement e nelle info esagono vengono mostrati i valori daily (del giorno precedente), non quelli in tempo reale.

---

## Interazioni con altri sistemi

- Popolazione: i lavoratori locali appartengono al Pop `gatherer` (se non esiste, viene creato al momento dell'assegnazione).
- Mappa: la raccolta locale è limitata agli esagoni entro il raggio locale. Le spedizioni possono andare oltre.
- Tempo: il consumo giornaliero avviene a fine giornata; le spedizioni consumano in continuo.
- Informazione: in futuro i dati su scorte e raccolto saranno offuscati o mediati da report.

---

## UI/UX collegata

- In modalità settlement, cliccando su un esagono entro il raggio locale si seleziona l'esagono e si mostra il pannello info con i dettagli e le previsioni.
- Bottoni `+` e `-` nel pannello `local-worker-panel` per assegnare/rimuovere lavoratori.
- Sopra ogni esagono con lavoratori appare il numero di lavoratori.
- Il raggio locale è visualizzato come bordo esterno giallo degli esagoni al confine (solo il lato esterno, per formare un unico poligono).
- Triangoli rossi persistenti indicano esagoni sotto soglia.
- Banner di notifica in alto a destra per la liberazione automatica dei lavoratori.