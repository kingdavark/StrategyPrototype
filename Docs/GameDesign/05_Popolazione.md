# Popolazione e Demografia

## Scopo

Questo documento descrive il sistema di popolazione simulata (pop system), la demografia, il consumo di cibo, la gestione dei lavoratori e la futura crescita demografica. Include tutte le regole attuali e le evoluzioni previste.

## Pop system

La popolazione è suddivisa in **gruppi (pop)** con attributi condivisi: occupazione, età, cultura, religione, status sociale, etnia.
Per il prototipo attuale esiste un solo Pop: `gatherer` (raccoglitori).
Ogni Pop ha:

- `type`: tipo di Pop (es. `gatherer`)
- `totalWorkers`: numero totale di individui appartenenti al Pop
- `availableWorkers`: lavoratori attualmente al campo, pronti per essere assegnati a spedizioni o compiti locali
- `assignedWorkers`: lavoratori attualmente in spedizione
- `localWorkers`: lavoratori assegnati alla raccolta locale nelle celle attorno al campo

---

## Popolazione non assegnata

Oltre ai Pop specializzati, esiste un pool di popolazione non assegnata:

- `camp.unassignedPopulation`
  Questo pool rappresenta individui generici che non hanno ancora un'occupazione specifica. Possono essere convertiti in lavoratori di un Pop quando necessario (es. assegnazione a una cella locale o creazione di una spedizione).
  Quando un lavoratore viene assegnato a una cella locale, smette di far parte della popolazione non assegnata e diventa membro del Pop `gatherer`. Anche se non parte in spedizione, appartiene comunque al Pop gatherer come lavoratore locale.

---

## Consumo di cibo

Il cibo è l'unica risorsa vitale nel prototipo. Il consumo si divide in base al contesto:

- Popolazione al campo: consuma una razione giornaliera fissa, calcolata per l'intera tribù a fine giornata.
- Spedizioni in viaggio: consumano provviste in modo continuo, proporzionalmente al tempo trascorso e con un moltiplicatore maggiore rispetto al riposo.
- Spedizioni durante la raccolta: consumano ancora di più, perché lo sforzo fisico è superiore.
  Il consumo giornaliero totale della popolazione al campo è:
  
  ```text
  dailyConsumption = totalPopulation * foodConsumptionPerPersonPerDay
  ```

dove `totalPopulation` include sia la popolazione non assegnata sia tutti i lavoratori dei Pop, compresi quelli in spedizione.

Se le scorte arrivano a zero, per ora viene mostrato solo un avviso. In futuro comporterà la morte dei pop.

---

## Assegnazione dei lavoratori

### Priorità di prelievo per le spedizioni

Quando viene creata una spedizione, i lavoratori vengono presi in questo ordine:

1. Dalla popolazione non assegnata (`camp.unassignedPopulation`), che viene prima convertita nel Pop `gatherer` e poi assegnata alla spedizione.

2. Dai lavoratori disponibili del Pop `gatherer` (`availableWorkers`).

Se non ci sono lavoratori disponibili, la spedizione non viene creata.

### Assegnazione locale

- I lavoratori locali vengono assegnati manualmente a celle specifiche entro il raggio locale.

- Non sono entità mobili e producono cibo direttamente al campo.

- Quando un lavoratore viene assegnato a una cella locale, diventa membro del Pop `gatherer` e incrementa sia `pop.localWorkers` sia `cell.assignedWorkers`.

---

## Riposo dei lavoratori

Dopo una spedizione, i lavoratori devono riposare. Il tempo di riposo è proporzionale alla durata della spedizione appena conclusa:

text

restDuration = tripDurationSec * restMultiplier

Il riposo si applica alla spedizione, non ai singoli lavoratori. Terminato il riposo, la spedizione può ripartire se ci sono ancora lavoratori disponibili nel Pop.

---

## Crescita demografica (futura)

Questa meccanica non è ancora implementata. Le regole previste sono:

- Più cibo c'è, più la popolazione cresce.

- Se il cibo scarseggia, aumenta il tasso di morte.

- Se una spedizione esaurisce le scorte, i lavoratori iniziano a morire o a consumare il cibo raccolto.

---

## Distinzione per età e sesso (futura)

Dovremo introdurre una distinzione della popolazione per sesso ed età senza dover monitorare ogni singolo abitante. Questo sarà necessario per applicare meccaniche di frizione/resistenza al cambio di occupazione (es. uomini giovani infelici se assegnati alla raccolta perché disonorevole).

L'approccio esatto deve ancora essere definito, ma l'idea è di usare categorie demografiche aggregate piuttosto che individui singoli.

---

## Fedeltà e fazioni (future)

In futuro i Pop potranno avere:

- Cultura e religione diverse

- Fedeltà verso il giocatore o verso altre fazioni

- Rischio di tradimento in base a composizione etnica, culturale e religiosa

Queste meccaniche non sono implementate nel prototipo attuale.

---

## Interazioni con altri sistemi

- Raccolta cibo: i lavoratori locali e le spedizioni sono prelevati dai Pop.

- Spedizioni: le spedizioni prelevano e restituiscono lavoratori al Pop di origine.

- Consumo: la popolazione totale determina il consumo giornaliero di cibo.

- Governo e amministrazione: future forme di governo potranno influenzare la gestione della popolazione.

- Mondo simulato: migrazioni e malattie (future) influenzeranno la demografia.

---

## UI/UX collegata

- Nel riepilogo del campo vengono mostrati i dati sulla popolazione (non assegnata, lavoratori locali, in spedizione, disponibili).

- Nel pannello info della cella selezionata viene mostrato il numero di lavoratori assegnati.

- Sopra ogni cella con lavoratori compare il numero di lavoratori.

- I bottoni `+` e `-` nel pannello `local-worker-panel` permettono di assegnare o rimuovere lavoratori dalla cella selezionata.

---

## Note tecniche (per il programmatore)

- La popolazione non assegnata è un numero intero.

- I Pop hanno contatori separati per lavoratori disponibili, in spedizione e locali.

- L'assegnazione a una cella locale non crea un nuovo Pop: se il Pop gatherer esiste già, viene usato quello.