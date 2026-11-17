# AIDA — Specifica di consegna dei tre agenti P0

I tre agenti hanno priorità assoluta nel piano di implementazione. Gli ID runtime restano stabili e riutilizzano gli specialisti esistenti: `lead-prospecting`, `document`, `omnichannel-communications`. La registrazione nel catalogo non equivale a una funzione già operativa: ogni connettore e ogni workflow deve superare i test di accettazione qui definiti.

## P0.1 — B2B Lead Extractor AI

### Obiettivo
Produrre archivi B2B strutturati, arricchiti quanto più possibile con recapiti aziendali verificabili, senza duplicati e con la provenienza di ogni dato.

### Fonti e connettori
- Motori di ricerca e pagine web pubbliche.
- Google Business Profile/Maps tramite API e modalità di accesso ufficiali consentite.
- Directory e motori professionali tramite API, licenze o condizioni d'uso che autorizzano l'acquisizione.
- Siti aziendali e pagine pubbliche dei professionisti/imprese.
- Social network solo tramite API ufficiali, export autorizzati o accessi consentiti dal provider.

Non aggirare login, CAPTCHA, limiti tecnici, paywall o condizioni dei provider. Ogni connettore deve registrare fonte, URL/ID origine, data e ora di acquisizione, metodo di accesso e limiti applicabili.

### Pipeline obbligatoria
1. Ricevere categoria/ATECO, località, CAP, area geografica, quantità obiettivo e campi richiesti.
2. Cercare e raccogliere record aziendali candidati dalle fonti abilitate.
3. Normalizzare ragione sociale, indirizzo, Comune, provincia, CAP, sito, telefoni ed email.
4. Arricchire in priorità con telefono aziendale, cellulare aziendale/pubblicato ed email aziendale pubblicata o verificata da provider autorizzato.
5. Verificare ogni campo separatamente: fonte, data, esito e livello di affidabilità. Non presentare un recapito come verificato se è soltanto dedotto.
6. Deduplicare usando recapiti normalizzati e identità aziendale; conservare un record principale e la cronologia delle fonti, senza cancellare informazioni utili.
7. Applicare liste di esclusione, opposizione e soppressione e le regole di conservazione.
8. Esportare CSV/XLSX con schema selezionabile, report di qualità e conteggio di record nuovi, duplicati, incompleti e scartati.

### Regole di qualità
- Nessun telefono o indirizzo email inventato o costruito per supposizione.
- Preferire cellulari e email solo quando reperiti e attribuibili in modo documentato all'impresa/professionista.
- Distinguere numero fisso, mobile, centralino e recapito non verificato.
- Deduplicazione ripetibile e tracciabile; mai eliminare un record storico senza regola esplicita.
- Rispettare GDPR, ePrivacy, basi giuridiche, informativa, opposizioni e limitazioni dei provider. La presenza pubblica di un dato non equivale automaticamente ad autorizzazione al marketing.

### Output minimo
`company_name`, `category`, `address`, `city`, `province`, `postal_code`, `phone`, `mobile`, `email`, `website`, `source`, `source_url`, `verified_fields`, `verification_status`, `collected_at`, `deduplication_key`, `legal_basis_status`, `suppression_status`, `notes`.

## P0.2 — PC File Manager AI

### Obiettivo
Trovare file nel computer tramite parole chiave e riordinare i documenti in modo controllato, senza perdere o sovrascrivere contenuti.

### Accesso al computer
L'accesso ai file locali richiede un connettore desktop/companion installato e autorizzato dall'utente. La web app da sola non deve presumere accesso all'intero disco. L'utente seleziona le cartelle consentite e può revocare l'autorizzazione.

### Pipeline obbligatoria
1. Selezionare una o più cartelle autorizzate e indicizzare soltanto i metadati necessari.
2. Cercare per parola chiave in nome file e, se autorizzato, nel contenuto estratto/OCR.
3. Filtrare per estensione, data, dimensione, cartella e tipo documento.
4. Mostrare anteprima dei risultati con percorso completo e motivazione della corrispondenza.
5. Proporre categorie e una struttura di cartelle, senza spostare nulla durante la fase di analisi.
6. Preparare un piano di riordino con origine, destinazione e possibili conflitti.
7. Eseguire soltanto le operazioni approvate dall'utente; mantenere log e possibilità di annullamento.
8. Segnalare duplicati e file simili; non cancellare né sovrascrivere automaticamente.

### Salvaguardie
- Scope limitato alle cartelle autorizzate, con controllo permessi a ogni operazione.
- Nessuna cancellazione definitiva automatica.
- Nessuna modifica silenziosa: anteprima e conferma per spostamenti/rinomine.
- Gestione dei conflitti: non sovrascrivere, chiedere decisione.
- Audit di percorso originale, nuovo percorso, timestamp, autore e risultato.

## P0.3 — Email Campaign AI

### Obiettivo
Preparare email commerciali complete di demo grafica HTML responsive e inviarle esclusivamente a destinatari autorizzati, pre-caricati oppure selezionati dai record B2B idonei.

### Origine destinatari
- Import di rubriche/liste precaricate con stato e prova dell'autorizzazione.
- Selezione da B2B Lead Extractor soltanto dei record che superano il controllo della base giuridica, delle autorizzazioni e delle liste di soppressione.
- Non considerare automaticamente autorizzato un contatto solo perché trovato online o presente nel database.

### Pipeline obbligatoria
1. Selezionare brand, obiettivo, template, lingua, destinatari e provider.
2. Generare copy e HTML responsive con demo/preview desktop e mobile.
3. Applicare logo, colori, immagini e CTA approvati; controllare link, rendering e accessibilità di base.
4. Validare ogni destinatario: origine, autorizzazione/base giuridica, opposizione, unsubscribe e soppressioni.
5. Eseguire invio di test a indirizzi interni approvati.
6. Mostrare riepilogo campagna, destinatari validi/esclusi, contenuto finale e volume.
7. Richiedere approvazione esplicita prima dell'invio.
8. Inviare tramite provider email collegato e registrare ID messaggio, esito, bounce, reclami e disiscrizioni.

### Salvaguardie
- Nessun invio senza provider configurato e credenziali conservate server-side.
- Nessun invio a liste prive di autorizzazione/base giuridica documentata.
- Gestione unsubscribe e liste di soppressione prima di ogni invio.
- Limiti di velocità e volume, protezione da invii duplicati e retry idempotenti.
- L'agente può preparare bozze e anteprime; l'invio effettivo resta subordinato all'approvazione richiesta dalla policy.

## Dipendenze di piattaforma e ordine di rilascio

1. B2B Lead Extractor: registry dei connettori, pipeline dati, normalizzazione, deduplicazione, verifica e export.
2. PC File Manager: desktop companion, permessi per cartella, ricerca indicizzata, piano di riordino, operazioni reversibili.
3. Email Campaign: template/renderer HTML, recipient store e autorizzazioni, provider email, test send, approvazione e tracking.

## Criteri di accettazione comuni

- Test automatici unitari e d'integrazione per ogni fase.
- Nessun dato inventato e provenienza verificabile.
- Isolamento tenant e autorizzazioni applicate lato server.
- Audit completo di letture sensibili, modifiche e invii.
- Errori espliciti quando manca un provider o un'autorizzazione: mai simulare una ricerca, uno spostamento o un invio come completato.
- Lo stato del servizio può diventare `configurable` o `active` soltanto dopo che implementazione, provider e test end-to-end sono effettivamente verificati.
