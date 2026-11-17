# EMAIL CAMPAIGN AI — modalità destinatari, verifica e report

## Modalità di alimentazione destinatari

La campagna supporta due modalità selezionabili:

1. **Caricamento manuale**: upload di una lista CSV o XLSX nell'interfaccia. L'importazione deve mostrare anteprima, mappatura colonne, righe non valide, duplicati e campi mancanti prima del salvataggio. La lista conserva il file sorgente, il tenant, la data di importazione e la provenienza dei singoli record.
2. **Collegamento B2B Lead Extractor AI**: selezione di una ricerca, segmento o archivio prodotto dall'agente B2B. L'integrazione passa gli ID dei record e non copia contatti che non abbiano superato il controllo di idoneità al marketing. I record importati mantengono il riferimento al lead originale.

Le due modalità confluiscono nello stesso controllo di idoneità, deduplicazione e verifica. La sola presenza di un indirizzo email in un file o su una pagina pubblica non lo rende automaticamente utilizzabile per una campagna.

## Verifica degli indirizzi

La verifica deve essere eseguita da un provider collegato e registrare provider, data, esito e motivazione. Stati ammessi: `valid`, `invalid`, `unknown`, `risky`. Il controllo locale della sintassi non dimostra che una casella esista. I controlli DNS/MX attestano la configurazione del dominio, non la singola casella. Il sistema non deve dichiarare una casella "attiva" senza un risultato attendibile del provider; non deve simulare verifiche SMTP invasive né inviare messaggi di prova a destinatari non autorizzati.

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
| Positive | Risposte classificate positive, con evidenza e classificazione registrata |
| KO | Risposte o contatti classificati KO, con evidenza e motivazione |
| In attesa | Risposte non ancora classificate o nessun esito registrato |

**Limite di misurazione:** il sistema non può certificare che un'email sia stata letta. Le aperture sono un indicatore tecnico non affidabile in assoluto perché alcuni client bloccano o precaricano i pixel. Il rilevamento delle risposte richiede una casella collegata via OAuth/API o un provider che esponga gli eventi pertinenti. Positivo e KO devono derivare da una risposta esplicita o da una classificazione manuale approvata, non da una semplice apertura o mancata risposta.

## Stato implementativo

Il modulo contiene la logica pura di idoneità destinatari e aggregazione report. Upload UI, parsing XLSX, storage multi-tenant, verifica provider, renderer HTML, provider di invio, webhook e inbox sync richiedono i rispettivi adapter e test end-to-end prima che il servizio possa essere marcato operativo.

## Prima implementazione registrata nel repository

- Editor bozza per oggetto e HTML, con modello responsive iniziale, anteprima isolata tramite iframe sandbox e salvataggio autenticato/tenant-scoped; la modifica è consentita solo alle campagne in stato DRAFT.

- Workspace web con selezione tra upload CSV e modalità B2B Lead Extractor (quest'ultima resta in attesa del connettore runtime).
- Endpoint autenticato e tenant-scoped per import CSV, con limite di 5 MB e 10.000 righe, deduplicazione email e audit log.
- Persistenza PostgreSQL per campagne, destinatari ed eventi, con migration Prisma.
- Endpoint report tenant-scoped per inviate, consegnate, bounce, aperture rilevate, clic, risposte, positive, KO e in attesa.
- Contratti provider per verifica email, invio e sincronizzazione risposte; renderer HTML responsive con escaping e validazione URL.

L'upload attualmente accetta CSV. XLSX, provider di verifica, provider di invio, webhook eventi, inbox/reply sync e adapter B2B restano da integrare. L'importazione crea una campagna in bozza e non invia messaggi.
