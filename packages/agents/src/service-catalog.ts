import { defaultAgents } from "./catalog";

export type ServiceStatus = "planned" | "configurable" | "active" | "paused";
export type ServiceRisk = "GREEN" | "YELLOW" | "RED";

export interface AidaServiceDefinition {
  id: string;
  name: string;
  family: string;
  description: string;
  agentId: string;
  status: ServiceStatus;
  riskLevel: ServiceRisk;
  dependencies: string[];
  includedInPlans: string[];
  configurable: boolean;
}

/**
 * Typed service catalog used as the source for the SaaS configurator.
 * "planned" means the product capability is defined but not yet connected
 * end-to-end. Never present it as operational until implementation and tests
 * move its status to configurable/active.
 */
export const serviceCatalog: AidaServiceDefinition[] = [
  { id: "ai.goal-orchestration", name: "Goal orchestration", family: "AI and orchestration", description: "Turn a business objective into a plan with measurable completion criteria.", agentId: "execution", status: "configurable", riskLevel: "GREEN", dependencies: [], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "ai.project-brain", name: "Project Brain", family: "AI and orchestration", description: "Keep client/project context, decisions, documents and KPI references tenant-scoped.", agentId: "business-knowledge", status: "configurable", riskLevel: "GREEN", dependencies: [], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "research.web", name: "Authorized web research", family: "Research and data", description: "Research sources and retain provenance, timestamps and evidence.", agentId: "research", status: "planned", riskLevel: "GREEN", dependencies: [], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "find.discovery", name: "FIND — ricerca e scoperta", family: "Ricerca e dati", description: "Individua candidati e risultati da fonti autorizzate, conservando provenienza e stato di verifica.", agentId: "find", status: "planned", riskLevel: "GREEN", dependencies: [], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "research.competitors", name: "Competitor analysis", family: "Research and data", description: "Compare public positioning, offers and discoverable digital presence.", agentId: "business-audit", status: "planned", riskLevel: "GREEN", dependencies: ["research.web"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "leads.discover", name: "B2B lead discovery", family: "Lead generation", description: "Discover prospects from permitted sources and configured territories/categories.", agentId: "lead-prospecting", status: "planned", riskLevel: "YELLOW", dependencies: ["research.web"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "leads.verify", name: "Lead verification and deduplication", family: "Lead generation", description: "Validate fields, normalize contacts and deduplicate using configured keys.", agentId: "lead-prospecting", status: "planned", riskLevel: "GREEN", dependencies: ["leads.discover"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "leads.export", name: "Lead export", family: "Lead generation", description: "Export approved lead records to CSV/XLSX or connected CRM.", agentId: "lead-prospecting", status: "planned", riskLevel: "YELLOW", dependencies: ["leads.verify"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "audit.digital-presence", name: "Digital presence audit", family: "Marketing and visibility", description: "Audit public website, business listings and discoverable customer touchpoints.", agentId: "business-audit", status: "planned", riskLevel: "GREEN", dependencies: ["research.web"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "marketing.strategy", name: "Marketing strategy", family: "Marketing and visibility", description: "Build positioning, audience, objectives and measurable channel plans.", agentId: "marketing-strategy", status: "planned", riskLevel: "GREEN", dependencies: ["audit.digital-presence"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "marketing.content", name: "Content and copywriting", family: "Marketing and visibility", description: "Create brand-aligned copy, editorial calendars and campaign assets.", agentId: "content", status: "planned", riskLevel: "GREEN", dependencies: [], includedInPlans: ["starter", "pro", "business", "enterprise"], configurable: true },
  { id: "marketing.social", name: "Social media planning", family: "Marketing and visibility", description: "Prepare channel-specific social plans, captions and approval-ready calendars.", agentId: "content", status: "planned", riskLevel: "YELLOW", dependencies: ["marketing.content"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "marketing.ads", name: "Advertising campaign planning", family: "Marketing and visibility", description: "Plan campaign structure, creative tests and performance targets.", agentId: "ads-campaigns", status: "planned", riskLevel: "YELLOW", dependencies: ["marketing.strategy"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "visibility.seo", name: "SEO audit and optimization", family: "Marketing and visibility", description: "Audit technical and on-page SEO and propose verifiable improvements.", agentId: "seo-geo", status: "planned", riskLevel: "GREEN", dependencies: ["audit.digital-presence"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "visibility.geo", name: "GEO optimization", family: "Marketing and visibility", description: "Structure content for clarity and discoverability by generative search systems without ranking guarantees.", agentId: "seo-geo", status: "planned", riskLevel: "GREEN", dependencies: ["visibility.seo"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "web.presentation", name: "Presentation website", family: "AIDA Web Studio", description: "Plan a responsive business presentation website.", agentId: "web", status: "planned", riskLevel: "YELLOW", dependencies: ["visibility.seo"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "web.landing-page", name: "Landing page", family: "AIDA Web Studio", description: "Plan a conversion-focused landing page with measurable goals.", agentId: "web", status: "planned", riskLevel: "YELLOW", dependencies: [], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "web.ecommerce", name: "E-commerce", family: "AIDA Web Studio", description: "Plan a product catalog, checkout, payments and order workflow.", agentId: "web", status: "planned", riskLevel: "YELLOW", dependencies: ["integration.api", "qa.validation"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "web.portal", name: "Portal or web application", family: "AIDA Web Studio", description: "Plan authenticated portals and custom web application experiences.", agentId: "web", status: "planned", riskLevel: "YELLOW", dependencies: ["software.automation"], includedInPlans: ["enterprise"], configurable: true },
  { id: "web.experience-3d", name: "3D website experience", family: "AIDA Web Studio", description: "Plan immersive 3D interactions with accessibility and performance constraints.", agentId: "3d-4d-experience", status: "planned", riskLevel: "YELLOW", dependencies: ["web.presentation"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "web.experience-4d", name: "4D interactive experience", family: "AIDA Web Studio", description: "Plan time-based or interactive immersive experiences with explicit performance budgets.", agentId: "3d-4d-experience", status: "planned", riskLevel: "YELLOW", dependencies: ["web.experience-3d"], includedInPlans: ["enterprise"], configurable: true },
  { id: "software.automation", name: "Business process automation", family: "Software and integrations", description: "Design repeatable automations with failure handling, logs and approval gates.", agentId: "software", status: "planned", riskLevel: "YELLOW", dependencies: [], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "integration.api", name: "API and webhook integration", family: "Software and integrations", description: "Map data and configure approved APIs/webhooks without exposing secrets.", agentId: "integration", status: "planned", riskLevel: "YELLOW", dependencies: ["security.permissions"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "communications.email", name: "Email marketing", family: "Omnichannel communications", description: "Prepare segmented email campaigns and approval-ready sends through a connected provider.", agentId: "omnichannel-communications", status: "planned", riskLevel: "YELLOW", dependencies: ["integration.api"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "communications.whatsapp", name: "WhatsApp workflows", family: "Omnichannel communications", description: "Prepare and route WhatsApp workflows through an approved official provider.", agentId: "omnichannel-communications", status: "planned", riskLevel: "YELLOW", dependencies: ["integration.api"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "communications.social", name: "Social messaging", family: "Omnichannel communications", description: "Coordinate supported social inbox workflows through configured official integrations.", agentId: "omnichannel-communications", status: "planned", riskLevel: "YELLOW", dependencies: ["integration.api"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "support.customer-care", name: "Customer care", family: "Customer lifecycle", description: "Answer supported questions using approved knowledge and escalate uncertainty.", agentId: "customer-support", status: "planned", riskLevel: "YELLOW", dependencies: ["ai.project-brain"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "support.customer-success", name: "Customer onboarding and success", family: "Customer lifecycle", description: "Coordinate onboarding, adoption checks and customer health follow-up.", agentId: "customer-success", status: "planned", riskLevel: "YELLOW", dependencies: ["ai.project-brain"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "voice.telephony", name: "Voice and telephony workflows", family: "Voice and scheduling", description: "Plan IVR, call routing, summaries and provider-controlled telephony actions.", agentId: "voice", status: "planned", riskLevel: "YELLOW", dependencies: ["integration.api"], includedInPlans: ["enterprise"], configurable: true },
  { id: "calendar.appointments", name: "Appointments and scheduling", family: "Appointments and reservations", description: "Check connected calendar availability, account for time zones and conflicts, propose slots, and create, reschedule or cancel appointments only with the required permissions and provider confirmation.", agentId: "appointment", status: "planned", riskLevel: "YELLOW", dependencies: ["integration.api"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "booking.reservations", name: "BOOKING — prenotazioni e conferme", family: "Appuntamenti e prenotazioni", description: "Cerca disponibilità presso provider configurati e gestisce prenotazioni soltanto dopo conferma reale e autorizzazione prevista.", agentId: "booking", status: "planned", riskLevel: "YELLOW", dependencies: ["calendar.appointments"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "sales.pipeline", name: "Sales pipeline", family: "Sales and administration", description: "Coordinate qualification, pipeline stages and follow-up drafts.", agentId: "sales", status: "planned", riskLevel: "YELLOW", dependencies: ["integration.api"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "sales.proposals", name: "Proposals and quotations", family: "Sales and administration", description: "Prepare offers from approved service catalogs, prices and terms.", agentId: "proposal-quote", status: "planned", riskLevel: "YELLOW", dependencies: ["sales.pipeline"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "operations.projects", name: "Project delivery management", family: "Sales and administration", description: "Track deliverables, milestones, dependencies and blockers.", agentId: "delivery-project", status: "planned", riskLevel: "GREEN", dependencies: ["ai.project-brain"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "analytics.dashboard", name: "KPI dashboard and reporting", family: "Analytics and operations", description: "Prepare KPI summaries, trends and decision-support reports.", agentId: "analytics", status: "planned", riskLevel: "GREEN", dependencies: [], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "documents.management", name: "Documenti e archivi aziendali", family: "Documenti e amministrazione", description: "Crea, estrae, classifica e confronta documenti; OCR e firma elettronica sono disponibili solo se collegati provider compatibili.", agentId: "document", status: "planned", riskLevel: "YELLOW", dependencies: ["security.permissions"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "legal.review-support", name: "Supporto documentale legale", family: "Documenti e conformità", description: "Organizza ricerca, checklist contrattuali, confronto clausole e scadenze; non sostituisce il parere di un professionista qualificato.", agentId: "legal-support", status: "planned", riskLevel: "YELLOW", dependencies: ["documents.management", "security.permissions"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "operations.admin", name: "Administrative workflows", family: "Analytics and operations", description: "Coordinate document classification and routine administrative procedures.", agentId: "finance-admin", status: "planned", riskLevel: "YELLOW", dependencies: ["security.permissions"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "training.learning", name: "Training and learning paths", family: "Training and compliance", description: "Create tutorials, guided learning paths and knowledge checks.", agentId: "training-knowledge", status: "planned", riskLevel: "GREEN", dependencies: ["ai.project-brain"], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "security.permissions", name: "Permissions and compliance checks", family: "Security and compliance", description: "Review role permissions, tenant isolation, data minimization, retention rules, consent/suppression controls and audit evidence.", agentId: "security-compliance", status: "configurable", riskLevel: "GREEN", dependencies: [], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "translation.multilingual", name: "Traduzione e localizzazione multilingua", family: "Contenuti e localizzazione", description: "Traduce e localizza contenuti mantenendo significato, tono di brand, glossari, terminologia e formati locali; segnala le ambiguità da sottoporre a revisione.", agentId: "translation-localization", status: "planned", riskLevel: "GREEN", dependencies: [], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "ai.prompt-engineering", name: "Prompt Engineering AI", family: "AI e qualità", description: "Progetta, versiona e valuta prompt con casi di test, criteri di qualità, controlli contro prompt injection e documentazione delle modifiche.", agentId: "prompt-engineering", status: "planned", riskLevel: "GREEN", dependencies: ["qa.validation"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "operations.backup-recovery", name: "Backup e ripristino", family: "Operations e continuità", description: "Controlla evidenze dei backup, integrità, retention e prove di ripristino; lo stato recuperabile è confermato soltanto da un test di restore registrato.", agentId: "backup-recovery", status: "planned", riskLevel: "YELLOW", dependencies: ["security.permissions"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "ai.agent-quality-oversight", name: "Controllo qualità e supervisione agenti AI", family: "AI e qualità", description: "Valuta output, capacità dichiarate, permessi, regressioni e corretto comportamento di escalation; registra anomalie e richieste di correzione.", agentId: "agent-quality-oversight", status: "planned", riskLevel: "YELLOW", dependencies: ["qa.validation", "security.permissions"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "operations.proactive-monitoring", name: "Monitoraggio proattivo e avvisi", family: "Operations e continuità", description: "Coordina controlli autorizzati, correla e deduplica alert, assegna priorità e mantiene lo storico delle notifiche e delle evidenze.", agentId: "proactive-monitoring", status: "planned", riskLevel: "YELLOW", dependencies: ["integration.api", "security.permissions"], includedInPlans: ["business", "enterprise"], configurable: true },
  { id: "qa.validation", name: "Quality assurance", family: "Quality and delivery", description: "Validate deliverables against acceptance criteria and report tested coverage.", agentId: "quality-assurance", status: "configurable", riskLevel: "GREEN", dependencies: [], includedInPlans: ["pro", "business", "enterprise"], configurable: true },
  { id: "human.approval", name: "Human approval and handoff", family: "Quality and delivery", description: "Pause high-impact actions for approval and package context for human handoff.", agentId: "human-handoff", status: "configurable", riskLevel: "RED", dependencies: ["security.permissions"], includedInPlans: ["business", "enterprise"], configurable: true },
];

export function getServiceById(serviceId: string): AidaServiceDefinition | undefined {
  return serviceCatalog.find((service) => service.id === serviceId);
}

export function validateServiceCatalog(): string[] {
  const errors: string[] = [];
  const serviceIds = new Set<string>();
  const agentIds = new Set(defaultAgents.map((agent) => agent.id));
  for (const service of serviceCatalog) {
    if (serviceIds.has(service.id)) errors.push(`Duplicate service ID: ${service.id}`);
    serviceIds.add(service.id);
    if (!agentIds.has(service.agentId)) errors.push(`Unknown agent ${service.agentId} for service ${service.id}`);
    for (const dependency of service.dependencies) {
      if (!serviceIds.has(dependency) && !serviceCatalog.some((candidate) => candidate.id === dependency)) {
        errors.push(`Unknown dependency ${dependency} for service ${service.id}`);
      }
    }
  }
  return errors;
}


export interface ServiceConfigurationResult {
  valid: boolean;
  plan: string;
  services: AidaServiceDefinition[];
  automaticallyIncludedDependencies: string[];
  errors: string[];
}

export interface ServiceConfigurationOptions {
  /** Optional tenant-allowed service IDs. Omitted means no additional tenant restriction. */
  allowedServiceIds?: string[];
  /** Optional tenant-denied service IDs. Deny takes precedence over allow. */
  deniedServiceIds?: string[];
  /** Services explicitly paused by an administrator or tenant policy. */
  pausedServiceIds?: string[];
  /** Service IDs for which the required provider/integration is configured. */
  configuredIntegrationServiceIds?: string[];
  /** Services whose configured provider was verified by a successful health check. */
  verifiedIntegrationServiceIds?: string[];
}

export interface ServiceConfigurationSummary {
  selectedServiceIds: string[];
  automaticallyIncludedDependencies: string[];
  excludedServiceIds: string[];
  plannedServiceIds: string[];
  needsConfigurationServiceIds: string[];
  activeReadyServiceIds: string[];
}

/**
 * Resolves a selected service set against plan access, dependency closure,
 * tenant allow/deny policy, paused state, and integration readiness.
 * This function prepares a configuration only; it never activates providers.
 */
export function configureServices(
  selectedServiceIds: string[],
  plan: string,
  options: ServiceConfigurationOptions = {},
): ServiceConfigurationResult {
  const errors: string[] = [];
  const included = new Set<string>();
  const explicit = new Set(selectedServiceIds);
  const autoIncluded = new Set<string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const allowed = options.allowedServiceIds ? new Set(options.allowedServiceIds) : undefined;
  const denied = new Set(options.deniedServiceIds ?? []);
  const paused = new Set(options.pausedServiceIds ?? []);

  const addService = (serviceId: string, parent?: string): void => {
    const service = getServiceById(serviceId);
    if (!service) {
      errors.push(`Unknown service: ${serviceId}`);
      return;
    }
    if (denied.has(serviceId) || (allowed && !allowed.has(serviceId))) {
      errors.push(`Service ${serviceId} is not authorized for this tenant`);
      return;
    }
    if (paused.has(serviceId) || service.status === "paused") {
      errors.push(`Service ${serviceId} is paused`);
      return;
    }
    if (!service.includedInPlans.includes(plan)) {
      errors.push(`Service ${serviceId} is not available on plan ${plan}`);
      return;
    }
    if (visiting.has(serviceId)) {
      errors.push(`Circular service dependency detected at ${serviceId}`);
      return;
    }
    if (visited.has(serviceId)) return;
    visiting.add(serviceId);
    for (const dependency of service.dependencies) addService(dependency, serviceId);
    visiting.delete(serviceId);
    visited.add(serviceId);
    included.add(serviceId);
    if (parent && !explicit.has(serviceId)) autoIncluded.add(serviceId);
  };

  for (const serviceId of selectedServiceIds) addService(serviceId);
  const services = serviceCatalog.filter((service) => included.has(service.id));
  return {
    valid: errors.length === 0,
    plan,
    services,
    automaticallyIncludedDependencies: [...autoIncluded],
    errors: [...new Set(errors)],
  };
}

/** Summarizes readiness without promoting a planned service to active. */
export function summarizeServiceConfiguration(
  result: ServiceConfigurationResult,
  options: Pick<ServiceConfigurationOptions, "configuredIntegrationServiceIds" | "verifiedIntegrationServiceIds" | "pausedServiceIds"> = {},
): ServiceConfigurationSummary {
  const configured = new Set(options.configuredIntegrationServiceIds ?? []);
  const verified = new Set(options.verifiedIntegrationServiceIds ?? []);
  const paused = new Set(options.pausedServiceIds ?? []);
  const excludedServiceIds = result.services
    .filter((service) => paused.has(service.id) || service.status === "paused")
    .map((service) => service.id);
  const plannedServiceIds = result.services
    .filter((service) => service.status === "planned" && !excludedServiceIds.includes(service.id))
    .map((service) => service.id);
  const needsConfigurationServiceIds = result.services
    .filter((service) => service.status === "configurable" && !configured.has(service.id) && !excludedServiceIds.includes(service.id))
    .map((service) => service.id);
  const activeReadyServiceIds = result.services
    .filter((service) => service.status === "active" && configured.has(service.id) && verified.has(service.id) && !excludedServiceIds.includes(service.id))
    .map((service) => service.id);
  return {
    selectedServiceIds: result.services.filter((service) => !result.automaticallyIncludedDependencies.includes(service.id)).map((service) => service.id),
    automaticallyIncludedDependencies: [...result.automaticallyIncludedDependencies],
    excludedServiceIds,
    plannedServiceIds,
    needsConfigurationServiceIds,
    activeReadyServiceIds,
  };
}
