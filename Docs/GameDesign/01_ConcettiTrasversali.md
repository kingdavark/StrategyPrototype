# Concetti Trasversali

## Scopo

Questo documento raccoglie i concetti condivisi tra tutti i sistemi di gioco. Serve come riferimento rapido per comprendere le entità principali, la terminologia e le relazioni generali tra i moduli.

---

## Loop di gioco minimo

1. Osservi la mappa 2D con il tuo insediamento (settlement).
2. Selezioni un gruppo di persone e le assegni a un compito (raccogliere cibo, cacciare, raccogliere legna).
3. Il gruppo si sposta in tempo reale, consuma cibo durante il viaggio, raggiunge la risorsa, la sfrutta, torna.
4. La risorsa arriva all'insediamento: è disponibile per sfamare o costruire.
5. Puoi mettere in pausa per ripianificare o accelerare per vedere gli effetti nel tempo.

---

## Entità principali

### Settlement (Insediamento)

- È il punto di riferimento della tribù. Nel prototipo attuale si chiama "campo" o "accampamento"; diventerà una città con il progresso del gioco. Nella documentazione usiamo il termine "settlement" per coerenza a lungo termine.
- Contiene le scorte di cibo e la popolazione non assegnata.
- Ha un'area occupata (per ora circolare, in futuro plasmata dal terreno) che cresce con la popolazione.
- Ha un raggio locale entro il quale i lavoratori possono essere assegnati direttamente alle celle esagonali per la raccolta.
- Può essere selezionato per gestire la raccolta locale e vedere il riepilogo giornaliero.

### Pop (Gruppo di persone)

- Un Pop rappresenta un insieme di individui con le stesse caratteristiche (occupazione, cultura, religione, status, etnia).
- Per il prototipo attuale esiste solo il Pop `gatherer` (raccoglitori).
- Ogni Pop ha:
  - `totalWorkers`: numero totale di individui appartenenti al Pop.
  - `availableWorkers`: lavoratori disponibili al settlement, pronti per essere assegnati a spedizioni o compiti locali.
  - `assignedWorkers`: lavoratori attualmente in spedizione.
  - `localWorkers`: lavoratori assegnati alla raccolta locale nelle celle attorno al settlement.
- I lavoratori non tornano automaticamente al pool `unassignedPopulation`; serve un'azione esplicita del giocatore.

### Expedition (Spedizione)

- Un gruppo mobile di lavoratori prelevati da un Pop.
- Ha uno stato (`travellingToArea`, `gathering`, `returningToSettlement`, `resting`, `movingToCell`).
- Ha un inventario con cibo raccolto e provviste.
- Può avere un'area di raccolta assegnata o vagare liberamente (modalità automatica).
- Consuma provviste durante il viaggio e la raccolta.
- Dopo il rientro, i lavoratori rientrano nel Pop e la spedizione riposa prima di ripartire.

### Hex (Cella esagonale)

- Unità spaziale della griglia esagonale.
- Ogni esagono ha un centro, un raggio (vertice-centro) e un'area.
- La distanza tra i centri di esagoni adiacenti è uniforme in tutte le direzioni (nessun bias diagonale).
- Contiene valori di densità per risorse naturali (es. `forageDensity`), e un valore `urbanizedFraction` che indica quanta parte dell'esagono è coperta da un settlement.
- Tiene traccia del cibo raccolto oggi (`foodGatheredToday`) e del cibo raccolto ieri (`gatheredDaily`).

### Branchi (Herd)

- Entità mobili di grandi animali (es. cervi, bisonti).
- Hanno specie, numero di capi, habitat preferito.
- Si muovono lentamente nell'habitat e si riproducono se non disturbati.
- La caccia riduce il numero di capi e produce carne e pelli.
- Se scendono sotto una soglia, si estinguono localmente.

---

## Griglia esagonale

La mappa è composta da una griglia di esagoni point-top (vertice in alto). Ogni esagono rappresenta un'area di riferimento con distanza tra centri adiacenti pari a 1 km.

- **Raggio** (vertice-centro): ~0.577 km
- **Larghezza** (lato a lato): 1 km
- **Altezza** (vertice a vertice): ~1.155 km
- **Area**: ~0.866 km²
- **Distanza tra centri adiacenti**: 1 km, uniforme in tutte le 6 direzioni

La conversione in pixel dipende dal parametro `pixelsPerKm`. Attualmente è 20 (l'esagono ha raggio ~11.5 px).

---

## Risorse naturali

Le risorse naturali sono rappresentate come layer di densità distribuiti sugli esagoni.

| Layer              | Descrizione                                      |
| ------------------ | ------------------------------------------------ |
| `forageDensity`    | Vegetazione raccoglibile (bacche, erbe, radici). |
| `forestDensity`    | Alberi per legna.                                |
| `smallGameDensity` | Piccola fauna terrestre (conigli, uccelli).      |
| `fishDensity`      | Pesci, solo in celle d'acqua.                    |
| `fertility`        | Fertilità del suolo per futura agricoltura.      |

La raccolta riduce la densità solo dell'esagono esatto su cui lavorano i lavoratori.

---

## Urbanized fraction

Ogni esagono ha un valore `urbanizedFraction` (tra 0 e 1) che rappresenta quanta parte dell'esagono è coperta da un settlement.

- `urbanizedFraction = 0`: esagono libero, raccolta al 100%.
- `urbanizedFraction = 1`: esagono interamente coperto da settlement, non raccoglibile.
- Valori intermedi: la raccolta è scalata proporzionalmente all'area libera.

Il calcolo avviene trattando l'esagono come cerchio equivalente e intersecandolo con il cerchio del settlement.

---

## Stati di conoscenza

Ogni unità o risorsa può essere conosciuta in tre modi:

- **Certa**: nel raggio visivo del giocatore.
- **Da report**: valida all'ultimo messaggio ricevuto, può essere falsificata.
- **Proiettata**: posizione stimata in base a velocità e ultime informazioni note.

Anche dati come felicità, scorte o produzione sono mediati da chi li riporta.

---

## Tempo

- Il mondo scorre sempre.
- Il giocatore può mettere in pausa, accelerare o rallentare.
- Un giorno di gioco dura pochi secondi reali (parametro `dayLengthSeconds`).
- Il consumo di cibo della popolazione al settlement avviene a fine giornata.
- Le spedizioni consumano provviste in modo continuo durante il viaggio e la raccolta.

---

## UI e feedback

- Pannello info in alto a destra per dettagli su spedizioni, esagoni o riepilogo settlement.
- Pannello debug per modificare parametri in tempo reale.
- Pannello lavoratori locali con bottoni `+` e `-`.
- Esagoni colorati in base alla densità.
- Raggio locale mostrato come bordo esterno giallo degli esagoni al confine.
- Numeri sopra gli esagoni con lavoratori assegnati.
- Triangoli rossi persistenti per esagoni sotto soglia.
- Banner notifiche in alto a destra, sotto eventuali menu, in colonna, dismissibili con click destro.

---

## Interazioni tra sistemi

- La **raccolta locale** usa i lavoratori del Pop gatherer, riduce la densità degli esagoni entro il raggio locale e aggiorna le scorte del settlement.
- Le **spedizioni** prelevano lavoratori dal Pop gatherer, si muovono sulla mappa, raccolgono dagli esagoni e riportano il cibo al settlement.
- Il **consumo** di cibo dipende dalla popolazione totale (settlement + spedizioni).
- La **tecnologia** (futura) influenzerà velocità di raccolta e sblocco di nuovi compiti.
- La **diplomazia** e le **fazioni** (future) potranno modificare la fedeltà dei Pop e l'accesso alle risorse.