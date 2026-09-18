# Mappa e Risorse Naturali

## Scopo

Questo documento descrive la struttura della mappa continua, la griglia spaziale nascosta, i layer di densità delle risorse naturali e le regole di sfruttamento e rigenerazione.

---

## Mappa continua senza griglia visibile

- Il mondo è uno spazio continuo, senza esagoni o province predefinite.
- Il territorio è definito dall'uso effettivo: una foresta che usi è "tua" finché nessuno te la contesta.
- Con il progresso diplomatico si possono tracciare confini.
- Le strade accelerano il movimento.
- La suddivisione interna in province è manuale (decidi tu come organizzare l'impero).

---

## Griglia spaziale nascosta

- Internamente il mondo utilizza una griglia uniforme (**spatial hash**) per ottimizzare le query spaziali e memorizzare i dati di densità.
- **Celle della griglia:** quadrate, di dimensione fissa (es. `CELL_SIZE` pixel). Ogni cella ha coordinate intere `(cx, cy)`.
- **Scopi della griglia:**
  1. Query spaziali rapide: trovare entità vicine a una posizione senza scorrere tutti gli oggetti.
  2. Memorizzare densità di risorse naturali: foreste, vegetazione, piccola fauna, pesci, fertilità.
- **Natura fluida:** la griglia non impone vincoli al movimento o alla forma del territorio. I confini delle aree di risorsa emergono naturalmente dai valori di densità.

### Proprietà di una cella

Ogni cella contiene:

- `cx`, `cy`: coordinate intere nella griglia
- `entities`: array di entità mobili attualmente in questa cella
- `forageDensity`: densità di vegetazione raccoglibile (0..1)
- `forestDensity`: densità di alberi (0..1)
- `smallGameDensity`: densità di piccola fauna terrestre (0..1)
- `fishDensity`: densità di pesci (0..1, solo in celle d'acqua)
- `fertility`: fertilità del suolo (0..1, default medio)
- `assignedWorkers`: numero di lavoratori locali assegnati alla cella
- `foodGatheredToday`: cibo raccolto da lavoratori locali oggi
- `gatheredDaily`: cibo raccolto da lavoratori locali ieri
- `warningShown`: flag per evitare avvisi ripetuti

---

## Layer di densità previsti (MVP)

| Layer                    | Proprietà          | Descrizione                                                             |
| ------------------------ | ------------------ | ----------------------------------------------------------------------- |
| Foresta                  | `forestDensity`    | Densità di alberi. Ridotta dal taglio, rigenerazione lenta.             |
| Vegetazione raccoglibile | `forageDensity`    | Bacche, erbe, radici. Ridotta dalla raccolta, rigenerazione stagionale. |
| Piccola fauna terrestre  | `smallGameDensity` | Conigli, uccelli. Ridotta dalla caccia, rigenerazione continua.         |
| Pesci                    | `fishDensity`      | Disponibile solo in celle d'acqua. Ridotto dalla pesca.                 |
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
- **Sfruttamento:** raccolta manuale, riduce la densità solo nella cella esatta in cui lavorano i lavoratori.
- **Rigenerazione:** stagionale o continua lenta (semplificata per MVP).
- **Risorsa prodotta:** cibo vegetale.
- **Sviluppo futuro:** propedeutico all'agricoltura.

### Foresta (legna)

- **Layer:** `forestDensity`
- **Sfruttamento:** taglio con strumenti, riduce la densità nella cella esatta e possibilmente nelle celle adiacenti (da decidere).
- **Effetto locale:** una foresta può essere disboscata solo in parte senza distruggere l'intera area.
- **Rigenerazione:** lenta e costante (in futuro influenzata da clima e stagioni).
- **Risorsa prodotta:** legna grezza, trasportata fisicamente all'accampamento.

### Fauna minore terrestre (conigli, uccelli, piccola selvaggina)

- **Layer:** `smallGameDensity`
- **Sfruttamento:** caccia/cattura con strumenti rudimentali, riduce la densità locale.
- **Rigenerazione:** continua, più rapida in aree con vegetazione fitta.
- **Risorsa prodotta:** cibo (carne) e eventuali pelli.
- **Sviluppo futuro:** porta a trappole, armi da caccia, domesticazione.

### Pesci (fiumi, laghi, coste)

- **Layer:** `fishDensity`
- **Distribuzione:** presente solo nelle celle che intersecano corpi idrici; zero altrove.
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

- La raccolta riduce **solo** la densità della cella su cui lavorano i lavoratori (riduzione puntuale).
- La quantità di cibo raccolta per secondo è proporzionale alla densità locale: zone ricche rendono di più, zone povere di meno.
- Formula raccolta: `gatherRate = baseGatherRate * density * workers`
- Formula riduzione densità: `densityReduction = gatherRate * densityReductionPerFood`
- La densità segue un decadimento esponenziale: `d(t) = d0 * exp(-k * t)`, con `k = workers * baseGatherRate * densityReductionPerFood`.

---

## Rigenerazione base delle risorse

- Le celle con `forageDensity` si rigenerano lentamente nel tempo (es. una piccola frazione al giorno).
- Una zona completamente esaurita (densità zero) impiega più tempo a iniziare a rigenerare.
- Meccanica: il giocatore non può esaurire una zona per sempre, ma deve ruotare le aree di raccolta per non restare senza cibo.
- Nota: la rigenerazione attuale è semplificata e temporanea. In futuro sarà legata alla tipologia di terreno e seguirà una curva di crescita più realistica (più rapida a densità più alte).

---

## Visualizzazione

- Le celle sono colorate in base alla densità di cibo con una scala a 7 colori:
  - 0.90-1.00: verde scuro
  - 0.75-0.89: verde medio
  - 0.50-0.74: verde chiaro
  - 0.25-0.49: giallo
  - 0.05-0.24: arancione
  - 0.01-0.04: rosso
  - 0.00: nessun colore (sfondo)
- Il raggio locale del campo è mostrato quando il campo è selezionato.
- I numeri sopra le celle indicano i lavoratori assegnati.
- I triangoli rossi persistenti indicano celle sotto soglia.