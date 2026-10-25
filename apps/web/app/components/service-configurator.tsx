"use client";

import { useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  family: string;
  description: string;
  agentId: string;
  status: "planned" | "configurable" | "active" | "paused";
  riskLevel: "GREEN" | "YELLOW" | "RED";
  dependencies: string[];
  includedInPlans: string[];
  configurable: boolean;
};
type Summary = {
  selectedServiceIds: string[];
  automaticallyIncludedDependencies: string[];
  excludedServiceIds: string[];
  plannedServiceIds: string[];
  needsConfigurationServiceIds: string[];
  activeReadyServiceIds: string[];
};
type Preview = {
  valid: boolean;
  plan: string;
  services: Service[];
  automaticallyIncludedDependencies: string[];
  errors: string[];
  summary: Summary;
  persisted: boolean;
  integrationsActivated: boolean;
};

const planLabels: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};
const statusLabels: Record<Service["status"], string> = {
  planned: "Pianificato",
  configurable: "Configurabile",
  active: "Attivo",
  paused: "In pausa",
};

export default function ServiceConfigurator() {
  const [services, setServices] = useState<Service[]>([]);
  const [plans, setPlans] = useState<string[]>(["starter", "pro", "business", "enterprise"]);
  const [plan, setPlan] = useState("business");
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState("Tutti");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/services/configure")
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalogo servizi non disponibile.");
        return response.json();
      })
      .then((data: { services: Service[]; plans: string[] }) => {
        if (!mounted) return;
        setServices(data.services);
        setPlans(data.plans);
      })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : "Errore nel caricamento del catalogo.");
      })
      .finally(() => { if (mounted) setLoadingCatalog(false); });
    return () => { mounted = false; };
  }, []);

  const families = useMemo(
    () => ["Tutti", ...Array.from(new Set(services.map((service) => service.family))).sort((a, b) => a.localeCompare(b))],
    [services],
  );
  const visibleServices = useMemo(() => services.filter((service) => {
    const matchesFamily = filter === "Tutti" || service.family === filter;
    const term = search.trim().toLocaleLowerCase("it");
    const matchesSearch = !term || [service.name, service.id, service.description, service.agentId]
      .some((value) => value.toLocaleLowerCase("it").includes(term));
    return matchesFamily && matchesSearch;
  }), [services, filter, search]);

  function toggleService(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setPreview(null);
    setSavedMessage("");
    setError("");
  }

  async function createPreview() {
    if (selected.length === 0) {
      setError("Seleziona almeno un modulo per preparare la configurazione.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/services/configure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedServiceIds: selected, plan }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 422) {
        throw new Error(data.error ?? "Impossibile elaborare la configurazione.");
      }
      setPreview(data as Preview);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Errore durante la configurazione.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveConfiguration() {
    if (!preview?.valid) return;
    setSaving(true);
    setError("");
    setSavedMessage("");
    try {
      const response = await fetch("/api/services/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedServiceIds: selected, plan }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) throw new Error("Accesso richiesto: configura prima il login AIDA con sessione firmata lato server.");
        throw new Error(data.error ?? "Impossibile salvare la configurazione.");
      }
      setSavedMessage("Configurazione salvata per il tenant autenticato. Le integrazioni esterne non sono state attivate.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="configurator" id="service-configurator">
      <div className="configurator-heading">
        <div><span className="eyebrow">CONFIGURATORE MODULARE</span><h2>Agenti e servizi AIDA</h2>
          <p>Scegli i moduli da includere. AIDA controlla il piano e aggiunge le dipendenze necessarie.</p>
        </div>
        <span className="catalog-count">{services.length} servizi a catalogo</span>
      </div>

      <div className="configurator-controls">
        <label className="plan-field">Piano SaaS
          <select value={plan} onChange={(event) => { setPlan(event.target.value); setPreview(null); }}>
            {plans.map((item) => <option value={item} key={item}>{planLabels[item] ?? item}</option>)}
          </select>
        </label>
        <label className="search-field">Cerca un servizio
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, agente o ID…" />
        </label>
        <div className="selected-count"><strong>{selected.length}</strong><span>selezionati</span></div>
      </div>

      <div className="family-filters" aria-label="Filtra per categoria">
        {families.map((family) => <button type="button" key={family} className={filter === family ? "family-filter active" : "family-filter"} onClick={() => setFilter(family)}>{family}</button>)}
      </div>

      {loadingCatalog ? <div className="configurator-message">Caricamento catalogo…</div> : (
        <div className="service-grid">
          {visibleServices.map((service) => {
            const checked = selected.includes(service.id);
            const planAvailable = service.includedInPlans.includes(plan);
            return <label key={service.id} className={checked ? "service-option selected" : "service-option"}>
              <input type="checkbox" checked={checked} onChange={() => toggleService(service.id)} />
              <span className="service-option-main">
                <span className="service-option-top"><strong>{service.name}</strong><span className={"service-status status-" + service.status}>{statusLabels[service.status]}</span></span>
                <span className="service-description">{service.description}</span>
                <span className="service-meta"><code>{service.id}</code><span>Agente: {service.agentId}</span></span>
                <span className="service-dependencies">
                  {service.dependencies.length > 0 ? "Dipendenze: " + service.dependencies.join(", ") : "Nessuna dipendenza"}
                  {!planAvailable ? " · Non incluso nel piano selezionato" : ""}
                </span>
              </span>
            </label>;
          })}
          {visibleServices.length === 0 && <div className="configurator-message">Nessun servizio corrisponde alla ricerca.</div>}
        </div>
      )}

      <div className="configurator-actions">
        <button type="button" className="secondary-action" onClick={() => { setSelected([]); setPreview(null); setError(""); }}>Azzera selezione</button>
        <button type="button" className="primary-action" onClick={createPreview} disabled={submitting || loadingCatalog || selected.length === 0}>{submitting ? "Verifica in corso…" : "Verifica configurazione"}</button>
      </div>
      {error && <div className="configurator-alert" role="alert">{error}</div>}

      {preview && <section className="preview-panel" aria-live="polite">
        <div className="preview-header"><div><span className="eyebrow">RISULTATO CONTROLLO</span><h3>{preview.valid ? "Configurazione coerente" : "Configurazione da correggere"}</h3></div><span className={preview.valid ? "preview-state good" : "preview-state bad"}>{preview.valid ? "Verifica superata" : "Verifica con errori"}</span></div>
        {preview.errors.length > 0 && <div className="preview-errors"><strong>Problemi rilevati</strong><ul>{preview.errors.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
        <div className="preview-stats">
          <div><strong>{preview.services.length}</strong><span>moduli risolti</span></div>
          <div><strong>{preview.automaticallyIncludedDependencies.length}</strong><span>dipendenze aggiunte</span></div>
          <div><strong>{preview.summary.plannedServiceIds.length}</strong><span>non ancora implementati</span></div>
          <div><strong>{preview.summary.needsConfigurationServiceIds.length}</strong><span>da configurare</span></div>
        </div>
        {preview.automaticallyIncludedDependencies.length > 0 && <div className="preview-list"><strong>Dipendenze incluse automaticamente</strong><p>{preview.automaticallyIncludedDependencies.map((id) => services.find((service) => service.id === id)?.name ?? id).join(" · ")}</p></div>}
        {preview.services.length > 0 && <div className="resolved-services"><strong>Moduli inclusi</strong>{preview.services.map((service) => <div key={service.id}><span>{service.name}</span><span className={"service-status status-" + service.status}>{statusLabels[service.status]}</span></div>)}</div>}
        <p className="preview-disclaimer">{preview.persisted ? "Configurazione salvata." : "Anteprima soltanto: per salvare serve una sessione autenticata. Le integrazioni esterne non vengono attivate."}</p>
        {preview.valid && <button type="button" className="primary-action" onClick={saveConfiguration} disabled={saving}>{saving ? "Salvataggio…" : "Salva configurazione tenant"}</button>}
        {savedMessage && <div className="configurator-message" role="status">{savedMessage}</div>}
      </section>}
    </section>
  );
}
