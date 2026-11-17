# EMAIL CAMPAIGN AI — modalità destinatari, verifica e report

## Modalità di alimentazione destinatari

La campagna supporta due modalità selezionabili:

1. **Caricamento manuale**: upload di una lista CSV o XLSX nell'interfaccia. L'importazione attualmente supporta CSV e XLSX (primo foglio), con colonna email obbligatoria e campi facoltativi per azienda, referente, base giuridica, prova autorizzazione, stato autorizzazione, soppressione e disiscrizione. L'importazione riepiloga righe importate, duplicati e indirizzi non validi. La campagna conserva il tenant e la data di creazione; il nome del file sorgente e il riepilogo dell'importazione sono registrati nell'audit log. Il file originale non viene archiviato.
2. **Collegamento B2B Lead Extractor AI**: selezione di una ricerca, segmento o archivio prodotto dall'agente B2B. L'integrazione passa gli ID dei record e non copia contatti che non abbiano superato il controllo di idoneità al marketing. I record importati mantengono il riferimento al lead originale.

Le due modalità confluiscono nello stesso controllo di idoneità, deduplicazione e verifica. La sola presenza di un indirizzo email in un file o su una pagina pubblica non lo rende automaticamente utilizzabile per una campagna.

## Verifica degli indirizzi

La verifica deve essere eseguita da un provider collegato e registrare provider, data ed esito. Stati ammessi: `valid`, `invalid`, `unknown`, `risky`. Il controllo locale della sintassi non dimostra che una casella esista. I controlli DNS/MX attestano la configurazione del dominio, non la singola casella. Il sistema non deve dichiarare una casella "attiva" senza un risultato attendibile del provider; non deve simulare verifiche SMTP invasive né inviare messaggi di prova a destinatari non autorizzati.

## Composizione e invio

- Editor per oggetto, preheader, testo, CTA, immagini e identità visiva del brand.
- Generazione di HTML email responsive e anteprima desktop/mobile.
- Upload di logo e asset grafici autorizzati.
- Invio di test verso indirizzi interni verificati.
- Riepilogo destinatari idonei/esclusi, con motivazione.
- Invio effettivo soltanto tramite provider collegato e dopo approvazione esplicita della campagna.
- Webhook provider per consegna, bounce, reclami, disiscrizioni e tracking disponibile.
- Idempotenza per evitare invii duplicati e registro di audit per ogni messaggio.

## Report finale per campagna

Il report deve includere almeno:

| Indicatore | Definizione |
|---|---|
| Destinatari importati | Record caricati o ricevuti dal Lead Extractor |
| Idonei / esclusi | Esito dei controlli di autorizzazione, soppressione, duplicati e verifica |
| Inviati | Messaggi accettati dal provider per l'invio |
| Consegnati | Eventi di delivery confermati dal provider |
| Bounce | Rifiuti permanenti o temporanei, distinti nel dettaglio |
| Aperture rilevate | Eventi pixel/provider, non prova certa di lettura umana |
| Clic | Click registrati dai link tracciati |
| Risposte | Risposte rilevate tramite inbox collegata o webhook supportato |
| Senza risposta | Destinatari con evento di invio ma senza evento di risposta |
| Positive | Risposte classificate positive, con evidenza e classificazione registrata |
| KO | Risposte o contatti classificati KO, con evidenza e motivazione |
| In attesa | Risposte non ancora classificate o nessun esito registrato |

**Limite di misurazione:** il sistema non può certificare che un'email sia stata letta. Le aperture sono un indicatore tecnico non affidabile in assoluto perché alcuni client bloccano o precaricano i pixel. Il rilevamento delle risposte richiede una casella collegata via OAuth/API o un provider che esponga gli eventi pertinenti. Positivo e KO devono derivare da una risposta esplicita o da una classificazione manuale approvata, non da una semplice apertura o mancata risposta.

## Stato implementativo

Il modulo contiene upload CSV/XLSX, storage multi-tenant, editor HTML con anteprima, revisione autorizzazioni, batch di verifica email, invio batch tramite adapter HTTP configurabile, disiscrizione firmata, report, webhook firmato e classificazione manuale delle risposte. Restano da collegare i provider reali e il connettore runtime B2B, oltre alla sincronizzazione inbox/reply e ai test end-to-end.

## Prima implementazione registrata nel repository

- Editor bozza per oggetto e HTML, con modello responsive iniziale, anteprima isolata tramite iframe sandbox e salvataggio autenticato/tenant-scoped; la modifica è consentita solo alle campagne in stato DRAFT.

- Workspace web con selezione tra upload CSV e modalità B2B Lead Extractor (quest'ultima resta in attesa del connettore runtime).
- Endpoint autenticato e tenant-scoped per import CSV/XLSX, con limite di 5 MB e 10.000 righe, deduplicazione email e audit log. Il parser XLSX usa il primo foglio e applica limiti all'espansione dell'archivio ZIP.
- L'importazione non accetta come autorizzazione valida il valore indicato nel file: tutti i destinatari entrano in stato pending. La revisione esplicita in-app richiede base giuridica e riferimento documentale, ed è registrata nell'audit log.
- Persistenza PostgreSQL per campagne, destinatari ed eventi, con migration Prisma.
- Endpoint report tenant-scoped per inviate, consegnate, bounce, aperture rilevate, clic, risposte, positive, KO e in attesa, con elenco destinatari e stato di revisione autorizzazione.
- Endpoint webhook con firma HMAC-SHA256 e deduplicazione eventi; endpoint autenticato per classificare manualmente le risposte positive/KO e modificarne l'esito.
- Adapter HTTP configurabili per verifica e invio, endpoint self-service di disiscrizione con token HMAC e header List-Unsubscribe; renderer HTML responsive con escaping e validazione URL.

L'upload accetta CSV e XLSX (primo foglio; archivio ZIP con limiti di dimensione espansa). Gli adapter di verifica e invio sono implementati ma richiedono URL, credenziali e un provider conforme al contratto AIDA. Restano da configurare il webhook presso un provider reale, l'inbox/reply sync e l'adapter runtime B2B. L'importazione crea una campagna in bozza e non invia messaggi.


## Ingestione eventi e classificazione delle risposte

- Endpoint provider webhook: `POST /api/email-campaign/webhook`.
- Il payload deve contenere `campaignId`, `eventId`, `type`, `email` e, facoltativamente, `occurredAt` e `textExcerpt`.
- Tipi accettati: `sent`, `delivered`, `bounced`, `opened`, `clicked`, `replied`, `unsubscribed`, `complained`. Gli eventi di disiscrizione aggiornano il flag `unsubscribed`; le segnalazioni spam attivano la soppressione del destinatario.
- La richiesta deve includere `x-aida-signature: sha256=<hex>`, calcolata come HMAC-SHA256 del body HTTP grezzo con il segreto server `EMAIL_CAMPAIGN_WEBHOOK_SECRET`. Senza segreto configurato l'endpoint risponde 503; firma non valida 401.
- Gli eventi sono associati al destinatario della campagna e deduplicati tramite ID evento del provider.
- Le risposte possono essere classificate manualmente da un utente autenticato attraverso `PATCH /api/email-campaign/{campaignId}/outcomes`, con `recipientId` e `outcome` (`positive`, `ko` o `pending`). La classificazione è consentita soltanto dopo un evento `replied`, sostituisce l'esito precedente ed è registrata nell'audit log.
- Il webhook è un contratto generico AIDA: il provider effettivo deve essere configurato per inviare questo schema e questa firma. Non è una connessione provider già attiva.


## Adapter HTTP per verifica e invio

La piattaforma espone adapter HTTP generici configurabili senza legare il codice a un vendor specifico.

- Verifica: `POST /api/email-campaign/{campaignId}/verify`, batch massimo 50. Configurazione server: `EMAIL_VERIFICATION_API_URL` (endpoint HTTPS), `EMAIL_VERIFICATION_API_KEY`, facoltativo `EMAIL_VERIFICATION_PROVIDER_NAME`. AIDA invia `{ "email": "..." }`; il provider deve restituire `{ "status": "valid|invalid|risky|unknown" }`. Gli esiti sono persistiti sul destinatario. Gli errori provider non trasformano un indirizzo in valido.
- Invio: `POST /api/email-campaign/{campaignId}/send`, richiede sessione autenticata e `{ "confirmSend": true }`. Elabora al massimo 50 destinatari per richiesta, solo se autorizzazione approvata, verifica email `valid`, nessuna soppressione e nessuna disiscrizione. Configurazione server: `EMAIL_DELIVERY_API_URL` (endpoint HTTPS), `EMAIL_DELIVERY_API_KEY`, `EMAIL_DELIVERY_FROM`, facoltativo `EMAIL_DELIVERY_PROVIDER_NAME`.
- Contratto delivery: AIDA invia `from`, `to`, `subject`, `html`, `idempotencyKey` e gli header di disiscrizione; il provider deve rispondere con `{ "id": "provider-message-id" }`. La chiave idempotente è stabile per campagna/destinatario.
- Configurazione disiscrizione: `EMAIL_CAMPAIGN_UNSUBSCRIBE_SECRET` (almeno 32 caratteri) e `APP_BASE_URL` HTTPS. Il modello deve contenere `{{unsubscribe_url}}`; il link porta a una pagina di conferma e la disiscrizione viene registrata in lista e audit. Il provider riceve anche `List-Unsubscribe` e `List-Unsubscribe-Post`.
- Il pulsante UI richiede conferma esplicita e invia un batch alla volta. Lo stato campagna diventa `PARTIALLY_SENT` o `SENT` in base ai messaggi accettati dal provider.

Questi sono contratti HTTP AIDA, non integrazioni vendor già collegate. Senza URL, credenziali e provider compatibile, gli endpoint rispondono senza inviare né verificare. Prima del rilascio occorrono test end-to-end con il provider scelto e verifica dei webhook reali.


## Adapter B2B Lead Extractor

- Endpoint AIDA: `POST /api/email-campaign/lead-extractor`, autenticato e tenant-scoped.
- Configurazione server: `B2B_LEAD_EXTRACTOR_API_URL` (HTTPS) e `B2B_LEAD_EXTRACTOR_API_KEY`.
- La UI invia `campaignName` e `segmentId`. AIDA interroga il connettore con `tenantId`, `segmentId` e `limit: 50`.
- Risposta richiesta: `{ "leads": [{ "id": "lead-id", "email": "nome@azienda.it", "companyName": "...", "contactName": "...", "legalBasis": "...", "authorizationEvidenceId": "...", "suppressed": false, "unsubscribed": false }] }`.
- AIDA deduplica gli indirizzi, conserva `sourceLeadId` e crea una campagna con fonte `B2B_LEAD_EXTRACTOR`. Non accetta dal connettore stati di autorizzazione o verifica come prova: tutti i record entrano in `pending` e `unknown`, con revisione umana e verifica provider necessarie prima dell'invio.
- Il servizio esterno B2B deve applicare isolamento tenant e restituire esclusivamente record appartenenti al tenant richiesto. Il connettore è un contratto configurabile: senza endpoint e credenziali la modalità risponde 503 e non crea record simulati.
