"use client";
import { useState } from "react";

export default function GMExtractorImport() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit() {
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch("/api/lead-extractor/import-gmextractor", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Importazione non riuscita.");
      setMessage("Righe lette: " + result.rowsRead + " · Schede valide: " + result.valid + " · Importate: " + result.imported + " · Duplicati: " + result.duplicates);
      setFile(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Errore durante l'importazione."); }
    finally { setBusy(false); }
  }
  return <section className="panel-card" style={{ margin: "24px 0", padding: 24 }}>
    <span className="eyebrow">GOOGLE MAPS · GMEXTRACTOR 2.0.1</span>
    <h3>Importa esportazione GMExtractor</h3>
    <p>Carica il file Excel .xlsx generato dal software GMExtractor. I record vengono normalizzati e inseriti nell'archivio Google Maps del tenant.</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => { setFile(event.target.files?.[0] || null); setMessage(""); }} />
      <button type="button" disabled={!file || busy} onClick={submit}>{busy ? "Importazione…" : "Importa in AIDA"}</button>
    </div>
    {message && <p role="status" style={{ marginTop: 12 }}>{message}</p>}
    <small>Limite file: 15 MB. L'importazione è tracciata nell'audit. Non avvia né controlla il software Windows da remoto.</small>
  </section>;
}
