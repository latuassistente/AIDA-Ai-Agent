import type { AgentDefinition } from "../../core/src/contracts";

/**
 * Default specialist roster for AIDA AI Agent.
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
    capabilities: ["knowledge.search", "knowledge.validate", "knowledge.policy-check"],
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
    capabilities: ["marketing.strategy", "marketing.positioning", "marketing.campaign-plan"],
    riskLevel: "GREEN",
  },
  {
    id: "content",
    name: "Content and Copy Agent",
    description: "Creates and adapts copy, editorial plans, social content, email copy and campaign assets to brand rules.",
    capabilities: ["content.write", "content.adapt", "content.editorial-plan", "content.brand-check"],
    riskLevel: "GREEN",
  },
  {
    id: "ads-campaigns",
    name: "Advertising Campaign Agent",
    description: "Plans and monitors paid campaign structures, creative variants, budgets and performance recommendations.",
    capabilities: ["ads.plan", "ads.analyze", "ads.optimize-recommendation"],
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
    capabilities: ["web.plan", "web.generate", "web.responsive-check", "web.accessibility-check"],
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
    capabilities: ["software.plan", "software.generate", "software.integrate", "automation.design"],
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
    capabilities: ["communications.classify", "communications.draft", "communications.route", "communications.send-approved"],
    riskLevel: "YELLOW",
  },
  {
    id: "customer-support",
    name: "Customer Support Agent",
    description: "Answers customer questions using approved knowledge, manages support cases and escalates uncertain or sensitive requests.",
    capabilities: ["support.answer", "support.ticket-triage", "support.resolve", "support.escalate"],
    riskLevel: "YELLOW",
  },
  {
    id: "voice",
    name: "Voice and Telephony Agent",
    description: "Supports approved inbound/outbound voice workflows, IVR, call summaries and telephony-provider actions.",
    capabilities: ["voice.call-plan", "voice.ivr", "voice.transcript-summary", "voice.transfer"],
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
    capabilities: ["sales.qualify", "sales.pipeline-update", "sales.follow-up-draft", "sales.forecast"],
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
    capabilities: ["delivery.plan", "delivery.track", "delivery.report", "delivery.blocker-escalation"],
    riskLevel: "GREEN",
  },
  {
    id: "analytics",
    name: "Analytics and BI Agent",
    description: "Builds KPI summaries, dashboards, trend analyses and evidence-based performance recommendations.",
    capabilities: ["analytics.kpi", "analytics.dashboard-data", "analytics.trend", "analytics.recommend"],
    riskLevel: "GREEN",
  },
  {
    id: "business-operations",
    name: "Business Operations Agent",
    description: "Coordinates repeatable workflows, tasks, internal procedures, approvals and operational reporting.",
    capabilities: ["operations.workflow", "operations.task-management", "operations.sop", "operations.reporting"],
    riskLevel: "YELLOW",
  },
  {
    id: "finance-admin",
    name: "Finance and Administration Agent",
    description: "Supports approved administrative workflows, document classification, budget visibility and financial reporting without autonomous regulated decisions.",
    capabilities: ["finance.document-classify", "finance.budget-report", "finance.admin-workflow"],
    riskLevel: "YELLOW",
  },
  {
    id: "hr-recruiting",
    name: "HR and Recruiting Agent",
    description: "Supports job descriptions, candidate workflow coordination and recruiting administration with human review for employment decisions.",
    capabilities: ["hr.job-description", "hr.candidate-workflow", "hr.interview-coordination"],
    riskLevel: "YELLOW",
  },
  {
    id: "training-knowledge",
    name: "Training and Professor Tech Agent",
    description: "Creates structured learning paths, tutorials, technical explanations, exercises and knowledge checks.",
    capabilities: ["training.plan", "training.content", "training.assessment", "training.technical-support"],
    riskLevel: "GREEN",
  },
  {
    id: "integration",
    name: "Integration and API Agent",
    description: "Plans and validates connector configuration, API mappings, webhooks and data synchronization.",
    capabilities: ["integration.plan", "integration.map-data", "integration.validate", "integration.webhook-design"],
    riskLevel: "YELLOW",
  },
  {
    id: "security-compliance",
    name: "Security and Compliance Agent",
    description: "Checks permissions, tenant boundaries, data minimization, policy controls, audit evidence and security configuration.",
    capabilities: ["security.review", "security.permission-check", "security.audit", "compliance.control-check"],
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
  register(agent: AgentDefinition): void;
}

/**
 * Registers the default AIDA roster into the runtime registry.
 * Existing IDs are intentionally not silently overwritten: duplicate IDs signal
 * a composition/configuration error that should be fixed explicitly.
 */
export function registerDefaultAgents(registry: AgentRegistrationTarget): void {
  for (const agent of defaultAgents) {
    registry.register(agent);
  }
}
