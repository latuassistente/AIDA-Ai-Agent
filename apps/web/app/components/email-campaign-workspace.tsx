"use client";

import { useState } from "react";

type ImportResult = { campaignId: string; imported: number; duplicates: number; invalid: number; status: string };

export default function EmailCampaignWorkspace() {
  const [mode, setMode] = useState<"upload" | "lead-extractor">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [campaignName, setCampaignName] = useState("Nuova campagna");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function importFile() {
    if (!file) { setError("Seleziona un file CSV."); return; }
    setBusy(true); setError(""); setResult(null);
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("campaignName", campaignName);
      const response = await fetch("/api/email-campaign/import", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Importazione non riuscita.");
      setResult(payload as ImportResult);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Errore durante l'importazione.");
    } finally { setBusy(false); }
  }

  return <section className="email-workspace" id="email-campaign-ai">
    <div className="configurator-heading">
      <div><span className="eyebrow">AGENTE P0 · EMAIL CAMPAIGN AI</span><h2>Destinatari e campagne email</h2>
        <p>Carica una lista oppure seleziona i contatti idonei prodotti da B2B Lead Extractor AI.</p></div>
      <span className="catalog-count">2 modalità</span>
    </div>
    <div className="email-mode-tabs">
      <button type="button" className={mode === "upload" ? "active" : ""} onClick={() => { setMode("upload"); setError(""); }}>Upload lista</button>
      <button type="button" className={mode === "lead-extractor" ? "active" : ""} onClick={() => { setMode("lead-extractor"); setError(""); }}>B2B Lead Extractor AI</button>
    </div>
    {mode === "upload" ? <div className="email-import-panel">
      <label>Nome campagna<input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} /></label>
      <label>Lista destinatari (CSV)<input type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); }} /></label>
      <p className="email-help">Colonna obbligatoria: email. Colonne facoltative: azienda, referente, base giuridica, prova autorizzazione, stato autorizzazione, soppresso, disiscritto. L'importazione non invia email.</p>
      <button type="button" className="primary-action" disabled={busy || !file} onClick={importFile}>{busy ? "Importazione…" : "Importa destinatari"}</button>
    </div> : <div className="email-import-panel">
      <h3>Collegamento diretto al Lead Extractor</h3>
      <p>La modalità è prevista nel flusso dell'agente. L'adapter runtime del B2B Lead Extractor non è ancora collegato: fino al suo rilascio non vengono mostrati né importati record simulati.</p>
      <span className="service-status status-planned">Connettore in implementazione</span>
    </div>}
    {error && <div className="configurator-alert" role="alert">{error}</div>}
    {result && <div className="email-import-result" role="status">
      <strong>Importazione completata · campagna {result.campaignId}</strong>
      <div className="preview-stats">
        <div><strong>{result.imported}</strong><span>destinatari importati</span></div>
        <div><strong>{result.duplicates}</strong><span>duplicati esclusi</span></div>
        <div><strong>{result.invalid}</strong><span>email non valide</span></div>
      </div>
      <p>Stato: {result.status}. Nessun invio effettuato.</p>
    </div>}
  </section>;
}
