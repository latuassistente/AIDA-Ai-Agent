"use client";

import { useState } from "react";

type ImportResult = { campaignId: string; imported: number; duplicates: number; invalid: number; status: string };
type SendResult = { attempted: number; sent: number; failed: number; sentTotal: number; eligible: number; remaining: number; complete: boolean; status: string };
type CampaignReport = { campaign: { id: string; name: string; status: string; createdAt: string }; recipientOutcomes: Array<{ id: string; email: string; companyName: string | null; contactName: string | null; hasReply: boolean; outcome: "positive" | "ko" | "pending"; legalReview: "approved" | "pending" | "rejected"; legalBasis: string | null; authorizationEvidenceId: string | null; verificationStatus: string }>; recipients: number; eligible: number; excluded: number; sent: number; delivered: number; bounced: number; unsubscribed: number; complaints: number; opensDetected: number; clicks: number; replies: number; positive: number; ko: number; pendingOutcome: number; readReceiptsAvailable: false; openTrackingCaveat: string };

const starterEmailHtml = `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;background:#f2f4f7;font-family:Arial,sans-serif;color:#253044}
.wrap{padding:32px 12px}.card{max-width:600px;margin:auto;background:#fff;border-radius:14px;overflow:hidden}
.top{height:8px;background:#e87924}.content{padding:38px 34px;line-height:1.65}
h1{font-size:27px;line-height:1.2;margin:0 0 18px}.button{display:inline-block;background:#e87924;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;font-weight:bold}
.footer{padding:20px 28px;text-align:center;background:#f8f9fb;color:#697386;font-size:12px}
@media(max-width:480px){.content{padding:26px 20px}.wrap{padding:12px 8px}}
</style></head>
<body><div class="wrap"><div class="card"><div class="top"></div><main class="content">
<p style="font-size:12px;letter-spacing:1.5px;color:#e87924;font-weight:bold">LA TUA AZIENDA</p>
<h1>Un messaggio pensato per la tua attività</h1>
<p>Buongiorno,</p><p>inserisci qui il testo della tua comunicazione. Mantieni il messaggio chiaro, pertinente e coerente con il consenso e la base giuridica verificati per ogni destinatario.</p>
<p style="margin:28px 0"><a class="button" href="https://example.com">Scopri di più</a></p>
<p> Cordiali saluti,<br><strong>Il tuo team</strong></p>
</main><footer class="footer">Ragione sociale · Indirizzo · <a href="{{unsubscribe_url}}">Disiscriviti</a></footer></div></div></body></html>`;

export default function EmailCampaignWorkspace() {
  const [mode, setMode] = useState<"upload" | "lead-extractor">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [leadSegmentId, setLeadSegmentId] = useState("");
  const [leadImportBusy, setLeadImportBusy] = useState(false);
  const [campaignName, setCampaignName] = useState("Nuova campagna");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [classifyingId, setClassifyingId] = useState<string | null>(null);
  const [authBusyId, setAuthBusyId] = useState<string | null>(null);
  const [authorizationInputs, setAuthorizationInputs] = useState<Record<string, { legalBasis: string; evidenceId: string }>>({});
  const [subject, setSubject] = useState("Una proposta per la tua attività");
  const [htmlContent, setHtmlContent] = useState(starterEmailHtml);
  const [contentBusy, setContentBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ checked: number; remaining: number; results: Record<string, number> } | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  async function importFile() {
    if (!file) { setError("Seleziona un file CSV o XLSX."); return; }
    setBusy(true); setError(""); setResult(null);
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("campaignName", campaignName);
      const response = await fetch("/api/email-campaign/import", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Importazione non riuscita.");
      setResult(payload as ImportResult);
      setReport(null);
      setSaved(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Errore durante l'importazione.");
    } finally { setBusy(false); }
  }

  async function importFromLeadExtractor() {
    if (!leadSegmentId.trim()) { setError("Inserisci l’identificativo del segmento o della ricerca B2B."); return; }
    setLeadImportBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/email-campaign/lead-extractor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignName, segmentId: leadSegmentId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Importazione dal Lead Extractor non riuscita.");
      setResult(payload as ImportResult);
      setReport(null);
      setSaved(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Errore nel collegamento B2B."); }
    finally { setLeadImportBusy(false); }
  }

  async function saveContent() {
    if (!result) return;
    setContentBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch(`/api/email-campaign/${encodeURIComponent(result.campaignId)}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, htmlContent }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Salvataggio non riuscito.");
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Errore nel salvataggio.");
    } finally { setContentBusy(false); }
  }

  async function classifyOutcome(recipientId: string, outcome: "positive" | "ko" | "pending") {
    if (!result) return;
    setClassifyingId(recipientId); setError("");
    try {
      const response = await fetch(`/api/email-campaign/${encodeURIComponent(result.campaignId)}/outcomes`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientId, outcome }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Classificazione non riuscita.");
      await loadReport();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Errore nella classificazione."); }
    finally { setClassifyingId(null); }
  }

  async function reviewAuthorization(recipientId: string, legalReview: "approved" | "rejected") {
    if (!result) return;
    const values = authorizationInputs[recipientId] ?? { legalBasis: "", evidenceId: "" };
    if (legalReview === "approved" && (!values.legalBasis.trim() || !values.evidenceId.trim())) {
      setError("Per approvare il destinatario inserisci base giuridica e riferimento alla prova documentale.");
      return;
    }
    setAuthBusyId(recipientId); setError("");
    try {
      const response = await fetch(`/api/email-campaign/${encodeURIComponent(result.campaignId)}/authorization`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, legalReview, legalBasis: values.legalBasis, authorizationEvidenceId: values.evidenceId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Revisione autorizzazione non riuscita.");
      await loadReport();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Errore nella revisione autorizzazione."); }
    finally { setAuthBusyId(null); }
  }

  async function verifyEmails() {
    if (!result) return;
    setVerifyBusy(true); setError(""); setVerifyResult(null);
    try {
      const response = await fetch(`/api/email-campaign/${encodeURIComponent(result.campaignId)}/verify`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Verifica email non riuscita.");
      setVerifyResult(payload);
      await loadReport();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Errore durante la verifica."); }
    finally { setVerifyBusy(false); }
  }

  async function sendCampaign() {
    if (!result || !saved || !window.confirm("Confermi l’invio reale dei prossimi 50 messaggi ai soli destinatari autorizzati e verificati?")) return;
    setSendBusy(true); setError(""); setSendResult(null);
    try {
      const response = await fetch(`/api/email-campaign/${encodeURIComponent(result.campaignId)}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmSend: true }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Invio non riuscito.");
      setSendResult(payload as SendResult);
      await loadReport();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Errore durante l’invio."); }
    finally { setSendBusy(false); }
  }

  async function loadReport() {
    if (!result) return;
    setReportBusy(true); setError("");
    try {
      const response = await fetch(`/api/email-campaign/${encodeURIComponent(result.campaignId)}/report`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Report non disponibile.");
      setReport(payload as CampaignReport);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Errore nel report."); }
    finally { setReportBusy(false); }
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
      <label>Lista destinatari (CSV o XLSX)<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); }} /></label>
      <p className="email-help">Colonna obbligatoria: email. Colonne facoltative: azienda, referente, base giuridica, prova autorizzazione, stato autorizzazione, soppresso, disiscritto. Formati ammessi: CSV e XLSX (primo foglio). Lo stato autorizzazione importato è solo informativo: tutti i destinatari entrano in revisione pending e devono essere approvati nell’app. L’importazione non invia email.</p>
      <button type="button" className="primary-action" disabled={busy || !file} onClick={importFile}>{busy ? "Importazione…" : "Importa destinatari"}</button>
    </div> : <div className="email-import-panel">
      <h3>Importazione diretta dal B2B Lead Extractor</h3>
      <label>Nome campagna<input value={campaignName} onChange={(event) => setCampaignName(event.target.value)} /></label>
      <label>ID segmento o ricerca<input value={leadSegmentId} onChange={(event) => setLeadSegmentId(event.target.value)} placeholder="Identificativo restituito dal Lead Extractor" /></label>
      <p className="email-help">Il connettore richiede B2B_LEAD_EXTRACTOR_API_URL e B2B_LEAD_EXTRACTOR_API_KEY. Importa al massimo 50 record per batch. I contatti entrano sempre in revisione pending e con email non verificata.</p>
      <button type="button" className="primary-action" onClick={importFromLeadExtractor} disabled={leadImportBusy || !leadSegmentId.trim()}>{leadImportBusy ? "Importazione…" : "Importa dal B2B Lead Extractor"}</button>
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
      <div className="email-composer">
        <h3>Composizione email HTML</h3>
        <label>Oggetto<input value={subject} maxLength={240} onChange={(event) => { setSubject(event.target.value); setSaved(false); }} /></label>
        <label>Codice HTML<textarea value={htmlContent} rows={14} maxLength={200000} spellCheck={false} onChange={(event) => { setHtmlContent(event.target.value); setSaved(false); }} /></label>
        <div className="email-composer-actions">
          <button type="button" className="secondary-action" onClick={saveContent} disabled={contentBusy}>{contentBusy ? "Salvataggio…" : "Salva bozza email"}</button>
          {saved && <span className="email-saved" role="status">Bozza salvata</span>}
        </div>
        <h4>Anteprima grafica HTML</h4>
        <iframe title="Anteprima email HTML" sandbox="" srcDoc={htmlContent} className="email-html-preview" />
        <p className="email-help">L'anteprima è isolata. Il salvataggio conserva la bozza; non esegue invii.</p>
      </div>
      <div className="email-send-actions"><button type="button" className="secondary-action" onClick={verifyEmails} disabled={verifyBusy}>{verifyBusy ? "Verifica in corso…" : "Verifica prossimi 50 indirizzi"}</button><button type="button" className="primary-action" onClick={sendCampaign} disabled={sendBusy || !saved || report?.campaign.status === "SENT"}>{sendBusy ? "Invio in corso…" : "Invia prossimi 50 destinatari"}</button><span className="email-help">Invio reale. Richiede provider configurato, autorizzazione approvata e email verificata.</span></div>
      {verifyResult && <p role="status">Verificati {verifyResult.checked} indirizzi; {verifyResult.remaining} ancora da verificare. Esiti: {Object.entries(verifyResult.results).map(([key, value]) => `${key} ${value}`).join(" · ")}.</p>}
      {sendResult && <p role="status">Batch concluso: {sendResult.sent} inviate, {sendResult.failed} non riuscite, {sendResult.remaining} ancora da inviare. Stato: {sendResult.status}.</p>}
      <button type="button" className="secondary-action" onClick={loadReport} disabled={reportBusy}>{reportBusy ? "Caricamento report…" : "Apri report campagna"}</button>
      {report && <div className="email-report">
        <strong>Report campagna</strong>
        <div className="preview-stats">
          <div><strong>{report.eligible}</strong><span>destinatari idonei</span></div>
          <div><strong>{report.excluded}</strong><span>destinatari esclusi</span></div>
          <div><strong>{report.sent}</strong><span>inviate</span></div>
          <div><strong>{report.delivered}</strong><span>consegnate</span></div>
          <div><strong>{report.opensDetected}</strong><span>aperture rilevate</span></div>
          <div><strong>{report.replies}</strong><span>risposte</span></div>
          <div><strong>{report.positive}</strong><span>positive</span></div>
          <div><strong>{report.ko}</strong><span>KO</span></div>
          <div><strong>{report.pendingOutcome}</strong><span>esito in attesa</span></div>
          <div><strong>{report.bounced}</strong><span>bounce</span></div>
          <div><strong>{report.unsubscribed}</strong><span>disiscritti</span></div>
          <div><strong>{report.complaints}</strong><span>segnalazioni spam</span></div>
        </div>
        <p>{report.openTrackingCaveat}</p>
        <div className="email-outcomes">
          <strong>Revisione autorizzazioni destinatari</strong>
          {report.recipientOutcomes.map((recipient) => {
            const values = authorizationInputs[recipient.id] ?? { legalBasis: recipient.legalBasis ?? "", evidenceId: recipient.authorizationEvidenceId ?? "" };
            return <div className="email-outcome-row" key={recipient.id}>
              <div className="email-authorization-person">
                <b>{recipient.contactName || recipient.companyName || recipient.email}</b>
                <span>{recipient.email}</span>
                <span>Autorizzazione: {recipient.legalReview} · Verifica email: {recipient.verificationStatus}</span>
              </div>
              <div className="email-authorization-fields">
                <input aria-label="Base giuridica" placeholder="Base giuridica" value={values.legalBasis} onChange={(event) => setAuthorizationInputs((current) => ({ ...current, [recipient.id]: { ...values, legalBasis: event.target.value } }))} />
                <input aria-label="Riferimento prova documentale" placeholder="Riferimento prova documentale" value={values.evidenceId} onChange={(event) => setAuthorizationInputs((current) => ({ ...current, [recipient.id]: { ...values, evidenceId: event.target.value } }))} />
                <div className="email-outcome-actions">
                  <button type="button" className={recipient.legalReview === "approved" ? "selected" : ""} disabled={authBusyId === recipient.id} onClick={() => reviewAuthorization(recipient.id, "approved")}>Approva</button>
                  <button type="button" className={recipient.legalReview === "rejected" ? "selected" : ""} disabled={authBusyId === recipient.id} onClick={() => reviewAuthorization(recipient.id, "rejected")}>Rifiuta</button>
                </div>
              </div>
            </div>;
          })}
          <p>L'importazione non autorizza automaticamente i destinatari. L'approvazione richiede una revisione umana e un riferimento alla prova documentale; l'idoneità finale richiede anche verifica email valida e assenza di soppressione/disiscrizione.</p>
        </div>
        <div className="email-outcomes"><strong>Classificazione delle risposte</strong>{report.recipientOutcomes.filter((recipient) => recipient.hasReply).length === 0 ? <p>Nessuna risposta registrata al momento.</p> : report.recipientOutcomes.filter((recipient) => recipient.hasReply).map((recipient) => <div className="email-outcome-row" key={recipient.id}><div><b>{recipient.contactName || recipient.companyName || recipient.email}</b><span>{recipient.email}</span></div><div className="email-outcome-actions"><button type="button" className={recipient.outcome === "positive" ? "selected" : ""} disabled={classifyingId === recipient.id} onClick={() => classifyOutcome(recipient.id, "positive")}>Positiva</button><button type="button" className={recipient.outcome === "ko" ? "selected" : ""} disabled={classifyingId === recipient.id} onClick={() => classifyOutcome(recipient.id, "ko")}>KO</button><button type="button" className={recipient.outcome === "pending" ? "selected" : ""} disabled={classifyingId === recipient.id} onClick={() => classifyOutcome(recipient.id, "pending")}>In attesa</button></div></div>)}</div>
      </div>}
    </div>}
  </section>;
}
