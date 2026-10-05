# AIDA — AI Agent Platform

AIDA è una piattaforma agentica orientata agli obiettivi: trasforma un obiettivo imprenditoriale in un processo completo di analisi, pianificazione, creazione, comunicazione, vendita, delivery, supporto e ottimizzazione.

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

Repository iniziale: architettura e contratti fondamentali. Le integrazioni operative verranno implementate per fasi, con test e approval gates.

## Struttura

- `docs/` — architettura, sicurezza, agenti, knowledge e roadmap
- `packages/core/` — dominio e contratti
- `packages/agents/` — agenti
- `packages/knowledge/` — knowledge core
- `packages/channels/` — canali
- `packages/guardrails/` — sicurezza, approvazioni e audit
- `packages/crm/` — clienti e progetti
- `packages/proposals/` — offerte e regole commerciali
- `packages/scheduling/` — appuntamenti
- `packages/web-factory/` — produzione web/3D/software
- `apps/web/` — control center e portale cliente
- `apps/api/` — API e runtime

## Regola fondamentale

AIDA non deve inventare informazioni operative critiche. Se una risposta non può essere verificata dalla Knowledge Base, dalle regole commerciali o da una fonte autorizzata, deve dichiarare l'incertezza e attivare il livello di controllo previsto.
