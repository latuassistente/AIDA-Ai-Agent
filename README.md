# AIDA-Ai-Agent — Piattaforma agentica AI

**AIDA-Ai-Agent** è il nome ufficiale del sistema proprietario agentico di Valentina Loprete. La piattaforma trasforma un obiettivo imprenditoriale in un processo verificabile di analisi, pianificazione, creazione, comunicazione, vendita, delivery, supporto e ottimizzazione.

## Principi architetturali

- **Goal-oriented**: il sistema lavora verso un risultato, non verso una singola attività.
- **Multi-agent**: agenti specializzati collaborano sotto un Orchestrator.
- **Knowledge-grounded**: dati, prezzi e condizioni devono provenire da fonti verificabili.
- **Project Brain**: ogni cliente/progetto mantiene contesto, stato, comunicazioni, materiali, decisioni e KPI.
- **Omnichannel**: canali diversi condividono un'identità e una timeline unificata.
- **Human-in-the-loop**: autonomia, approvazione o handoff vengono determinati dal rischio e dall'incertezza.
- **Auditable**: azioni, decisioni, fonti e approvazioni devono essere tracciabili.
- **Provider-agnostic**: LLM, canali e servizi esterni sono integrati tramite adapter.

## Stato

Repository di sviluppo: contiene runtime iniziale, contratti, registro specialisti, catalogo servizi, documentazione e una prima dashboard. Le integrazioni operative vengono abilitate solo dopo implementazione e test verificabili.

## Struttura

- `docs/` — architettura, sicurezza, agenti, knowledge, catalogo e roadmap
- `packages/core/` — dominio, orchestrazione, pianificazione e registry
- `packages/agents/` — roster specialistico e catalogo servizi
- `packages/knowledge/` — knowledge core
- `packages/channels/` — contratti dei canali
- `packages/guardrails/` — sicurezza, approvazioni e audit
- `packages/crm/` — contesto clienti/progetti e Project Brain
- `packages/database/` — adapter di persistenza
- `packages/proposals/` — contratti per offerte
- `packages/scheduling/` — contratti per appuntamenti
- `packages/web-factory/` — contratti per produzione web/3D/software
- `apps/web/` — control center iniziale
- `prisma/` — schema database
- `tests/` — test automatici

## Regola fondamentale

AIDA-Ai-Agent non deve inventare informazioni operative critiche. Se una risposta non può essere verificata dalla Knowledge Base, dalle regole commerciali o da una fonte autorizzata, deve dichiarare l'incertezza e attivare il livello di controllo previsto.

## Fondazione runtime presente

- Goal lifecycle service con transizioni di stato e isolamento per tenant
- Orchestrator, planner, registry agenti e registry strumenti
- Policy engine con default-deny quando manca una regola esplicita
- Gate di approvazione per strumenti YELLOW e handoff umano per strumenti RED
- Audit sink in memoria e adapter PostgreSQL/Prisma
- Event bus in memoria
- Knowledge provider iniziale con filtro tenant e documenti attivi
- Schema PostgreSQL/Prisma per tenant, clienti, progetti, goal, step, knowledge, approvazioni, audit e messaggi unificati
- Test iniziali per registry agenti, catalogo servizi, goal lifecycle e gate degli strumenti
- GitHub Actions per validazione schema, generazione Prisma, typecheck e test

## Registro agenti e catalogo servizi

Il roster iniziale contiene 31 definizioni specialistiche con ID stabili. `registerDefaultAgents()` aggiorna la definizione di un agente quando l'ID esiste già e aggiunge gli agenti mancanti; il registry evita quindi duplicati per ID. Orchestrator e Planner restano componenti centrali, non agenti specialistici duplicati.

Le definizioni descrivono identità e capacità dichiarate: non dimostrano da sole che ogni funzione o integrazione esterna sia operativa. Il catalogo usa stati espliciti e le capacità non implementate e testate restano pianificate. Vedi `docs/AGENT-SYSTEM.md` e `docs/SERVICE-CATALOG-AND-CONFIGURATOR.md`.

## Interfaccia e limiti attuali

È presente una prima dashboard Next.js, non ancora una console operativa completa. Questa repository è una base di sviluppo, non un prodotto pronto per clienti. Prima della produzione vanno configurati database e segreti, eseguite migrazioni, verificate le pipeline CI e implementate le integrazioni ufficiali dei canali. Email, WhatsApp, Messenger, Instagram, TikTok, telefonia, calendari e provider LLM non vanno considerati attivi finché non siano collegati e testati.

