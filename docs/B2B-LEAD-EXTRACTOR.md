# B2B Lead Extractor AI — acquisizione completa di schede aziendali

Il modulo acquisisce schede aziendali, non soltanto email. Campi persistiti: categoria merceologica, ragione sociale/denominazione, nome e cognome del referente quando pubblicati, indirizzo, via, civico, CAP, Comune, Provincia, Regione, Paese, cellulare, telefono fisso, email, sito web, profili social, partita IVA, coordinate, ID/URL sorgente, payload originale e provenienza dei campi. I dati assenti restano null: non vengono inventati.

## Fonti e connettori
- Google Maps tramite Apify, Actor predefinito compass~crawler-google-places. Recupera schede, categorie, recapiti, indirizzi e siti; l'opzione contatti e profili social è abilitata quando disponibile.
- Pagine Gialle tramite Apify, Actor predefinito emastra~pagine-gialle-scraper. Ricerca per categorie italiane e località e restituisce, se presenti, telefono, mobile, WhatsApp, email, sito, P.IVA, indirizzo e profili social.
- Social: arricchimento opzionale dei profili pubblici collegati alla scheda aziendale; usare API ufficiali o provider autorizzati e rispettare termini e basi giuridiche. Non accedere a profili privati né aggirare login, paywall, CAPTCHA o controlli.

Apify orchestra gli Actor ma i connettori restano sostituibili. Google Business Profile API per le schede gestite dall'utente è un connettore distinto dalla ricerca pubblica Maps.

## API
POST /api/lead-extractor/search — autenticazione obbligatoria e isolamento tenant. Payload: { "source": "google_maps" | "pagine_gialle", "categories": ["..."], "locations": ["..."], "maxRecords": 50 }. Massimo 100 risultati per richiesta. I record sono normalizzati, salvati in PostgreSQL, deduplicati per tenant + fonte + ID/URL e registrati nell'audit log.

## Configurazione
APIFY_API_TOKEN (server-side, mai esposto al browser); APIFY_GOOGLE_MAPS_ACTOR (opzionale, default compass~crawler-google-places); APIFY_PAGINE_GIALLE_ACTOR (opzionale, default emastra~pagine-gialle-scraper). Gli Actor possono generare costi pay-per-event: configurare budget e limiti nell'account Apify.

## Qualità e conformità
I dati restituiti non sono automaticamente verificati. Fonte e data sono conservate. La Regione/Provincia non viene dedotta quando mancante; il mapping territoriale va aggiunto usando dataset affidabili e versionati. La categoria originale è conservata; la conversione in ATECO richiede mapping esplicito. La pubblicazione di email o cellulari non equivale a consenso marketing: ogni utilizzo deve avere base giuridica, informativa, minimizzazione e rispetto dei diritti. L'importazione non abilita invii email.

## Stato effettivo del collegamento
Il codice e l'interfaccia di ricerca sono presenti nel repository. Per eseguire ricerche reali è indispensabile configurare APIFY_API_TOKEN nell'ambiente server e applicare la migration Prisma 20261118130000_b2b_lead_records. Il repository non contiene né deve contenere token o credenziali. Non risultano workflow CI avviati sul commit di questa implementazione: la validazione build/typecheck e la prova end-to-end con un account Apify devono essere eseguite nell'ambiente di deployment prima di dichiarare il modulo operativo.

L'Actor Google Maps e quello Pagine Gialle sono configurabili via variabili d'ambiente. I campi dipendono dalla disponibilità effettiva della fonte; l'estrazione non garantisce che ogni scheda contenga ragione sociale legale, referente nominativo, cellulare, email o sito. I dati mancanti rimangono vuoti e non sono fabbricati.
