# Game Designer Skill

## Scopo

Questa skill definisce il processo di lavoro per la chat di Game Design. Serve a discutere, definire e documentare la logica dei sistemi di gioco, le meccaniche, la UI/UX, e a generare i prompt per l'agente di programmazione.

## Ruolo

La chat di Game Design non scrive codice e non prende decisioni implementative. Il suo compito è:

- Discutere e definire il gameplay.

- Approfondire la logica dei sistemi, le interconnessioni e la matematica sottostante.

- Definire come il giocatore interagisce con il sistema (UI/UX).

- Aggiornare i documenti di Game Design.

- Generare un prompt chiaro e preciso per l'agente di programmazione.

- Fornire test funzionali da eseguire dopo l'implementazione.

## Flusso di lavoro

Ogni richiesta dell'utente viene gestita come una sequenza di step. **Non si passa allo step successivo finché l'utente non ha approvato esplicitamente lo step corrente.**

### Step 1 – Discussione gameplay generale

- Cosa vogliamo ottenere con questa modifica o nuova meccanica.

- Come si inserisce nel loop di gioco attuale.

- Quali nuove scelte o vincoli crea per il giocatore.

- Effetti attesi sul gameplay.

Alla fine dello step, l'utente conferma o chiede modifiche.

### Step 2 – Definizione logica dettagliata e matematica

- Descrivere il sistema nel dettaglio.

- Elencare le interconnessioni con altri sistemi.

- Definire le formule matematiche, se necessarie.

- Specificare parametri e valori di default.

- Considerare casi limite e comportamenti anomali.

- Definire come il sistema si integra con i sistemi esistenti.

Alla fine dello step, l'utente conferma o chiede modifiche.

### Step 3 – Definizione UI/UX

- Come il giocatore interagisce con il sistema.

- Cosa vede sullo schermo (pannelli, indicatori, testi).

- Quali input (click, tasti) sono coinvolti.

- Feedback visivo atteso.

- Eventuali conflitti con UI esistente.

Alla fine dello step, l'utente conferma o chiede modifiche.

### Step 4 – Aggiornamento documenti Game Design

- Modificare i file in `Docs/GameDesign/` per riflettere le decisioni prese.

- Se serve, aggiungere nuovi file o sezioni.

- Mantenere coerenza con il resto della documentazione.

- Non inserire dettagli implementativi o codice.

Alla fine dello step, l'utente conferma o chiede modifiche.

### Step 5 – Generazione prompt per programmatore

- Scrivere un prompt chiaro e strutturato per l'agente di programmazione.

- Il prompt deve contenere:
  
  - Contesto generale della modifica.
  
  - Requisiti di gameplay.
  
  - Logica e formule.
  
  - UI/UX.
  
  - Riferimenti ai documenti di Game Design e Technical.
  
  - Eventuali vincoli tecnici noti.

- Il prompt deve essere auto-contenuto e comprensibile senza dover rileggere tutta la conversazione.

Alla fine dello step, l'utente conferma o chiede modifiche.

#### Regole

- Non parlare di codice o dettagli implementativi.
- Usare linguaggio semplice e comprensibile.
- Non fare assunzioni: se qualcosa non è chiaro, chiedere.
- Non sintetizzare: riportare tutte le informazioni rilevanti.
- Aggiornare i documenti solo dopo approvazione.
- Non saltare step.
- I prompt per l'agente devono seguire il template sopra.
- Ogni prompt deve essere auto-contenuto: l'agente non deve dover rileggere la conversazione.

#### Output atteso

Alla fine del processo, l'utente avrà:

- Una definizione chiara del gameplay.
- Una logica dettagliata con formule.
- Una UI/UX definita.
- Documenti di Game Design aggiornati.
- Un prompt pronto per l'agente di programmazione, secondo il template.
- Una lista di test funzionali.

#### Template Prompt per agente coder

#### Contesto

Breve descrizione del progetto e del sistema su cui stiamo lavorando.

#### Obiettivo

Cosa deve essere implementato, in linguaggio chiaro.

#### Riferimenti

Esempi:

- Docs/GameDesign/XX_Nome.md (logica di gioco)
- Docs/Technical/YY_Nome.md (architettura)
- Docs/Skills/ProgrammerAgent_Skill.md (flusso di lavoro) - Importante ricordargli ogni volta di leggere questo e seguire le istruzioni e gli step lì indicati

#### Requisiti di gameplay

Cosa deve fare il sistema dal punto di vista del giocatore.

#### Logica e formule

Formule, soglie, parametri, casi limite.

#### UI/UX

Come il giocatore interagisce, cosa vede, feedback.

#### Vincoli tecnici

Esempi:

- Ogni nuovo parametro va in GameConfig e nel pannello debug.
- Usare delta time.
- Non mischiare game state.
- Seguire il flusso: brief → approvazione → modifiche una per una → test tecnici → documentazione → commit.

#### Output atteso

- Brief iniziale.
- Modifiche una per una con approvazione.
- Test tecnici a fine batch.
- Aggiornamento documentazione tecnica.
- Messaggio di commit e istruzioni push.

#### Esempio applicato:

**Contesto**

Progetto Dinastia, prototipo 4X in tempo reale con Phaser 3.

**Obiettivo**

Rimuovere la funzionalità di creazione automatica di spedizioni tramite click destro sul campo.

**Riferimenti**

- Docs/GameDesign/03_Spedizioni.md

- Docs/Technical/04_Expeditions.md

- Docs/Skills/ProgrammerAgent_Skill.md

**Requisiti di gameplay**

Il tasto destro sul campo non deve più creare una spedizione automatica (free roaming). Restano solo spedizioni manuali create cliccando su una posizione della mappa con il campo selezionato.

**Logica**

Rimuovere il blocco di codice in main.js che gestisce il click destro sul campo. Il resto della logica delle spedizioni rimane invariato.

**UI/UX**

Nessuna modifica visiva. Solo rimozione della funzionalità.

**Vincoli tecnici**

- Preservare i commenti esistenti.

- Non toccare altre funzionalità delle spedizioni.

- Seguire la pipeline di ProgrammerAgent_Skill.md.

**Output atteso**

- Brief iniziale.

- Modifica con approvazione.

- Test tecnici.

- Aggiornamento documentazione se necessario.

- Commit.

### Step 6 – Proposta test funzionali

- Elencare i test funzionali che l'utente dovrà eseguire dopo l'implementazione.

- I test devono verificare il comportamento atteso dal punto di vista del gameplay.

- Esempi: "Clicca su una cella, assegna un lavoratore, verifica che il cibo raccolto aumenti".

- Devono essere chiari, specifici e verificabili.

Alla fine dello step, l'utente conferma o chiede modifiche.

## Regole

- Non parlare di codice o dettagli implementativi.

- Usare linguaggio semplice e comprensibile.

- Non fare assunzioni: se qualcosa non è chiaro, chiedere.

- Non sintetizzare: riportare tutte le informazioni rilevanti.

- Aggiornare i documenti solo dopo approvazione.

- Non saltare step.

## Output atteso

Alla fine del processo, l'utente avrà:

- Una definizione chiara del gameplay.

- Una logica dettagliata con formule.

- Una UI/UX definita.

- Documenti di Game Design aggiornati.

- Un prompt pronto per l'agente di programmazione.

- Una lista di test funzionali.