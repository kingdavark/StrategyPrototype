# Programmer Agent Skill

## Scopo

Questa skill definisce il processo di lavoro per l'agente di programmazione (IDE). Serve a implementare le modifiche richieste dal Game Designer, rispettando l'architettura esistente e il flusso di lavoro concordato.

## Ruolo

L'agente di programmazione:

- Riceve un prompt dal Game Designer.

- Discute con l'utente le modifiche tecniche da apportare.

- Applica le modifiche solo dopo approvazione esplicita.

- Fornisce test tecnici dopo che tutte le modifiche del batch sono state implementate.

- Aggiorna la documentazione tecnica.

- Prepara commit e push su GitHub.

## Flusso di lavoro

### Step 1 – Brief generale

- Leggere il prompt ricevuto.

- Leggere i documenti di Game Design e Technical rilevanti.

- Fornire un brief generale in linguaggio semplice:
  
  - Cosa si andrà a fare.
  
  - Quali effetti avrà sul gameplay e sulla UI.
  
  - Eventuali limiti tecnici o approcci alternativi.

- Attendere l'OK dell'utente prima di procedere.

### Step 2 – Modifiche una per una

- Per ogni modifica:
  
  - Spiegare cosa fa.
  
  - Descrivere le conseguenze sul codice e sul gameplay.
  
  - Indicare i file coinvolti.
  
  - Attendere l'OK dell'utente prima di applicare.

- Non applicare modifiche non approvate.

- Preservare i commenti esistenti.

- Usare delta time per aggiornamenti temporali.

- Ogni nuovo parametro va in GameConfig e nel pannello debug.

### Step 3 – Test tecnici (dopo tutte le modifiche del batch)

- Dopo che tutte le modifiche del batch sono state implementate e approvate, fornire una checklist di test tecnici.

- I test devono includere:
  
  - Azioni specifiche da compiere (es. "ricarica la pagina").
  
  - Comportamento atteso.
  
  - Controlli in console (es. "non devono apparire errori").

- Attendere che l'utente esegua i test e segnali eventuali problemi.

### Step 4 – Aggiornamento documentazione tecnica

- Se sono state introdotte nuove strutture dati, funzioni o pattern architetturali, aggiornare i file in `Docs/Technical/`.

- Non aggiornare per dettagli implementativi minori.

- Attendere conferma dell'utente.

### Step 5 – Commit e push

- Fornire il messaggio di commit (titolo e descrizione).

- Fornire i comandi git per il commit e il push.

- Il messaggio deve riassumere tutte le modifiche effettive dall'ultimo commit, inclusi aggiornamenti ai documenti.

## Regole

- Non modificare file senza approvazione.

- Non fornire test tecnici dopo ogni singola modifica, ma solo dopo l'intero batch.

- Seguire le convenzioni di codice definite in `Docs/Technical/00_Architettura_Generale.md`.

- Se ci sono dubbi, chiedere prima di procedere.

- Non fare assunzioni: se qualcosa non è chiaro, chiedere.

## Interazione con l'utente

- L'utente applica le modifiche localmente, testa, e poi committa.

- L'agente fornisce solo le porzioni di codice da modificare, indicando file e punto di inserimento.

- Per i nuovi file, fornire il contenuto completo.

- L'agente non scrive direttamente sul repository: fornisce istruzioni.

## Output atteso

Alla fine del processo, l'utente avrà:

- Modifiche implementate e testate.

- Documentazione tecnica aggiornata.

- Commit e push eseguiti.
