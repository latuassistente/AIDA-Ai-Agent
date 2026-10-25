import type { AgentDefinition } from "../../core/src/contracts";

/**
 * Default specialist roster for AIDA-Ai-Agent.
 *
 * These entries register agent identities and declared capabilities. They are
 * not, by themselves, proof that each provider/tool integration is implemented.
 * External actions must still pass through the tool registry, policy engine,
 * tenant-scoped context, approval gates and audit trail.
 */
export const defaultAgents: AgentDefinition[] = [
  {
    id: "business-knowledge",
    name: "Business Knowledge Agent",
    description: "Retrieves, grounds and validates business knowledge, policies, prices and source evidence.",
    capabilities: ["knowledge.search", "knowledge.validate", "knowledge.policy-check", "knowledge.ingest", "knowledge.versioning", "knowledge.rag", "knowledge.memory-context", "knowledge.source-citations"],
    riskLevel: "GREEN",
  },
  {
    id: "research",
    name: "Research Agent",
    description: "Researches authorized internal and external sources, records provenance and distinguishes facts from assumptions.",
    capabilities: ["research", "research.source-check", "research.summarize"],
    riskLevel: "GREEN",
  },
  {
    id: "find",
    name: "FIND Agent",
    description: "Discovers businesses, people, records and relevant information from authorized sources; returns sourced candidates for downstream validation.",
    capabilities: ["find.discover", "find.search", "find.source-provenance", "find.candidate-list"],
    riskLevel: "GREEN",
  },
  {
    id: "lead-prospecting",
    name: "Lead and Prospecting Agent",
    description: "Finds, enriches, verifies and qualifies business prospects while applying source, consent, suppression and deduplication rules.",
    capabilities: ["leads.discover", "leads.enrich", "leads.verify", "leads.deduplicate", "leads.qualify"],
    riskLevel: "YELLOW",
  },
  {
    id: "business-audit",
    name: "Business Audit Agent",
    description: "Audits public digital presence, websites, local visibility, customer journeys and verifiable improvement opportunities.",
    capabilities: ["audit.website", "audit.local-visibility", "audit.accessibility", "audit.opportunity-report"],
    riskLevel: "GREEN",
  },
  {
    id: "marketing-strategy",
    name: "Marketing Strategy Agent",
    description: "Builds measurable marketing plans, positioning, campaigns, audience hypotheses and channel strategies.",
    capabilities: ["marketing.strategy", "marketing.positioning", "marketing.campaign-plan", "marketing.funnel", "marketing.email-marketing", "marketing.lifecycle", "marketing.metrics"],
    riskLevel: "GREEN",
  },
  {
    id: "content",
    name: "Content and Copy Agent",
    description: "Creates and adapts copy, editorial plans, social content, email copy and campaign assets to brand rules.",
    capabilities: ["content.write", "content.adapt", "content.editorial-plan", "content.brand-check", "social.strategy", "social.calendar", "social.copy", "social.creative-brief", "social.community-response-draft"],
    riskLevel: "GREEN",
  },
  {
    id: "ads-campaigns",
    name: "Advertising Campaign Agent",
    description: "Plans and monitors paid campaign structures, creative variants, budgets and performance recommendations.",
    capabilities: ["ads.plan", "ads.analyze", "ads.optimize-recommendation", "ads.google", "ads.meta", "ads.budget-forecast", "ads.conversion-tracking-plan"],
    riskLevel: "YELLOW",
  },
  {
    id: "seo-geo",
    name: "SEO and GEO Agent",
    description: "Audits and improves technical SEO, local SEO, structured content and generative-engine discoverability.",
    capabilities: ["seo.audit", "seo.optimize", "geo.optimize", "seo.structured-data"],
    riskLevel: "GREEN",
  },
  {
    id: "web",
    name: "Web Studio Agent",
    description: "Plans and creates responsive presentation websites, landing pages, corporate sites, blogs, portals and web applications.",
    capabilities: ["web.plan", "web.generate", "web.responsive-check", "web.accessibility-check", "web.ecommerce-plan", "web.multilingual", "web.analytics-plan", "web.deployment-plan"],
    riskLevel: "YELLOW",
  },
  {
    id: "3d-4d-experience",
    name: "3D and 4D Experience Agent",
    description: "Designs immersive 3D/4D website experiences, interactions and performance-aware visual concepts.",
    capabilities: ["web.3d-plan", "web.3d-generate", "web.immersive-experience"],
    riskLevel: "YELLOW",
  },
  {
    id: "software",
    name: "Software and Automation Agent",
    description: "Designs software features, APIs, integrations and business automations with tests and documented change plans.",
    capabilities: ["software.plan", "software.generate", "software.integrate", "automation.design", "automation.workflow", "automation.trigger", "automation.schedule", "automation.webhook", "automation.retry-and-fallback"],
    riskLevel: "YELLOW",
  },
  {
    id: "quality-assurance",
    name: "QA and Test Agent",
    description: "Validates deliverables against acceptance criteria, runs available checks and reports defects without overstating test coverage.",
    capabilities: ["qa.validate", "qa.test-plan", "qa.regression-check", "qa.release-check"],
    riskLevel: "GREEN",
  },
  {
    id: "omnichannel-communications",
    name: "Omnichannel Communications Agent",
    description: "Coordinates approved email, SMS, WhatsApp, Telegram and social messaging workflows through configured official integrations.",
    capabilities: ["communications.classify", "communications.draft", "communications.route", "communications.send-approved", "communications.email", "communications.whatsapp", "communications.sms", "communications.telegram", "communications.messenger", "communications.instagram", "communications.timeline"],
    riskLevel: "YELLOW",
  },
  {
    id: "customer-support",
    name: "Customer Support Agent",
    description: "Answers customer questions using approved knowledge, manages support cases and escalates uncertain or sensitive requests.",
    capabilities: ["support.answer", "support.ticket-triage", "support.resolve", "support.escalate", "support.inbox", "support.sla-tracking", "support.faq-maintenance", "support.customer-feedback"],
    riskLevel: "YELLOW",
  },
  {
    id: "voice",
    name: "Voice and Telephony Agent",
    description: "Supports approved inbound/outbound voice workflows, IVR, call summaries and telephony-provider actions.",
    capabilities: ["voice.call-plan", "voice.ivr", "voice.transcript-summary", "voice.transfer", "voice.inbound-receptionist", "voice.outbound-campaign", "voice.sip-routing", "voice.call-disposition", "voice.callback-task"],
    riskLevel: "YELLOW",
  },
  {
    id: "appointment",
    name: "Appointment and Scheduling Agent",
    description: "Checks connected calendar availability, proposes appointment slots and manages bookings subject to configured permissions.",
    capabilities: ["calendar.availability", "calendar.propose", "calendar.book-approved", "calendar.reschedule"],
    riskLevel: "YELLOW",
  },
  {
    id: "booking",
    name: "BOOKING Agent",
    description: "Coordinates reservation and booking workflows with configured providers, confirms availability before committing and escalates when provider confirmation is unavailable.",
    capabilities: ["booking.search-availability", "booking.reserve-approved", "booking.modify-approved", "booking.cancel-approved", "booking.confirmation-check"],
    riskLevel: "YELLOW",
  },
  {
    id: "proposal-quote",
    name: "Proposal and Quotation Agent",
    description: "Prepares proposals and quotes from approved service catalogs, price lists, terms and customer requirements.",
    capabilities: ["proposals.prepare", "quotes.calculate-from-rules", "proposals.validate"],
    riskLevel: "YELLOW",
  },
  {
    id: "sales",
    name: "Sales and CRM Agent",
    description: "Manages qualification, pipeline stages, follow-ups, objections, opportunities and sales reporting through connected systems.",
    capabilities: ["sales.qualify", "sales.pipeline-update", "sales.follow-up-draft", "sales.forecast", "sales.lead-scoring", "sales.objection-handling", "sales.crm-hygiene", "sales.next-best-action", "sales.renewal-opportunity"],
    riskLevel: "YELLOW",
  },
  {
    id: "customer-success",
    name: "Customer Success Agent",
    description: "Coordinates onboarding, adoption, renewal signals, customer health and next-best actions.",
    capabilities: ["success.onboard", "success.health-check", "success.renewal-risk", "success.next-action"],
    riskLevel: "YELLOW",
  },
  {
    id: "delivery-project",
    name: "Delivery and Project Agent",
    description: "Coordinates project milestones, dependencies, deliverables, blockers, deadlines and client updates.",
    capabilities: ["delivery.plan", "delivery.track", "delivery.report", "delivery.blocker-escalation", "delivery.task-assignment", "delivery.deadline-reminders", "delivery.client-status-update", "delivery.acceptance-checklist"],
    riskLevel: "GREEN",
  },
  {
    id: "analytics",
    name: "Analytics and BI Agent",
    description: "Builds KPI summaries, dashboards, trend analyses and evidence-based performance recommendations.",
    capabilities: ["analytics.kpi", "analytics.dashboard-data", "analytics.trend", "analytics.recommend", "analytics.sales-funnel", "analytics.marketing-attribution", "analytics.forecast", "analytics.anomaly-detection"],
    riskLevel: "GREEN",
  },
  {
    id: "business-operations",
    name: "Business Operations Agent",
    description: "Coordinates repeatable workflows, tasks, internal procedures, approvals and operational reporting.",
    capabilities: ["operations.workflow", "operations.task-management", "operations.sop", "operations.reporting", "executive.daily-brief", "executive.task-prioritization", "secretary.inbox-triage", "secretary.calendar-coordination", "secretary.meeting-brief", "secretary.follow-up-reminder", "operations.document-routing"],
    riskLevel: "YELLOW",
  },
  {
    id: "document",
    name: "Document and Records Agent",
    description: "Creates, extracts, classifies, summarizes and validates business documents and records, including OCR-backed workflows when a configured OCR provider is available.",
    capabilities: ["documents.create", "documents.extract", "documents.ocr", "documents.classify", "documents.summarize", "documents.template-fill", "documents.version-compare", "documents.archive-metadata", "documents.signature-workflow"],
    riskLevel: "YELLOW",
  },
  {
    id: "finance-admin",
    name: "Finance and Administration Agent",
    description: "Supports approved administrative workflows, document classification, budget visibility and financial reporting without autonomous regulated decisions.",
    capabilities: ["finance.document-classify", "finance.budget-report", "finance.admin-workflow", "finance.invoice-tracking", "finance.expense-categorization", "finance.cashflow-report", "finance.variance-analysis", "finance.accountant-handoff"],
    riskLevel: "YELLOW",
  },
  {
    id: "legal-support",
    name: "Legal Support Agent",
    description: "Organizes legal research, clause comparison, contract review checklists and compliance documentation; flags jurisdictional uncertainty and routes legal conclusions or external commitments to a qualified human.",
    capabilities: ["legal.research", "legal.clause-compare", "legal.contract-checklist", "legal.policy-draft", "legal.compliance-mapping", "legal.deadline-extraction", "legal.human-review-required"],
    riskLevel: "YELLOW",
  },
  {
    id: "hr-recruiting",
    name: "HR and Recruiting Agent",
    description: "Supports job descriptions, candidate workflow coordination and recruiting administration with human review for employment decisions.",
    capabilities: ["hr.job-description", "hr.candidate-workflow", "hr.interview-coordination", "hr.cv-extraction", "hr.candidate-scheduling", "hr.onboarding-checklist", "hr.training-coordination"],
    riskLevel: "YELLOW",
  },
  {
    id: "training-knowledge",
    name: "Training and Professor Tech Agent",
    description: "Creates structured learning paths, tutorials, technical explanations, exercises and knowledge checks.",
    capabilities: ["training.plan", "training.content", "training.assessment", "training.technical-support", "training.prompt-engineering", "training.ai-literacy", "training.software-tutorials"],
    riskLevel: "GREEN",
  },
  {
    id: "integration",
    name: "Integration and API Agent",
    description: "Plans and validates connector configuration, API mappings, webhooks and data synchronization.",
    capabilities: ["integration.plan", "integration.map-data", "integration.validate", "integration.webhook-design", "integration.oauth", "integration.sync-monitoring", "integration.crm-connector", "integration.calendar-connector", "integration.telephony-connector"],
    riskLevel: "YELLOW",
  },
  {
    id: "security-compliance",
    name: "Security and Compliance Agent",
    description: "Checks permissions, tenant boundaries, data minimization, policy controls, audit evidence and security configuration.",
    capabilities: ["security.review", "security.permission-check", "security.audit", "compliance.control-check", "security.privacy-review", "security.retention-policy", "security.secret-management-review", "compliance.consent-suppression-check"],
    riskLevel: "GREEN",
  },
  {
    id: "human-handoff",
    name: "Human Handoff Agent",
    description: "Creates a complete, concise briefing and transfers control when confidence, policy or risk requires a person.",
    capabilities: ["handoff.prepare", "handoff.route", "handoff.context-package"],
    riskLevel: "RED",
  },
  {
    id: "execution",
    name: "Execution Agent",
    description: "Executes registered tools only after tenant authorization, policy evaluation and any required human approval.",
    capabilities: ["tool.execute", "tool.result-validate"],
    riskLevel: "YELLOW",
  },
];


export interface AgentRegistrationTarget {
  registerOrReplace(agent: AgentDefinition): void;
}

/**
 * Reconciles the default AIDA roster with a runtime registry:
 * same stable ID = update the existing definition; new ID = add a specialist.
 */
export function registerDefaultAgents(registry: AgentRegistrationTarget): void {
  for (const agent of defaultAgents) {
    registry.registerOrReplace(agent);
  }
}
