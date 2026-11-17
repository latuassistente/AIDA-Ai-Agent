"use client";

import { useState } from "react";

type ImportResult = { campaignId: string; imported: number; duplicates: number; invalid: number; status: string };\ntype CampaignReport = { recipients: number; eligible: number; excluded: number; sent: number; delivered: number; bounced: number; opensDetected: number; clicks: number; replies: number; positive: number; ko: number; pendingOutcome: number; readReceiptsAvailable: false; openTrackingCaveat: string };

export default function EmailCampaignWorkspace() {
  const [mode, setMode] = useState<"upload" | "lead-extractor">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [campaignName, setCampaignName] = useState("Nuova campagna");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");\n  const [report, setReport] = useState<CampaignReport | null>(null);\n  const [reportBusy, setReportBusy] = useState(false);

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
      setResult(payload as ImportResult);\n      setReport(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Errore durante l'importazione.");
    } finally { setBusy(false); }
  }

  async function loadReport() {\n    if (!result) return;\n    setReportBusy(true); setError("");\n    try {\n      const response = await fetch(`/api/email-campaign/${encodeURIComponent(result.campaignId)}/report`);\n      const payload = await response.json();\n      if (!response.ok) throw new Error(payload.error ?? "Report non disponibile.");\n      setReport(payload as CampaignReport);\n    } catch (reason) { setError(reason instanceof Error ? reason.message : "Errore nel report."); }\n    finally { setReportBusy(false); }\n  }\n\n  return <section className="email-workspace" id="email-campaign-ai">
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
      <p>Stato: {result.status}. Nessun invio effettuato.</p>\n      <button type="button" className="secondary-action" onClick={loadReport} disabled={reportBusy}>{reportBusy ? "Caricamento report…" : "Apri report campagna"}</button>\n      {report && <div className="email-report">\n        <strong>Report campagna</strong>\n        <div className="preview-stats">\n          <div><strong>{report.sent}</strong><span>inviate</span></div>\n          <div><strong>{report.delivered}</strong><span>consegnate</span></div>\n          <div><strong>{report.opensDetected}</strong><span>aperture rilevate</span></div>\n          <div><strong>{report.replies}</strong><span>risposte</span></div>\n          <div><strong>{report.positive}</strong><span>positive</span></div>\n          <div><strong>{report.ko}</strong><span>KO</span></div>\n          <div><strong>{report.pendingOutcome}</strong><span>esito in attesa</span></div>\n          <div><strong>{report.bounced}</strong><span>bounce</span></div>\n        </div>\n        <p>{report.openTrackingCaveat}</p>\n      </div>}
    </div>}
  </section>;
}
