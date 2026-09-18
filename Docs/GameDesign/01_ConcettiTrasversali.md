# Concetti Trasversali

## Scopo

Questo documento raccoglie i concetti condivisi tra tutti i sistemi di gioco. Serve come riferimento rapido per comprendere le entità principali, la terminologia, e le relazioni generali tra i moduli.

---

## Loop di gioco minimo

1. Osservi la mappa 2D con la tua tribù accampata.
2. Selezioni un gruppo di persone e le assegni a un compito (raccogliere cibo, cacciare, raccogliere legna).
3. Il gruppo si sposta in tempo reale, consuma cibo durante il viaggio, raggiunge la risorsa, la sfrutta, torna.
4. La risorsa arriva all’accampamento: è disponibile per sfamare o costruire.
5. Puoi mettere in pausa per ripianificare o accelerare per vedere gli effetti nel tempo.

---

## Entità principali

### Camp (Accampamento)

- È il punto di riferimento della tribù.
- Contiene le scorte di cibo e la popolazione non assegnata.
- Ha un raggio locale entro il quale i lavoratori possono essere assegnati direttamente alle celle per la raccolta.
- Può essere selezionato per gestire la raccolta locale e vedere il riepilogo giornaliero.

### Pop (Gruppo di persone)

- Un Pop rappresenta un insieme di individui con le stesse caratteristiche (occupazione, cultura, religione, status, etnia).
- Per il prototipo attuale esiste solo il Pop `gatherer` (raccoglitori).
- Ogni Pop ha:
  - `totalWorkers`: numero totale di individui appartenenti al Pop.
  - `availableWorkers`: lavoratori disponibili al campo, pronti per essere assegnati a spedizioni o compiti locali.
  - `assignedWorkers`: lavoratori attualmente in spedizione.
  - `localWorkers`: lavoratori assegnati alla raccolta locale nelle celle attorno al campo.
- I lavoratori non tornano automaticamente al pool `unassignedPopulation`; serve un'azione esplicita del giocatore.

### Expedition (Spedizione)

- Un gruppo mobile di lavoratori prelevati da un Pop.
- Ha uno stato (`travellingToArea`, `gathering`, `returningToCamp`, `resting`, `movingToCell`).
- Ha un inventario con cibo raccolto e provviste.
- Può avere un'area di raccolta assegnata o vagare liberamente (modalità automatica).
- Consuma provviste durante il viaggio e la raccolta.
- Dopo il rientro, i lavoratori rientrano nel Pop e la spedizione riposa prima di ripartire.

### Cell (Cella)

- Unità spaziale nascosta della griglia.
- Contiene valori di densità per risorse naturali (es. `forageDensity`).
- Può avere lavoratori locali assegnati per la raccolta.
- Tiene traccia del cibo raccolto oggi (`foodGatheredToday`) e del cibo raccolto ieri (`gatheredDaily`).

### Branchi (Herd)

- Entità mobili di grandi animali (es. cervi, bisonti).
- Hanno specie, numero di capi, habitat preferito.
- Si muovono lentamente nell'habitat e si riproducono se non disturbati.
- La caccia riduce il numero di capi e produce carne e pelli.
- Se scendono sotto una soglia, si estinguono localmente.

---

## Risorse naturali

Le risorse naturali sono rappresentate come **layer di densità** distribuiti sulla griglia spaziale.

| Layer              | Descrizione                                      |
| ------------------ | ------------------------------------------------ |
| `forageDensity`    | Vegetazione raccoglibile (bacche, erbe, radici). |
| `forestDensity`    | Alberi per legna.                                |
| `smallGameDensity` | Piccola fauna terrestre (conigli, uccelli).      |
| `fishDensity`      | Pesci, solo in celle d'acqua.                    |
| `fertility`        | Fertilità del suolo per futura agricoltura.      |

La raccolta riduce la densità **solo nella cella esatta** su cui lavorano i lavoratori.

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
- Il consumo di cibo della popolazione al campo avviene a fine giornata.
- Le spedizioni consumano provviste in modo continuo durante il viaggio e la raccolta.

---

## UI e feedback

- Pannello info in alto a destra per dettagli su spedizioni, celle o riepilogo campo.
- Pannello debug per modificare parametri in tempo reale.
- Pannello lavoratori locali con bottoni `+` e `-`.
- Celle colorate in base alla densità.
- Raggio locale mostrato quando il campo è selezionato.
- Numeri sopra le celle con lavoratori assegnati.
- Triangoli rossi persistenti per celle sotto soglia (in modalità camp) e sul campo (in modalità mappa).

---

## Interazioni tra sistemi

- La **raccolta locale** usa i lavoratori del Pop gatherer, riduce la densità delle celle entro il raggio locale e aggiorna le scorte del campo.
- Le **spedizioni** prelevano lavoratori dal Pop gatherer, si muovono sulla mappa, raccolgono dalle celle e riportano il cibo al campo.
- Il **consumo** di cibo dipende dalla popolazione totale (camp + spedizioni).
- La **tecnologia** (futura) influenzerà velocità di raccolta e sblocco di nuovi compiti.
- La **diplomazia** e le **fazioni** (future) potranno modificare la fedeltà dei Pop e l'accesso alle risorse.