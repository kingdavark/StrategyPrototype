# Raccolta del Cibo

## Scopo

Questo documento descrive come funziona la raccolta di cibo vegetale, sia tramite lavoratori locali assegnati alle celle attorno al campo, sia tramite spedizioni che si spostano sulla mappa. Include formule, consumo, provviste, previsioni e avvisi.

## Tipi di raccolta

### Raccolta locale

- I lavoratori vengono assegnati manualmente a celle specifiche entro il raggio locale del campo.
- I lavoratori locali **non sono entità mobili**: producono cibo direttamente al campo.
- Ogni cella ha un numero di lavoratori assegnati (`assignedWorkers`).
- Il raggio locale è definito come **una giornata di viaggio** dai confini del campo:
  - `localGatherRadiusKm = walkingSpeedKmh * 24`
  - Convertito in pixel con `pixelsPerKm`.
    
    ### Spedizioni di raccolta
- Gruppi mobili di lavoratori che si spostano sulla mappa per raccogliere cibo fuori dal raggio locale.
- Possono avere un'area di raccolta assegnata (`useAssignedArea = true`) o vagare liberamente (`useAssignedArea = false`).
- Le spedizioni consumano provviste durante il viaggio e la raccolta, e riportano il cibo al campo.

---

## Formule di raccolta

- Tasso di raccolta per cella (al secondo):

gatherRate = baseGatherRate * density * workers

text

dove `density` è la densità attuale della cella e `workers` il numero di lavoratori.

- Riduzione della densità (al secondo):

densityReduction = gatherRate * densityReductionPerFood

text

- La densità segue un decadimento esponenziale:

d(t) = d0 * exp(-k * t)  
k = workers * baseGatherRate * densityReductionPerFood

text

- La riduzione della densità avviene **solo sulla cella esatta** su cui lavorano i lavoratori (riduzione puntuale).

---

## Consumo di cibo

- **Popolazione al campo**: consuma una razione giornaliera fissa, calcolata per l'intera tribù a fine giornata:

dailyConsumption = totalPopulation * foodConsumptionPerPersonPerDay

text

- **Spedizioni in viaggio**: consumano provviste in modo continuo, proporzionalmente al tempo trascorso e con un moltiplicatore maggiore rispetto al riposo:

travelConsumptionPerSec = baseConsumptionPerSec * travelConsumptionMultiplier

text

- **Spedizioni durante la raccolta**: consumano ancora di più:

gatheringConsumptionPerSec = baseConsumptionPerSec * gatheringConsumptionMultiplier

text

- `baseConsumptionPerSec` deriva da:

baseConsumptionPerSec = foodConsumptionPerPersonPerDay / dayLengthSeconds

text

---

## Provviste per spedizioni

Le provviste assegnate a una spedizione non sono un numero fisso, ma vengono calcolate alla partenza e a ogni ripartenza. Il calcolo considera:

- Distanza da percorrere (andata e ritorno)
- Velocità di spostamento della spedizione
- Numero di lavoratori
- Margine di sicurezza per tempo di raccolta e imprevisti
  Formula:

provisionsNeeded = workerCount * travelConsumptionPerSec * (distance / expeditionSpeed * 2) * safetyMultiplier

text

Il limite principale è la capacità di carico: se le provviste calcolate superano la capacità massima, la spedizione parte con meno provviste e tornerà prima.

## Riposo dopo la spedizione

Dopo una spedizione, i lavoratori devono riposare. Il tempo di riposo è proporzionale alla durata della spedizione appena conclusa:

restDuration = tripDurationSec * restMultiplier

text

Spedizioni lunghe richiedono riposi più lunghi.
---

## Previsioni sulle celle

Per ogni cella selezionata (in modalità campo) vengono calcolati:

- **Cibo rimanente sfruttabile fino a soglia 0.25**:

foodTo25 = max(0, (density - cellWarningThreshold) / densityReductionPerFood)

text

- **Cibo rimanente teorico fino a 0**:

foodTo0 = density / densityReductionPerFood

text

- **Giorni al raggiungimento della soglia 0.25** con il ritmo attuale:

daysTo25 = (-ln(cellWarningThreshold / density) / k) / dayLengthSeconds

text

(solo se `workers > 0` e `density > cellWarningThreshold`)

- **Giorni al raggiungimento della soglia 0** con il ritmo attuale:

daysTo0 = (-ln(0.001 / density) / k) / dayLengthSeconds

text

(solo se `workers > 0`)

- **Aumento di cibo raccolto al giorno aggiungendo un lavoratore**:

increasePerDay = baseGatherRate * density * dayLengthSeconds

text

- **Giorni ridotti per raggiungere la soglia se aggiungo un lavoratore**:

reducedDays25 = daysTo25 - daysTo25_extra  
reducedDays0 = daysTo0 - daysTo0_extra

text

dove `daysTo*_extra` sono calcolati con `workers + 1`.
---

## Avvisi di soglia

- Soglia unica di avviso: `cellWarningThreshold = 0.25`.
- Quando una cella con lavoratori scende sotto la soglia, viene aggiunta alla lista `warningCells` e viene mostrato un indicatore persistente:
- In modalità camp: triangolo rosso sopra la cella.
- In modalità mappa: triangolo rosso sopra il campo.
- L'indicatore rimane finché la cella non torna sopra soglia.
- L'avviso in console viene emesso solo la prima volta che la cella scende sotto soglia.

---

## Dati giornalieri

- Durante il giorno, vengono accumulati:
- `camp.foodGatheredToday`: cibo raccolto oggi da lavoratori locali.
- `cell.foodGatheredToday`: cibo raccolto oggi da una specifica cella.
- `camp.foodConsumedToday`: cibo consumato oggi (in tempo reale, ma mostrato solo a fine giornata).
- A fine giornata:
- `camp.gatheredDaily = camp.foodGatheredToday`
- `camp.consumedDaily = consumoTotaleGiornaliero`
- `cell.gatheredDaily = cell.foodGatheredToday`
- I contatori `foodGatheredToday` vengono azzerati.
- Nel riepilogo del campo e nelle info cella vengono mostrati i valori **daily** del giorno precedente, non quelli in tempo reale.

---

## Interazioni con altri sistemi

- **Popolazione**: i lavoratori locali appartengono al Pop `gatherer` (se non esiste, viene creato al momento dell'assegnazione).
- **Mappa**: la raccolta locale è limitata alle celle entro il raggio locale. Le spedizioni possono andare oltre.
- **Tempo**: il consumo giornaliero avviene a fine giornata; le spedizioni consumano in continuo.
- **Informazione**: in futuro i dati su scorte e raccolto saranno offuscati o mediati da report.

---

## UI/UX collegata

- In modalità campo, cliccando su una cella entro il raggio locale si seleziona la cella e si mostra il pannello info con i dettagli e le previsioni.
- Bottoni `+` e `-` nel pannello `local-worker-panel` per assegnare/rimuovere lavoratori.
- Sopra ogni cella con lavoratori appare il numero di lavoratori.
- Il raggio locale è visualizzato quando il campo è selezionato.
- Triangoli rossi persistenti indicano celle sotto soglia.