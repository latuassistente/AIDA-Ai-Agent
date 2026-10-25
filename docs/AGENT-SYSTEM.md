# AIDA-Ai-Agent — Sistema agentico

## Coordinamento centrale

- **Orchestrator**: mantiene l'obiettivo globale, coordina le fasi, gestisce deleghe, stato, approvazioni e sintesi finale.
- **Planner**: scompone l'obiettivo in passaggi verificabili, dipendenze e criteri di completamento.

Orchestrator e Planner sono componenti centrali del runtime: non devono essere duplicati come agenti specialistici indipendenti.

## Roster specialistico predefinito

1. Business Knowledge Agent — conoscenza, fonti e policy
2. Research Agent — ricerca, analisi e verifica delle fonti autorizzate
3. FIND Agent — scoperta di attività, record e risultati con provenienza delle fonti
4. Lead and Prospecting Agent — qualificazione, arricchimento, verifica e deduplicazione lead
5. Business Audit Agent — audit digitale e opportunità verificabili
6. Marketing Strategy Agent — positioning, funnel, email marketing, campaigns and measurable channel plans
7. Content and Copy Agent — copywriting, social media strategy, editorial calendars, creative briefs and approval-ready community replies
8. Advertising Campaign Agent — pianificazione e analisi campagne
9. SEO and GEO Agent — SEO tecnica/locale e visibilità generativa
10. Web Studio Agent — siti, landing page, portali e applicazioni web
11. 3D and 4D Experience Agent — esperienze immersive
12. Software and Automation Agent — software e automazioni
13. QA and Test Agent — test, validazione e regressioni
14. Omnichannel Communications Agent — flussi di comunicazione su canali autorizzati
15. Customer Support Agent — assistenza e triage ticket
16. Voice and Telephony Agent — inbound reception, approved outbound calls, SIP/IVR routing, call summaries and callbacks
17. Appointment and Scheduling Agent — coordinamento calendari e slot
18. BOOKING Agent — prenotazioni tramite provider configurati e verifica della conferma reale
19. Proposal and Quotation Agent — offerte e preventivi da regole approvate
20. Sales and CRM Agent — qualificazione, pipeline e follow-up
21. Customer Success Agent — onboarding, adozione e rinnovi
22. Delivery and Project Agent — progetti, scadenze e blocchi
23. Analytics and BI Agent — KPI, analisi e reportistica
24. Business Operations Agent — workflows, SOPs, task management, executive briefings, inbox triage, calendar coordination and administrative follow-up
26. Document and Records Agent — document creation/extraction, OCR-enabled workflows, classification, version comparison and records metadata
27. Legal Support Agent — legal research, contract checklists, clause comparisons and deadlines, with qualified human review for legal conclusions
25. Finance and Administration Agent — amministrazione e report finanziari autorizzati
28. HR and Recruiting Agent — supporto ai processi HR con revisione umana delle decisioni
29. Training and Professor Tech Agent — formazione, tutorial e verifiche
30. Integration and API Agent — API, webhook e sincronizzazione dati
31. Security and Compliance Agent — sicurezza, permessi e conformità
32. Human Handoff Agent — preparazione del contesto e trasferimento a una persona
33. Execution Agent — esecuzione di strumenti registrati e autorizzati
34. Prompt Engineering Agent — progettazione, versionamento e test dei prompt
35. Translation and Localization Agent — traduzione, glossari, localizzazione e controllo terminologico
36. Backup and Recovery Agent — verifica evidenze di backup e coordinamento dei test di ripristino
37. Agent Quality and Oversight Agent — valutazione degli output, permessi, regressioni ed escalation degli agenti
38. Proactive Monitoring and Alerts Agent — controlli autorizzati, correlazione, priorità e deduplicazione degli alert

Il roster runtime contiene 38 agenti specialistici. Le responsabilità già coperte vengono integrate nei ruoli esistenti; sono stati aggiunti soltanto specialisti con responsabilità distinte. Orchestrator e Planner restano componenti centrali e non sono duplicati come specialisti.

La fonte tecnica del roster è `packages/agents/src/catalog.ts`. Il catalogo servizi è in `packages/agents/src/service-catalog.ts`.

## Contratto minimo e responsabilità

Ogni agente deve dichiarare identità, capacità, input richiesti, strumenti consentiti, livello di rischio, output strutturato, requisiti di validazione ed eventi che richiedono escalation. Gli agenti ricevono incarichi delimitati e restituiscono risultati verificabili al coordinatore; non ridefiniscono autonomamente l'obiettivo globale.

## Livelli di autonomia

- **GREEN** — azioni a basso rischio consentite dalla policy.
- **YELLOW** — approvazione umana prima dell'esecuzione quando richiesta dalla policy.
- **RED** — handoff a una persona; niente esecuzione autonoma dell'azione critica.

La classificazione si applica alla singola azione e allo strumento, non soltanto al nome dell'agente.

## Limite di stato

La presenza di un agente nel roster prova soltanto che la sua definizione è registrata. Non prova che tutte le sue capacità siano implementate o collegate a provider reali. Ogni servizio deve essere classificato secondo il suo stato effettivo, testato e verificato prima di essere mostrato come operativo.
