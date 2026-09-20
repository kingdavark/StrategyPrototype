# js/world.js

## Scopo

Gestisce la griglia spaziale esagonale (point-top, via plugin rexBoard), i layer di densità delle risorse naturali e le funzioni di query e modifica delle celle. È il modulo che rappresenta la mappa continua a livello di dati.

La griglia non impone vincoli al movimento o alla forma del territorio: i confini delle aree di risorsa emergono dai valori di densità.

## Struttura dati

Il mondo è suddiviso in una griglia di esagoni point-top (vertice in alto), con layout `staggeraxis 'x'`, `staggerindex 'odd'`. La dimensione della cella nel mondo è definita da `GameConfig.hexCenterDistanceKm` (distanza tra centri adiacenti, in km); la dimensione visiva da `GameConfig.pixelsPerKm`.

Ogni cella è un oggetto con le seguenti proprietà:

- `cx`, `cy` – coordinate assiali della cella nella griglia esagonale (`cx` = colonna q, `cy` = riga r).
- `entities` – array di entità mobili (pop, branchi) attualmente in questa cella. Attualmente sempre vuoto.
- `forageDensity` – densità di vegetazione raccoglibile (0..1).
- `forestDensity` – densità di alberi (0..1). Futuro.
- `smallGameDensity` – densità di piccola fauna terrestre (0..1). Futuro.
- `fishDensity` – densità di pesci (0..1, solo celle d'acqua). Futuro.
- `fertility` – fertilità del suolo (0..1, default medio). Futuro.
- `assignedWorkers` – numero di lavoratori locali assegnati alla cella.
- `foodGatheredToday` – cibo raccolto da lavoratori locali oggi (accumulato durante il giorno).
- `gatheredDaily` – cibo raccolto da lavoratori locali nel giorno precedente.
- `warningShown` – flag per evitare avvisi ripetuti in console.
- `urbanizedFraction` – frazione della cella coperta da un settlement (0..1).
- `urbanizationWarningShown` – flag per evitare avvisi ripetuti in console quando una cella totalmente urbanizzata ha lavoratori assegnati.

La griglia è memorizzata in un array 2D (`grid`), indicizzato con le coordinate tile `grid[cy][cx]` (la tile `(cx, cy)` è il q/r dell'esagono). Le chiavi stringa `"cx,cy"` (equivalente `"q,r"`) restano usate da `main.js` e `debug.js` per i testi e i warning.

## Costanti derivate

Queste costanti sono definite all'avvio dello script e non cambiano durante la sessione. Per applicare modifiche a `hexCenterDistanceKm`, `pixelsPerKm`, `worldWidth` o `worldHeight` è necessario ricaricare la pagina.

- `HEX_RADIUS_PX = getHexRadiusPx()` (vertice-centro ≈ 11.55 px)
- `HEX_WIDTH_PX = hexCenterDistanceKm * pixelsPerKm` (lato-a-lato = 1 km)
- `HEX_HEIGHT_PX = 2 * HEX_RADIUS_PX` (vertice-a-vertice = 2/√3 km)
- `HEX_VERTICAL_SPACING_PX = HEX_HEIGHT_PX * 0.75` (spaziatura tra righe per point-top)
- `GRID_COLS = Math.ceil(worldWidth / HEX_WIDTH_PX) + 1`
- `GRID_ROWS = Math.ceil(worldHeight / HEX_VERTICAL_SPACING_PX) + 1`

## Funzioni principali

### initHexBoard(scene)

Crea la griglia e la board esagonale rexBoard (`scene.rexBoard.add.hexagonGrid(...)` con `size: HEX_RADIUS_PX`, `staggeraxis: 'x'`, `staggerindex: 'odd'`) e la board (`scene.rexBoard.add.board(...)`). Assegna i riferimenti globali `hexGrid` e `hexBoard`. Deve essere chiamata una sola volta, in fase di `create()`.

### worldToCell(worldX, worldY)

Wrapper sopra `hexBoard.worldXYToTileXY`. Converte coordinate mondo (pixel) in coordinate tile esagonali. Restituisce un oggetto `{ cx, cy }` (con `cx` = q, `cy` = r).

### cellToWorld(cx, cy)

Wrapper sopra `hexBoard.tileXYToWorldXY`. Converte coordinate tile esagonali nel centro (in pixel) della cella. Restituisce un oggetto `{ x, y }`.

### getCell(cx, cy)

Restituisce l'oggetto cella alle coordinate date. Se la cella non esiste, la crea con valori di default (densità 0, nessun lavoratore, nessun flag). Le celle vengono create in modo lazy, ma all'avvio `createGrid()` popola tutte le celle della griglia.

### createGrid(scene)

Chiama `initHexBoard(scene)` e poi popola tutte le celle della griglia chiamando `getCell` per ogni coordinata. Viene chiamata una sola volta in fase di `create()` (dalla scena Phaser in `main.js`).

### initializeForageDensity()

Popola i valori iniziali di `forageDensity` creando alcune patch circolari con densità decrescente dal centro verso il bordo. Usa una funzione interna `setPatch(centerCX, centerCY, radiusCells, peakDensity)` che applica un falloff lineare; la distanza è misurata in pixel tra i centri degli esagoni (via `cellToWorld`). Viene chiamata in fase di `create()`.

I valori di default definiscono cinque patch di densità diverse, per avere un ambiente iniziale vario.

### getEntitiesInRadius(worldX, worldY, radius)

Restituisce le entità mobili entro un raggio da una posizione. Attualmente restituisce sempre un array vuoto: sarà implementata quando ci saranno entità che occupano celle (branchi, pop locali con posizione).

### reduceCellDensity(cell, amount)

Riduce la densità di una singola cella senza decadimento radiale. Usata dalla raccolta di risorse (sia locale che dalle spedizioni).

- Prende in input un oggetto `cell` (ottenuto da `getCell`) e un `amount` positivo.
- Sottrae `amount` da `cell.forageDensity` e clampa il risultato tra 0 e 1.
- Non tocca altre celle.

Questa funzione è stata scelta al posto di `modifyDensity` per la raccolta puntuale: evita di consumare risorse di celle vicine in modo non voluto. La logica di riduzione puntuale garantisce che il cibo venga prelevato solo dove viene effettivamente raccolto.

### circleCircleOverlapArea(r1, r2, d)

Calcola l'area di sovrapposizione tra due cerchi di raggi `r1` e `r2` con distanza tra i centri `d`, usando la formula standard di intersezione cerchio-cerchio (con clamp degli argomenti di `acos` a [-1,1]).

### circleIntersectionFraction(rSettlement, rHex, d)

Restituisce la frazione di un esagono (trattato come cerchio equivalente di raggio `rHex`) coperta dal cerchio del settlement (raggio `rSettlement`), con distanza tra i centri `d`. Gestisce i quattro casi: esagono completamente coperto (1), nessuna sovrapposizione (0), settlement completamente interno (`area_settlement / area_hex`), sovrapposizione parziale (`overlap / area_hex`).

### updateUrbanizedFractions(population)

Ricalcola `urbanizedFraction` per ogni cella della griglia in base al cerchio del settlement. Riceve la popolazione come parametro (da cui deriva il raggio del settlement con `getSettlementRadiusKm`). Tratta ogni esagono come un cerchio equivalente di raggio `R_hex_eq = HEX_RADIUS_PX / pixelsPerKm * 1.05`. Viene chiamata da `main.js` solo quando cambia la popolazione del settlement.

### modifyDensity(worldX, worldY, layer, amount, impactRadius)

**Funzione attualmente commentata nel codice.** Modifica la densità del layer indicato nelle celle intorno alla posizione, con decadimento radiale lineare. È riservata a futuri effetti ad area (incendi, disboscamento diffuso, fertilizzanti). Non è usata dalla raccolta.

## Layer di densità attuali

- **Foresta** (`forestDensity`) – densità di alberi. Ridotta dal taglio, rigenerazione lenta. Non ancora implementata.
- **Vegetazione raccoglibile** (`forageDensity`) – bacche, erbe, radici. Ridotta dalla raccolta, rigenerazione stagionale. È il layer attivo nel prototipo.
- **Piccola fauna terrestre** (`smallGameDensity`) – conigli, uccelli. Ridotta dalla caccia, rigenerazione continua. Non ancora implementata.
- **Pesci** (`fishDensity`) – disponibile solo in celle d'acqua. Ridotto dalla pesca. Non ancora implementato.
- **Fertilità** (`fertility`) – per uso futuro (agricoltura). Definito ma non utilizzato.

## Parametri GameConfig usati

- `hexCenterDistanceKm`, `pixelsPerKm` – per calcolare le costanti geometriche dell'esagono (`HEX_RADIUS_PX`, `HEX_WIDTH_PX`, ecc.).
- `worldWidth`, `worldHeight` – per calcolare `GRID_COLS` e `GRID_ROWS`.
- `getHexRadiusPx()` (da `config.js`) – per `HEX_RADIUS_PX`.
- `pixelsPerKm` – anche per calcolare `R_hex_eq` e convertire le distanze in km in `updateUrbanizedFractions`.
- `getSettlementRadiusKm()` (da `config.js`) – per il raggio del settlement; usa indirettamente `settlementMinAreaKm2` e `settlementGrowthPerPerson`.

Il resto dei parametri di raccolta (`baseGatherRate`, `densityReductionPerFood`) è usato da `main.js` e `units.js`, non da questo script.

## Stato globale modificato

- `grid`: array 2D di celle.
- Le celle hanno proprietà `forageDensity`, `assignedWorkers`, `foodGatheredToday`, `gatheredDaily`, `warningShown` che vengono modificate da questo script e da altri.

## Dipendenze in ingresso

- `js/config.js` – per `GameConfig.hexCenterDistanceKm`, `pixelsPerKm`, `worldWidth`, `worldHeight` e `getHexRadiusPx()`.
- Plugin rexBoard (caricato da `main.js`) – fornisce `hexagonGrid`, `board`, e le conversioni `worldXYToTileXY` / `tileXYToWorldXY`.
- `js/units.js` – usa `getCell`, `worldToCell`, `cellToWorld`, `reduceCellDensity` per la raccolta delle spedizioni.
- `js/main.js` – usa `getCell`, `cellToWorld`, `worldToCell`, `hexBoard` per il rendering della griglia, la raccolta locale e le previsioni. Chiama `createGrid(scene)` e `initializeForageDensity()` in fase di `create()`.
- `js/debug.js` – usa `getCell` per l'assegnazione e rimozione dei lavoratori locali.

## Dipendenze in uscita

- `js/config.js` – per `getHexRadiusPx()` (usata all'avvio per `HEX_RADIUS_PX`) e `getSettlementRadiusKm()` (in `updateUrbanizedFractions`).
- Plugin rexBoard – per la costruzione di griglia/board e le conversioni di coordinate.
- `Math` nativo.

Nota: `updateUrbanizedFractions` legge la posizione del settlement dalla globale `settlement.x`/`settlement.y` (dato definito in `units.js`), senza chiamare funzioni di `units.js` (la popolazione è passata come parametro), per evitare una dipendenza circolare.

## Note per modifiche

- La creazione delle celle è lazy, ma `createGrid()` le popola tutte all'avvio, quindi la lazy serve solo come sicurezza.
- I valori di densità sono float tra 0 e 1. La funzione `reduceCellDensity` garantisce che non scendano mai sotto 0 né superino 1.
- La ricerca di celle con densità avviene tramite iterazione sulle coordinate della griglia e test di distanza con `Phaser.Math.Distance.Between`. Il loop può iterare su un rettangolo di celle, ma ogni cella deve essere testata con la distanza circolare dal centro.
- Se si modificano le dimensioni della griglia (`hexCenterDistanceKm`, `pixelsPerKm`, `worldWidth`, `worldHeight`), è necessario ricaricare la pagina.
- Se si aggiungono nuovi layer di densità (es. `forestDensity`), aggiornare la struttura cella in `getCell()` e le funzioni di rendering in `main.js`.
- Se una modifica cambia la firma di una funzione pubblica (`getCell`, `worldToCell`, `cellToWorld`, `reduceCellDensity`, `createGrid`, `initHexBoard`, `initializeForageDensity`), aggiornare i documenti Technical degli script che le usano (`03_Units.md`, `04_Main.md`, `05_Debug.md`).