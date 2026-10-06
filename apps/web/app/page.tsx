const modules = [
  {
    code: "01",
    title: "Goal Engine",
    description: "Trasforma un obiettivo in un piano verificabile, con dipendenze e prossime azioni.",
    status: "Core iniziale",
  },
  {
    code: "02",
    title: "Team di agenti",
    description: "Orchestrator, ricerca, conoscenza, esecuzione e controllo qualità.",
    status: "Registry pronto",
  },
  {
    code: "03",
    title: "Knowledge Core",
    description: "Documenti, versioni, fonti e recupero delle evidenze aziendali.",
    status: "Provider iniziale",
  },
  {
    code: "04",
    title: "Project Brain",
    description: "Contesto, fase, blocchi, scadenze, KPI e prossima azione di ogni progetto.",
    status: "Modello pronto",
  },
  {
    code: "05",
    title: "Guardrails",
    description: "Default-deny, approvazioni e passaggio a una persona quando serve.",
    status: "Gate iniziali",
  },
  {
    code: "06",
    title: "Dati e audit",
    description: "Persistenza PostgreSQL, isolamento per tenant e tracciabilità delle azioni.",
    status: "Schema e adapter",
  },
];

export default function HomePage() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">A</span><span>AIDA<span className="brand-sub">AI AGENT WORKSPACE</span></span></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          <a className="nav-item active" href="#overview"><span>◫</span> Panoramica</a>
          <a className="nav-item" href="#modules"><span>◈</span> Agenti e moduli</a>
          <a className="nav-item" href="#status"><span>◎</span> Stato sistema</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div><strong>Ambiente di sviluppo</strong><small>Connessioni esterne non configurate</small></div>
        </div>
      </aside>

      <section className="main-panel" id="overview">
        <header className="topbar">
          <div><span className="eyebrow">CONTROL CENTER / V0.1</span><h1>Panoramica</h1></div>
          <div className="user-chip"><span className="avatar">VL</span><span>Workspace proprietario</span></div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="pulse" /> FONDAMENTA IN COSTRUZIONE</div>
            <h2>Dal tuo obiettivo<br /><em>al risultato.</em></h2>
            <p>AIDA coordinerà agenti specializzati per pianificare, eseguire, verificare e migliorare i processi aziendali, mantenendo il controllo umano dove necessario.</p>
            <div className="hero-tags"><span>Goal-oriented</span><span>Multi-agent</span><span>Human-in-the-loop</span></div>
          </div>
          <div className="orbit" aria-hidden="true">
            <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
            <div className="orbit-core">A<span>I</span></div>
            <div className="orbit-node node-top">PLAN</div><div className="orbit-node node-right">ACT</div>
            <div className="orbit-node node-bottom">VERIFY</div><div className="orbit-node node-left">LEARN</div>
          </div>
        </section>

        <section className="section-heading" id="modules">
          <div><span className="eyebrow">ARCHITETTURA</span><h2>Componenti principali</h2></div>
          <span className="section-note">Stato reale dello sviluppo</span>
        </section>

        <div className="module-grid">
          {modules.map((item) => (
            <article className="module-card" key={item.code}>
              <div className="module-top"><span className="module-code">{item.code}</span><span className="mini-indicator" /></div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="module-status"><span className="status-line" />{item.status}</div>
            </article>
          ))}
        </div>

        <section className="bottom-grid" id="status">
          <article className="panel-card">
            <span className="eyebrow">PROSSIMA FASE</span>
            <h3>Collegare i componenti</h3>
            <p>Il prossimo lavoro è integrare orchestrazione, persistenza e approvazioni in un flusso unico, poi aggiungere autenticazione e gestione dei tenant prima di esporre funzioni operative.</p>
            <div className="phase-track"><span className="phase-done" /><span /><span /><span /><span /></div>
            <div className="phase-labels"><span>Fondazione</span><span>Runtime</span><span>Canali</span><span>Factory</span></div>
          </article>
          <article className="panel-card caution-card">
            <span className="eyebrow">SICUREZZA</span>
            <h3>Non ancora in produzione</h3>
            <p>Le integrazioni con email, WhatsApp, social, telefonia e calendari non sono ancora attive. Le azioni esterne resteranno disabilitate finché autorizzazioni, controlli e test non saranno configurati.</p>
            <div className="safety-pill"><span /> Esecuzione controllata</div>
          </article>
        </section>
        <footer><span>AIDA · AI Agent Platform</span><span>Versione fondazione 0.1.0</span></footer>
      </section>
    </main>
  );
}
