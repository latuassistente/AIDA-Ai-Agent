# AIDA-Ai-Agent — Catalogo universale dei servizi e configuratore SaaS

## Obiettivo di prodotto

AIDA-Ai-Agent è il sistema proprietario agentico di Valentina Loprete: un control plane che interpreta obiettivi, coordina agenti specializzati, utilizza strumenti autorizzati, verifica i risultati e mantiene memoria e audit per cliente/progetto.

Il prodotto SaaS derivato deve essere modulare, personalizzabile, vendibile e white-label. Il sistema proprietario mantiene il catalogo completo; ogni tenant SaaS può attivare solo i moduli inclusi nel proprio piano e autorizzati dall'amministratore. AIDA CRM resta un prodotto distinto e può essere collegato tramite API/adapter, non assorbito implicitamente in questo repository.

## Stato verificato del repository

Il repository contiene una fondazione tecnica, un registro predefinito di 29 agenti specialistici, un catalogo tipizzato di servizi, controlli di configurazione per piano/dipendenze e test automatici iniziali. La dashboard è ancora una prima control center. La presenza di agenti o servizi nel catalogo non dimostra che ogni funzionalità o integrazione esterna sia operativa.

## Aree del catalogo

Il catalogo è progettato per crescere fino a circa 180 servizi, organizzati almeno in queste 18 famiglie. Il numero è un obiettivo di catalogo, non una dichiarazione che tutti i servizi siano già implementati.

1. Intelligenza artificiale, orchestrazione e pianificazione
2. Ricerca, monitoraggio e raccolta dati autorizzata
3. Lead generation, arricchimento, verifica e deduplicazione
4. CRM, pipeline, vendite e follow-up
5. Marketing strategico e campagne
6. Contenuti, copywriting e calendario editoriale
7. Advertising e gestione campagne
8. SEO, SEO locale, GEO e visibilità digitale
9. Sviluppo web, siti, landing page e portali
10. Esperienze 3D/4D, e-commerce e pagamenti
11. Software, API, integrazioni e automazioni
12. Comunicazioni omnicanale ed email marketing
13. Customer care, ticket e customer success
14. Voce, telefonia, dialer e call center
15. Appuntamenti, calendari e prenotazioni
16. Gestione aziendale, progetti, documenti e procedure
17. Analytics, KPI, reportistica e BI
18. Risorse umane, recruiting, formazione, sicurezza e amministrazione

Le famiglie possono contenere più servizi e agenti. Non creare un agente separato per ogni microfunzione se la funzione è più correttamente un servizio/tool governato da un agente specialista.

## Scheda obbligatoria di ogni servizio

Ogni voce di catalogo deve dichiarare almeno:

- `id` stabile e univoco; nome e descrizione comprensibili
- famiglia e categoria; agente responsabile; dipendenze
- funzioni incluse ed escluse
- input richiesti, output strutturati e criteri di successo
- strumenti e integrazioni richiesti, stato reale di ciascuna integrazione
- permessi, livello di rischio GREEN/YELLOW/RED e approvazioni
- prezzo, unità di consumo, limiti del piano e modalità di fatturazione
- versione, stato del servizio (planned, configurable, active, paused)
- disponibilità per piano/tenant e configurazione white-label
- test automatici, controlli qualità, logging, metriche ed evidenze
- gestione errori, fallback e condizioni di passaggio a un operatore umano

Prezzi, quote e limiti devono provenire da configurazioni amministrative versionate, non essere inventati dall'agente.

## Configuratore SaaS

Il configuratore deve consentire di selezionare servizi singoli o pacchetti, visualizzare prerequisiti e dipendenze, stimare costi/consumi, abilitare/disabilitare moduli e configurare permessi. Deve distinguere chiaramente:

- disponibile e testato;
- disponibile ma da configurare;
- pianificato/non ancora implementato;
- in pausa;
- non disponibile per il piano o per mancanza di autorizzazioni.

Ogni tenant ha dati, memoria, segreti, configurazioni, audit e permessi isolati. Il proprietario del sistema può vedere e amministrare il catalogo globale; i clienti vedono solo le funzioni consentite dal piano e dal proprio ruolo. La modalità semplice mostra gli obiettivi e le azioni principali; la modalità avanzata/Pro mostra agenti, workflow, dipendenze, log, configurazioni e controlli.

## AIDA Web Studio — configuratore indipendente

Il configuratore Web Studio deve offrire:

### Tipologia
- sito vetrina/presentazione
- landing page
- sito aziendale multipagina
- blog/editoriale
- e-commerce
- portale o applicazione web
- area riservata

### Esperienza visiva
- 2D
- 3D
- 4D/esperienza immersiva interattiva

La scelta 3D/4D deve mostrare l'impatto previsto su complessità, prestazioni, accessibilità, tempi e costo.

### Visibilità
- SEO base
- SEO avanzata
- SEO + GEO
- SEO + GEO avanzata

Nessuna opzione deve promettere posizionamenti o citazioni garantite.

### Funzionalità aggiuntive
Contatti e moduli, WhatsApp, prenotazioni, blog, e-commerce e pagamenti, chatbot/agenti AI, multilingua, analytics, area riservata, CRM/follow-up, integrazioni e automazioni. Il configuratore deve indicare dipendenze e costi aggiuntivi.

### Gestione
- autonomo
- assistito da agenti AI con approvazioni
- gestione continuativa con supervisione umana

Il risultato deve essere una configurazione leggibile con riepilogo funzionale, moduli selezionati, dipendenze, stima economica, limiti e prossimi passi. Generazione, test, pubblicazione, acquisti e invii esterni restano soggetti a permessi e approvazioni esplicite.

## Team di agenti

Il roster tecnico ufficiale è mantenuto in `packages/agents/src/catalog.ts` e documentato in `docs/AGENT-SYSTEM.md`. Comprende 29 agenti specialistici: Business Knowledge, Research, Lead/Prospecting, Business Audit, Marketing Strategy, Content/Copy, Advertising Campaigns, SEO/GEO, Web Studio, 3D/4D Experience, Software/Automation, QA/Test, Omnichannel Communications, Customer Support, Voice/Telephony, Appointment/Scheduling, Proposal/Quotation, Sales/CRM, Customer Success, Delivery/Project, Analytics/BI, Business Operations, Finance/Administration, HR/Recruiting, Training/Professor Tech, Integration/API, Security/Compliance, Human Handoff ed Execution.

Orchestrator e Planner sono componenti centrali di coordinamento, non specialisti autonomi in concorrenza tra loro. Gli specialisti non ridefiniscono l'obiettivo globale: ricevono un incarico delimitato, producono risultati strutturati e restituiscono evidenze al coordinatore.

## Regole non negoziabili

- Isolamento multi-tenant e controllo autorizzazioni prima di ogni tool.
- Default-deny: strumenti non registrati o non autorizzati non possono essere eseguiti.
- Azioni esterne, invii, pubblicazioni, spese e modifiche irreversibili richiedono l'approvazione prevista dalla policy.
- Rispetto delle API ufficiali, condizioni dei provider, privacy, opposizioni e liste di soppressione.
- Tracciabilità di input, fonti, decisioni, approvazioni, output ed errori.
- Nessun agente deve dichiarare completata un'operazione senza un risultato verificabile.
- Nessuna capacità va presentata come operativa se è solo documentata o registrata nel catalogo.

## Sequenza di implementazione

1. Mantenere e testare il roster agenti, i contratti strutturati e la riconciliazione senza duplicati.
2. Ampliare e testare il catalogo servizi e il configuratore con stato, dipendenze, permessi e piani.
3. Collegare workflow/orchestratore, database persistente, memoria e audit end-to-end.
4. Realizzare la base SaaS: autenticazione, ruoli, tenant isolation, piani e configurazione white-label.
5. Implementare AIDA Web Studio e il suo configuratore indipendente.
6. Collegare provider AI e integrazioni ufficiali una alla volta, con test reali e gestione dei segreti.
7. Abilitare progressivamente autonomia e azioni esterne solo dopo verifiche, test e controlli di sicurezza.
