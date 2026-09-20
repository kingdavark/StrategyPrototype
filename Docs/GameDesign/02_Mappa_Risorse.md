# Mappa e Risorse Naturali

## Scopo

Questo documento descrive la struttura della mappa, la griglia esagonale, i layer di densità delle risorse naturali e le regole di sfruttamento e rigenerazione. Include anche la visione futura sulla simulazione persistente a livelli di dettaglio.

---

## Griglia esagonale

La mappa è composta da una griglia di **esagoni point-top** (vertice in alto). Ogni esagono è un'unità spaziale con coordinate assiali `(q, r)`.

Misure di un esagono:

- **Raggio** (vertice-centro): ~0.577 km
- **Larghezza** (da lato a lato, orizzontale): 1 km
- **Altezza** (da vertice a vertice, verticale): ~1.155 km
- **Area**: ~0.866 km²
- **Distanza tra centri di esagoni adiacenti**: 1 km, uniforme in tutte le 6 direzioni (nessun bias diagonale)

La conversione tra pixel e km dipende da `pixelsPerKm`. Attualmente è 20, quindi l'esagono ha raggio ~11.5 px.

La mappa del prototipo è limitata a una finestra di 1280×720 pixel, che corrisponde a circa 2.300 km². Non c'è wrap-around: i bordi della mappa sono netti.

---

## Perché esagoni

La scelta della griglia esagonale deriva da tre motivi:

1. **Distanze uniformi**: ogni esagono ha 6 vicini equidistanti. Non esiste il bias diagonale dei quadrati (dove muoversi in diagonale costa `√2` volte un passo ortogonale).
2. **Realismo geometrico**: le aree di influenza (raggio locale, area di raccolta) sono più realistiche come esagoni che come rettangoli o cerchi sovrapposti a griglia quadrata.
3. **Standard 4X**: Civ V/VI e la maggior parte dei giochi Paradox usano esagoni.

---

## Proprietà di un esagono

Ogni esagono è un oggetto con le seguenti proprietà:

- `q`, `r`: coordinate assiali nella griglia esagonale
- `cx`, `cy`: coordinate del centro in pixel (derivate)
- `entities`: array di entità mobili attualmente in questo esagono
- `forageDensity`: densità di vegetazione raccoglibile (0..1)
- `forestDensity`: densità di alberi (0..1). Futuro.
- `smallGameDensity`: densità di piccola fauna terrestre (0..1). Futuro.
- `fishDensity`: densità di pesci (0..1, solo esagoni d'acqua). Futuro.
- `fertility`: fertilità del suolo (0..1, default medio). Futuro.
- `assignedWorkers`: numero di lavoratori locali assegnati all'esagono
- `urbanizedFraction`: frazione dell'esagono coperta da un settlement (0..1)
- `foodGatheredToday`: cibo raccolto da lavoratori locali oggi
- `gatheredDaily`: cibo raccolto da lavoratori locali nel giorno precedente
- `warningShown`: flag per evitare avvisi ripetuti

---

## Layer di densità

| Layer                    | Proprietà          | Descrizione                                                             |
| ------------------------ | ------------------ | ----------------------------------------------------------------------- |
| Foresta                  | `forestDensity`    | Densità di alberi. Ridotta dal taglio, rigenerazione lenta.             |
| Vegetazione raccoglibile | `forageDensity`    | Bacche, erbe, radici. Ridotta dalla raccolta, rigenerazione stagionale. |
| Piccola fauna terrestre  | `smallGameDensity` | Conigli, uccelli. Ridotta dalla caccia, rigenerazione continua.         |
| Pesci                    | `fishDensity`      | Disponibile solo in esagoni d'acqua. Ridotto dalla pesca.               |
| Fertilità                | `fertility`        | Per uso futuro (agricoltura).                                           |

---

## Biomi e risorse naturali

*(da sviluppare)*

---

## Strade e infrastrutture

*(da sviluppare)*

---

## Confini e province

*(da sviluppare)*

---

## Risorse naturali (prototipo)

### Vegetazione raccoglibile (bacche, erbe, radici)

- **Layer:** `forageDensity`
- **Sfruttamento:** raccolta manuale, riduce la densità solo dell'esagono esatto in cui lavorano i lavoratori.
- **Rigenerazione:** stagionale o continua lenta (semplificata per MVP).
- **Risorsa prodotta:** cibo vegetale.
- **Sviluppo futuro:** propedeutico all'agricoltura.

### Foresta (legna)

- **Layer:** `forestDensity`
- **Sfruttamento:** taglio con strumenti, riduce la densità dell'esagono esatto.
- **Effetto locale:** una foresta può essere disboscata solo in parte senza distruggere l'intera area.
- **Rigenerazione:** lenta e costante (in futuro influenzata da clima e stagioni).
- **Risorsa prodotta:** legna grezza, trasportata fisicamente al settlement.

### Fauna minore terrestre (conigli, uccelli, piccola selvaggina)

- **Layer:** `smallGameDensity`
- **Sfruttamento:** caccia/cattura con strumenti rudimentali, riduce la densità locale.
- **Rigenerazione:** continua, più rapida in aree con vegetazione fitta.
- **Risorsa prodotta:** cibo (carne) e eventuali pelli.
- **Sviluppo futuro:** porta a trappole, armi da caccia, domesticazione.

### Pesci (fiumi, laghi, coste)

- **Layer:** `fishDensity`
- **Distribuzione:** presente solo negli esagoni che intersecano corpi idrici; zero altrove.
- **Sfruttamento:** pesca, riduce la densità locale.
- **Rigenerazione:** continua, influenzata dalla dimensione del corpo idrico e dalle stagioni.
- **Risorsa prodotta:** cibo (pesce).
- **Sviluppo futuro:** tecniche di pesca, navigazione, commercio marittimo.

### Grandi animali (branchi mobili)

- **Modello:** unità autonome (branchi) con posizione `(x, y)`, specie e numero di capi.
- **Comportamento:** si muovono lentamente nell'habitat preferito, si riproducono se non disturbati.
- **Caccia:** i cacciatori devono avvicinarsi al branco; ogni ciclo riduce i capi e produce cibo (carne e pelli). Sotto una soglia il branco si estingue.
- **Visualizzazione:** sprite che si sposta sulla mappa.

### Fertilità del suolo

- **Layer:** `fertility` (float 0..1)
- **Utilizzo futuro:** consumata dall'agricoltura, rigenerata dal maggese.
- **Per il prototipo attuale:** layer definito ma non ancora utilizzato.

---

## Sfruttamento e riduzione della densità

La raccolta riduce la densità solo dell'esagono esatto su cui lavorano i lavoratori (riduzione puntuale).

- La quantità di cibo raccolta per secondo è proporzionale alla densità locale: esagoni ricchi rendono di più, esagoni poveri di meno.
- Formula raccolta: `gatherRate = baseGatherRate * density * workers`
- Formula riduzione densità: `densityReduction = gatherRate * densityReductionPerFood / (1 - urbanizedFraction)`
- La densità segue un decadimento esponenziale: `d(t) = d0 * exp(-k * t)`, con `k = workers * baseGatherRate * densityReductionPerFood / (1 - urbanizedFraction)`

La divisione per `(1 - urbanizedFraction)` riflette il fatto che, se un esagono è parzialmente occupato dal settlement, la raccolta avviene solo sull'area libera. A parità di cibo raccolto, la densità dell'area libera cala più rapidamente.

---

## Urbanized fraction

Ogni esagono ha un valore `urbanizedFraction` che rappresenta la frazione di area coperta da un settlement. Il calcolo avviene trattando l'esagono come un cerchio di area equivalente (raggio `R_hex_eq ≈ 1.05 * R`) e intersecandolo con il cerchio del settlement.

Risultati possibili:

- `urbanizedFraction = 0`: esagono completamente libero, raccolta al 100%.
- `urbanizedFraction = 1`: esagono interamente coperto dal settlement, non raccoglibile. I lavoratori eventualmente assegnati vengono liberati con un avviso.
- Valori intermedi: la raccolta è scalata proporzionalmente all'area libera.

---

## Rigenerazione base delle risorse

- Gli esagoni con `forageDensity` si rigenerano lentamente nel tempo.
- Un'area completamente esaurita (densità zero) impiega più tempo a iniziare a rigenerare.
- Meccanica: il giocatore non può esaurire una zona per sempre, ma deve ruotare le aree di raccolta per non restare senza cibo.
- Nota: la rigenerazione attuale è semplificata e temporanea. In futuro sarà legata alla tipologia di terreno e seguirà una curva di crescita più realistica (più rapida a densità più alte).

---

## Simulazione persistente e livelli di dettaglio (visione futura)

Il mondo deve continuare a evolversi anche fuori dalla vista del giocatore. Tuttavia, simulare ogni cella al massimo dettaglio a ogni tick è insostenibile su mappe grandi. La soluzione è una **simulazione multi-livello**:

- **Esagoni vicini al giocatore**: simulazione a ogni tick. Densità, raccolta, eventi.
- **Esagoni di interesse** (settlement di altre fazioni, eventi attivi, spedizioni in corso): tick più lenti.
- **Esagoni remoti attivi**: tick molto lenti, aggiornamenti aggregati.
- **Esagoni inattivi** (oceani, deserti, terre desolate): nessuna simulazione attiva finché non vengono toccati da un evento o da una spedizione.

Tutte le celle hanno uno stato persistente. Cambia solo la frequenza e il dettaglio della simulazione. Questa logica sarà implementata quando la mappa supererà la dimensione iniziale del prototipo.

---

## Scala variabile (visione futura)

Il mondo non può avere la stessa risoluzione ovunque. La visione è:

- **Regioni attive** (dove gioca il giocatore e i rivali): celle piccole (1 km²).
- **Regioni di interesse** (fazioni lontane, eventi globali): celle medie (25-100 km²).
- **Regioni remote** (oceani, continenti non abitati): celle grandi, simulazione aggregata.

La scelta della scala per il prototipo è **fissa a 1 km²**. La scala variabile verrà introdotta in futuro, quando la mappa crescerà oltre la dimensione iniziale.

---

## Visualizzazione

- Gli esagoni sono colorati in base alla densità di cibo con una scala a 7 colori:
  - 0.90-1.00: verde scuro
  - 0.75-0.89: verde medio
  - 0.50-0.74: verde chiaro
  - 0.25-0.49: giallo
  - 0.05-0.24: arancione
  - 0.01-0.04: rosso
  - 0.00: nessun colore (sfondo)
- L'area occupata dal settlement è evidenziata con una tinta marroncina.
- Il raggio locale del settlement è mostrato come **bordo esterno giallo** degli esagoni al confine. Solo il lato esterno degli esagoni al confine è colorato, per formare un unico grande poligono giallo attorno all'area di sfruttamento.
- I numeri sopra gli esagoni indicano i lavoratori assegnati.
- I triangoli rossi persistenti indicano esagoni sotto soglia.