# Città ed Edifici

## Scopo

Questo documento raccoglie la visione futura su città ed edifici. Non è ancora implementato nel prototipo, ma definisce la direzione di lungo termine per la parte urbana del gioco: come cresce una città, come si distribuiscono gli edifici, come interagisce con il terreno, come si espande nel territorio.

---

## Dalla tribù alla città

Nel prototipo attuale l'insediamento è chiamato "settlement" ed è una singola area occupata da una tribù nomade o semi-stanziale. Nel corso del gioco, con la progressione storica e tecnologica, il settlement diventa **città**, poi **grande città**, poi **metropoli**.

La differenza non è solo dimensionale, ma qualitativa:

- Una tribù occupa un'area piccola, con strutture temporanee (tende, ripari).
- Un villaggio ha case stabili, magazzini, spazi comuni.
- Una città ha edifici specializzati, più piani, quartieri.
- Una metropoli ha grattacieli, infrastrutture, densità estrema.

---

## Crescita della città

### Come cresce

La città cresce in **area occupata**, misurata in km². Per il prototipo la crescita è lineare:

`areaCittaKm2 = popolazione * settlementGrowthPerPerson`

con `settlementGrowthPerPerson` (default 0.001 km²/persona) e area minima `settlementMinAreaKm2` (default 0.01 km²).

### Come si espande

La città parte da un punto e si espande nel territorio circostante. Per il prototipo la forma è approssimata a un cerchio di raggio `√(area/π)`. In futuro la forma sarà **plasmata dal terreno** e **indirizzata dal giocatore**.

### Fattori che influenzano la crescita (futuri)

La crescita non sarà uniforme in tutte le direzioni. Sarà plasmata da:

- **Terreno**: la città non cresce sull'acqua (a meno di costruzioni speciali come Venezia). Cresce più velocemente in pianura, più lentamente su colline e montagne.
- **Strade**: la presenza di strade accelera la crescita lungo di esse.
- **Risorse**: la vicinanza a risorse preziose (miniere, terreni fertili, porti) può indirizzare la crescita.
- **Volontà del giocatore**: il giocatore potrà **prioritizzare** la crescita verso una direzione specifica (es. "cresci verso est, verso quella foresta"). Questo è un comando futuro.
- **Ostacoli naturali**: fiumi, laghi, montagne bloccano o rallentano la crescita.

### Edifici inglobati, non distrutti

Quando la città si espande, non distrugge gli elementi esistenti (miniere, foreste, campi coltivati, altri insediamenti minori). Li **ingloba**. Un elemento inglobato continua a esistere come parte della città, con la sua funzione.

- Una miniera inglobata continua a produrre.
- Un campo coltivato inglobato continua a essere coltivabile.
- Un piccolo villaggio inglobato diventa un quartiere della città.

Questo è diverso dall'approccio "distruggi e ricostruisci": la città è un organismo che cresce **attorno** alle cose, non **al posto** delle cose.

---

## Edifici

### Cosa sono

Gli edifici sono strutture costruite dalla popolazione all'interno della città. Occupano **spazio** e forniscono **funzioni**:

- **Abitazioni**: case, palazzi, grattacieli. Forniscono spazio abitativo per la popolazione.
- **Magazzini**: depositi per risorse e beni.
- **Edifici produttivi**: laboratori, officine, fabbriche.
- **Edifici civici**: templi, piazze, edifici amministrativi.
- **Infrastrutture**: strade, mura, acquedotti.

### Coefficiente di spazio

Ogni edificio occupa una certa **quantità di spazio** all'interno della cella (o della città). Il coefficiente di spazio può essere:

- **Fisso** per tipo (es. una casa occupa 1 unità, un magazzino 2 unità).
- **Variabile** con il livello (es. un grattacielo occupa più spazio in altezza ma non in pianta).
- **Efficiente nel tempo**: gli edifici moderni (palazzi, grattacieli) forniscono più abitazioni per unità di spazio occupato.

### Spazio interno della cella

Ogni cella (esagono) della mappa ha una **capacità di spazio interno** (es. 100 unità). Quando la città cresce e consuma spazio, gli edifici si distribuiscono nelle celle disponibili.

Quando lo spazio di una cella è esaurito, la città inizia a costruire in una cella adiacente. Il giocatore può (in futuro) decidere dove prioritizzare la crescita.

### Piani e densità

Un concetto futuro importante: gli edifici possono avere **piani** e **densità variabile**. Un grattacielo di 50 piani occupa la stessa pianta di una casa di 1 piano, ma ospita 50 volte più persone.

Questo cambia radicalmente la crescita urbana:

- **Città pre-moderna**: edifici bassi (2-3 piani), densità media.
- **Città industriale**: edifici più alti, densità alta.
- **Metropoli moderna**: grattacieli, densità estrema.

Per il prototipo, questo è rimandato. Ma va tenuto presente perché definisce come la città "cresce" nel tempo: con l'evoluzione tecnologica, gli stessi km² ospitano più persone.

---

## Città vs settlement

Il termine "settlement" nella documentazione attuale è generico: vale sia per una tribù nomade, sia per una città moderna. Per chiarezza:

- **Settlement** = insediamento umano di qualunque tipo. Termine neutro.
- **Tribù** = settlement nomade o semi-stanziale dell'Era 0.
- **Villaggio** = settlement stanziale piccolo (Era 1-2).
- **Città** = settlement grande con specializzazione (Era 2-4).
- **Metropoli** = settlement molto grande con edifici ad alta densità (Era 5+).

Nel codice, per ora, si usa "settlement" come nome unico.

---

## Modello a due livelli (visione futura)

### Il problema

Simulare ogni edificio di ogni città del mondo a livello di singola cella è insostenibile. Eppure, il giocatore vuole vedere il dettaglio locale (quartieri, edifici, strade).

### La soluzione

Un modello a **due livelli di dettaglio**:

- **Livello mondo**: la mappa globale di esagoni. Ogni esagono ha statistiche aggregate (popolazione, area occupata, livello di urbanizzazione).
- **Livello locale**: quando il giocatore "apre" una cella, si genera una **mappa dettagliata** con edifici, strade, quartieri. Questa mappa è generata proceduralmente o derivata da dati aggregati.

Il giocatore vede la stessa mappa continua, ma la simulazione è aggregata dove serve e dettagliata dove il giocatore guarda.

### Cosa rimane persistente

- Le statistiche aggregate di ogni esagono (popolazione, area occupata, tipo di edifici principali) sono persistenti.
- La mappa dettagliata della città è generata al volo quando serve, in modo deterministico (stesso seed = stessa mappa).
- Le modifiche del giocatore (es. costruzione manuale di un edificio) sono persistite come delta rispetto alla generazione procedurale.

### Livelli di dettaglio

- **Esagoni remoti**: solo statistiche aggregate. Nessuna mappa locale.
- **Esagoni di interesse** (fazioni rivali, eventi): statistiche aggregate + qualche dato locale.
- **Esagoni vicini al giocatore**: mappa locale dettagliata, simulazione a tick frequenti.

---

## Note per lo sviluppo

- Il sistema di edifici non è ancora implementato. Arriverà con l'Era 1 (stanzialità e agricoltura primitiva), quando avremo magazzini, falegnamerie e prime case.
- La logica dello spazio interno delle celle sarà affrontata quando la città inizierà a occupare più di una cella.
- Il modello a due livelli è una visione di lungo termine, non del prototipo.
- La crescita plasmata dal terreno e indirizzata dal giocatore è una visione di medio termine.

---

## Interazioni con altri sistemi

- **Popolazione**: la popolazione abita gli edifici. La capacità abitativa determina la crescita demografica.
- **Risorse**: gli edifici consumano risorse per essere costruiti e mantenuti.
- **Tecnologia**: nuove tecnologie sbloccano nuovi tipi di edifici.
- **Mondo simulato**: eventi (incendi, epidemie, guerre) possono danneggiare gli edifici.
- **Informazione**: il giocatore vede gli edifici solo se sono nel suo raggio visivo o se riceve report.
