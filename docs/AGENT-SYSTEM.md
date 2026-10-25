# AIDA-Ai-Agent — Sistema agentico

## Coordinamento centrale

- **Orchestrator**: mantiene l'obiettivo globale, coordina le fasi, gestisce deleghe, stato, approvazioni e sintesi finale.
- **Planner**: scompone l'obiettivo in passaggi verificabili, dipendenze e criteri di completamento.

Orchestrator e Planner sono componenti centrali del runtime: non devono essere duplicati come agenti specialistici indipendenti.

## Roster specialistico predefinito

Gli ID sono stabili. Se un ID è già registrato, la definizione predefinita lo aggiorna; se manca, viene aggiunto. La riconciliazione avviene tramite `registerDefaultAgents()` e non deve produrre doppioni per ID.

1. Business Knowledge Agent — conoscenza, fonti e policy
2. Research Agent — ricerca autorizzata e verifica delle fonti
3. Lead and Prospecting Agent — scoperta, arricchimento, verifica e deduplicazione lead
4. Business Audit Agent — audit digitale e opportunità verificabili
5. Marketing Strategy Agent — strategia e posizionamento
6. Content and Copy Agent — copy, contenuti e piano editoriale
7. Advertising Campaign Agent — pianificazione e analisi campagne
8. SEO and GEO Agent — SEO tecnica/locale e visibilità generativa
9. Web Studio Agent — siti, landing page, portali e applicazioni web
10. 3D and 4D Experience Agent — esperienze immersive
11. Software and Automation Agent — software e automazioni
12. QA and Test Agent — test, validazione e regressioni
13. Omnichannel Communications Agent — flussi di comunicazione su canali autorizzati
14. Customer Support Agent — assistenza e triage ticket
15. Voice and Telephony Agent — telefonia, IVR e riepiloghi chiamate
16. Appointment and Scheduling Agent — disponibilità e prenotazioni
17. Proposal and Quotation Agent — offerte e preventivi da regole approvate
18. Sales and CRM Agent — qualificazione, pipeline e follow-up
19. Customer Success Agent — onboarding, adozione e rinnovi
20. Delivery and Project Agent — progetti, scadenze e blocchi
21. Analytics and BI Agent — KPI, analisi e reportistica
22. Business Operations Agent — procedure e flussi operativi
23. Finance and Administration Agent — amministrazione e report finanziari autorizzati
24. HR and Recruiting Agent — supporto ai processi HR con revisione umana delle decisioni
25. Training and Professor Tech Agent — formazione, tutorial e verifiche
26. Integration and API Agent — API, webhook e sincronizzazione dati
27. Security and Compliance Agent — sicurezza, permessi e conformità
28. Human Handoff Agent — preparazione del contesto e trasferimento a una persona
29. Execution Agent — esecuzione di strumenti registrati e autorizzati

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
