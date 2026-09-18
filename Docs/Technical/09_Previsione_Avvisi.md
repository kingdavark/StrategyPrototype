# Previsioni e Avvisi

## Scopo

Questo documento descrive i sistemi di previsione delle celle di raccolta e gli avvisi persistenti quando una cella scende sotto la soglia critica. Include le formule utilizzate, la logica di calcolo e la visualizzazione.

## Modello di riduzione densità

La raccolta di cibo da una cella riduce la densità solo della cella esatta, non delle celle vicine. La riduzione è proporzionale al cibo raccolto.

Tasso di raccolta (per secondo, per cella):

$$
gatherRate = baseGatherRate * density * workers
$$

Riduzione di densità (per secondo):

$$
densityReduction = gatherRate * densityReductionPerFood
$$

Sostituendo, la variazione di densità nel tempo è:

$$
d(density)/dt = -workers * baseGatherRate * densityReductionPerFood * density
$$

Questa è un'equazione differenziale ordinaria di primo ordine con soluzione esponenziale:

$$
d(t) = d0 * exp(-k * t)
k = workers * baseGatherRate * densityReductionPerFood
$$

dove `d0` è la densità iniziale e `t` è il tempo in secondi reali.

## Soglie di riferimento

- `cellWarningThreshold = 0.25` (default, configurabile): soglia sotto la quale la cella entra in stato di warning.

- Soglia 0 (usata per il calcolo di "giorni a 0"): viene usato il valore `0.001` come approssimazione di "vuoto" perché la funzione logaritmo non è definita a 0.

## Calcolo dei giorni alle soglie

Per calcolare il tempo necessario a passare da una densità `d` a una soglia `S`:

text

t(S) = -ln(S / d) / k

dove `k = workers * baseGatherRate * densityReductionPerFood` e `t` è in secondi reali. Per ottenere i giorni di gioco:

text

days = t(S) / dayLengthSeconds

Quindi:

text

daysTo25 = (-ln(cellWarningThreshold / d) / k) / dayLengthSeconds
daysTo0 = (-ln(0.001 / d) / k) / dayLengthSeconds

Se `workers === 0` o `d <= soglia`, i giorni non sono calcolabili (restituiscono 0 o ∞ a seconda del contesto).

## Calcolo con un lavoratore in più

Con `workers + 1` lavoratori, il nuovo coefficiente `k2` è:

text

k2 = (workers + 1) * baseGatherRate * densityReductionPerFood

I giorni corrispondenti sono:

text

daysTo25_extra = (-ln(cellWarningThreshold / d) / k2) / dayLengthSeconds
daysTo0_extra = (-ln(0.001 / d) / k2) / dayLengthSeconds

I giorni ridotti (cioè quanto tempo si risparmia aggiungendo un lavoratore) sono:

text

reducedDays25 = max(0, daysTo25 - daysTo25_extra)
reducedDays0 = max(0, daysTo0 - daysTo0_extra)

## Cibo rimanente

Oltre ai giorni, vengono calcolati due valori di cibo rimanente.

Cibo rimanente fino a soglia 0.25:

text

foodTo25 = max(0, (d - cellWarningThreshold) / densityReductionPerFood)

Cibo rimanente teorico fino a 0:

text

foodTo0 = d / densityReductionPerFood

Questi valori rappresentano il cibo raccoglibile prima di raggiungere le soglie, ipotizzando la stessa efficienza attuale. Il cibo raccolto per unità di densità rimossa è `1 / densityReductionPerFood`.

## Cibo raccolto in più al giorno

Con un lavoratore in più, il cibo raccolto al giorno aumenta di:

text

increasePerDay = baseGatherRate * d * dayLengthSeconds

Nota: questo è il tasso al momento attuale, con la densità corrente. Man mano che la densità scende, anche questo valore diminuisce.

## Riepilogo campo

Quando il campo è selezionato (senza cella specifica), vengono calcolati valori aggregati su tutte le celle entro il raggio locale del campo.

Per ogni cella `i` entro il raggio:

text

foodTo25Total += max(0, (d_i - cellWarningThreshold) / densityReductionPerFood)
foodTo0Total += d_i / densityReductionPerFood

Questo include anche le celle non lavorate, perché rappresentano il potenziale totale dell'area locale.

## Soglia di warning

- La soglia unica è `GameConfig.cellWarningThreshold` (default 0.25).

- Quando la densità di una cella con `assignedWorkers > 0` scende sotto la soglia:
  
  - Viene impostato `cell.warningShown = true` (per evitare avvisi ripetuti in console).
  
  - La chiave `"cx,cy"` viene aggiunta all'array `warningCells`.
  
  - Viene emesso un `console.warn` con coordinate e densità.

- Quando la densità risale sopra la soglia:
  
  - Viene reimpostato `cell.warningShown = false`.
  
  - La chiave viene rimossa da `warningCells`.

## Visualizzazione dei warning

I warning sono persistenti e vengono ridisegnati ogni frame dalla funzione `updateWarningIndicators()`.

- In modalità camp (`gameState === 'camp'`): per ogni chiave in `warningCells`, viene disegnato un triangolo rosso sopra la cella, centrato orizzontalmente sulla cella e posizionato 10 pixel sopra il centro.

- In modalità mappa (`gameState === 'map'`): se `warningCells.length > 0`, viene disegnato un triangolo rosso sopra il campo, indicando che ci sono celle in warning.

I triangoli sono disegnati con `warningGraphics.fillTriangle(x, y, x - 5, y - 10, x + 5, y - 10)` e colore `0xff0000` pieno.

## Integrazione con il game loop

- `updateLocalGathering(deltaSec)` accumula cibo e controlla la soglia per ogni cella con lavoratori.

- `updateWarningIndicators()` viene chiamata ogni frame in `update()` dopo `drawPops()` e `drawCamp()`.

- A fine giornata, `update()` salva `gatheredDaily` e `consumedDaily` e resetta i contatori giornalieri.

## Note e limiti

- L'approssimazione esponenziale assume che `k` sia costante. In realtà `k` dipende da `density`, ma la formula esponenziale è esatta perché l'ODE è lineare in `density`.

- La soglia 0.001 per "vuoto" è arbitraria ma coerente per dare numeri finiti.

- Se `workers === 0`, i giorni alle soglie non vengono mostrati (viene mostrato `∞` nel pannello).

- Se `density <= cellWarningThreshold`, il calcolo dei giorni a 25% restituisce 0 o viene omesso.

- I valori di "cibo rimanente" sono una stima basata sulla densità attuale e non tengono conto della rigenerazione (non ancora implementata).

## Interazioni con altri moduli

- `config.js`: fornisce `baseGatherRate`, `densityReductionPerFood`, `cellWarningThreshold`, `dayLengthSeconds`.

- `world.js`: fornisce le celle e `reduceCellDensity`.

- `main.js`: calcola previsioni, aggiorna `warningCells`, disegna i triangoli.

- `debug.js`: può modificare i parametri di soglia e raccolta in tempo reale.