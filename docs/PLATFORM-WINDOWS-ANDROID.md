# AIDA-Ai-Agent — prima piattaforma Windows 11 + Android

## Ambito della prima versione

La prima versione utilizzabile è una piattaforma SaaS cloud con accesso web responsive da PC Windows 11 e smartphone Android. La stessa identità utente, tenant, dati e processi devono essere condivisi tra i dispositivi.

- Windows 11: browser moderno per il SaaS; Desktop Companion Windows per l'accesso esplicitamente autorizzato a programmi e cartelle locali.
- Android: web app installabile (PWA) da browser compatibile. Le funzioni cloud sono disponibili nell'interfaccia mobile; le funzioni che richiedono accesso al PC restano eseguite dal Desktop Companion Windows.
- Cloud: autenticazione, tenant isolation, database, orchestrazione, agenti, audit e connettori esterni.
- Espansione: mantenere API e contratti indipendenti dal sistema operativo per aggiungere successivamente iOS, macOS e Linux.

## GMExtractor — flusso richiesto

AIDA non deve richiedere il caricamento manuale di file Excel. GMExtractor rimane il programma di estrazione installato e autorizzato dall'utente su Windows 11.

Flusso previsto:
1. GMExtractor produce un'esportazione locale, preferibilmente JSON.
2. Il Desktop Companion AIDA osserva esclusivamente la cartella scelta dall'utente.
3. Il Companion rileva un file JSON completato, ne verifica la struttura e conserva l'originale.
4. I record vengono inviati al SaaS tramite connessione HTTPS autenticata, associata al tenant e al dispositivo autorizzato.
5. Il backend applica normalizzazione, deduplicazione, provenienza, controlli di qualità e audit.
6. La dashboard web mostra conteggi, record importati, duplicati ed errori.

L'integrazione non deve pilotare Chrome, aggirare licenze, CAPTCHA o limiti di GMExtractor. Non deve eseguire il KeyGen incluso negli archivi. Non si presume l'esistenza di API pubbliche GMExtractor.

## Condizioni tecniche da verificare prima dell'attivazione

- Percorso effettivo in cui GMExtractor salva GMapData.json.
- Schema e versione del JSON effettivamente prodotto dalla versione installata.
- Modalità per distinguere un'esportazione completata da un file ancora in scrittura.
- Possibilità di selezionare la cartella di output nell'applicazione.
- Licenza e condizioni d'uso del programma.

Finché questi punti non sono verificati su Windows 11, il connettore deve restare in stato di configurazione e non dichiarare importazioni completate.

## Sicurezza del Desktop Companion

- Pairing esplicito dal workspace AIDA e token dispositivo revocabile.
- Token conservato nel credential store di Windows, mai in chiaro nei log.
- Scope limitato alla sola cartella selezionata dall'utente.
- HTTPS, retry idempotenti, checksum, audit e coda locale per indisponibilità di rete.
- Nessuna esecuzione automatica di file ricevuti e nessuna cancellazione degli originali.
- Disinstallazione e revoca del dispositivo interrompono l'accesso.

## Stato

La PWA e il contratto architetturale Windows/Android costituiscono la prima base multipiattaforma. Il Desktop Companion e l'endpoint cloud di pairing/ingestione devono essere implementati e testati prima che il collegamento GMExtractor possa essere considerato operativo.
