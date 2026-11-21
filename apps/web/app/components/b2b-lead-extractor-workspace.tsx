"use client";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import "./lead-extractor-workspace.css";

type Lead = {
 id:string; source:string; category:string|null; companyName:string|null; legalName:string|null;
 firstName:string|null; lastName:string|null; streetAddress:string|null; postalCode:string|null;
 city:string|null; province:string|null; region:string|null; mobilePhone:string|null;
 landlinePhone:string|null; email:string|null; website:string|null; sourceUrl:string|null;
};

const sources = [
 {id:"google_maps",name:"Google Business (Places API)",state:"DA CONFIGURARE",mark:"G"},
 {id:"pagine_gialle",name:"Pagine Gialle",state:"DA CONFIGURARE",mark:"P"},
];

export default function B2BLeadExtractorWorkspace() {
 const [source,setSource]=useState("google_maps");
 const [categories,setCategories]=useState("Ristoranti");
 const [locations,setLocations]=useState("Bari");
 const [region,setRegion]=useState("Puglia");
 const [quantity,setQuantity]=useState(1000);
 const [target,setTarget]=useState("B2B");
 const [query,setQuery]=useState("");
 const [items,setItems]=useState<Lead[]>([]);
 const [total,setTotal]=useState(0);
 const [busy,setBusy]=useState(false);
 const [geoBusy,setGeoBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [selectedSources,setSelectedSources]=useState<string[]>(["google_maps"]);
 const [required,setRequired]=useState(["mobile","email","address","active"]);
 const load=useCallback(async()=>{
  const response=await fetch("/api/lead-extractor/search?q="+encodeURIComponent(query)+"&limit=50");
  if(!response.ok)return;
  const data=await response.json();setItems(data.items||[]);setTotal(data.total||0);
 },[query]);
 useEffect(()=>{void load();},[load]);
 async function enrichGeo(){setGeoBusy(true);setMessage("");try{const response=await fetch("/api/lead-extractor/geocode",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({limit:10})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Arricchimento non riuscito");setMessage("OpenStreetMap: "+data.enriched+" schede arricchite · "+data.notFound+" senza corrispondenza · "+data.failed+" errori.");await load();}catch(error){setMessage(error instanceof Error?error.message:"Errore di connessione");}finally{setGeoBusy(false);}}
 async function search(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage("");
  const activeSource=selectedSources.includes(source)?source:selectedSources[0];
  try{
   const response=await fetch("/api/lead-extractor/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:activeSource,categories:categories.split(",").map(x=>x.trim()).filter(Boolean),locations:locations.split(",").map(x=>x.trim()).filter(Boolean),maxRecords:quantity,requestedFields:required})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Ricerca non riuscita");
   setMessage("Record ricevuti: "+data.received+" · Nuovi: "+data.imported+" · Duplicati: "+data.duplicates);await load();
  }catch(error){setMessage(error instanceof Error?error.message:"Errore di connessione");}
  finally{setBusy(false);}
 }
 function toggleSource(id:string){setSelectedSources(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);if(source===id)setSource(id==="google_maps"?"pagine_gialle":"google_maps");}
 function toggleRequired(id:string){setRequired(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}
 return <section className="lead-app" id="lead-extractor">
  <header className="lead-topbar">
   <div className="lead-brand"><span className="lead-logo">◉</span><div><strong>LEAD <em>EXTRACTOR</em> AI</strong><small>TROVA OPPORTUNITÀ. GENERA VALORE.</small></div></div>
   <div className="lead-user"><span className="lead-bell">♧ <i>3</i></span><span className="lead-avatar">V</span><span><b>Valentina</b><small>Admin</small></span><span>⌄</span></div>
  </header>
  <div className="lead-layout">
   <aside className="lead-sidebar">
    <nav>
     <a href="#overview">⌂ <span>Dashboard</span></a><a className="active" href="#new-search">⌕ <span>Nuova Ricerca</span></a><a href="#lead-results">▣ <span>Lead</span></a><a href="#lead-results">◉ <span>Lead Research</span></a><a href="#campaigns">➤ <span>Campagne</span></a><a href="#categories">▦ <span>Categorie</span></a><a href="#territory">⌖ <span>Territori</span></a><a href="#sources">♧ <span>Fonti</span></a><a href="#import">⇩ <span>Importa</span></a><a href="#export">⇧ <span>Esporta</span></a><a href="#analytics">▥ <span>Analytics</span></a><a href="#settings">⚙ <span>Impostazioni</span></a>
    </nav>
    <div className="lead-sidebar-promo"><b>Più lead.<br/>Più opportunità.<br/>Più business.</b><small>“I dati giusti danno grandi risultati.”</small><button type="button">Guida</button></div>
   </aside>
   <main className="lead-main" id="overview">
    <section className="lead-hero">
     <div><small>GENERAZIONE LEAD CON INTELLIGENZA ARTIFICIALE</small><h1>Trova. Analizza. Genera. Cresci.</h1><p>Accedi a fonti reali e autorizzate per trovare nuovi clienti in tutta Italia.</p></div>
     <div className="lead-hero-benefits"><span>◎<b>Fonti reali<br/>e affidabili</b></span><span>ϟ<b>Ricerca rapida<br/>e intelligente</b></span><span>▥<b>Dati di qualità<br/>pronti all'uso</b></span></div>
    </section>
    <div className="lead-section-title" id="new-search"><div><span className="lead-magnify">⌕</span><div><h2>Nuova Ricerca Lead</h2><p>Imposta i parametri di ricerca e genera nuovi lead da fonti autorizzate.</p></div></div><button type="button" className="lead-model-button">▤　Modelli di ricerca</button></div>
    <form className="lead-search-grid" onSubmit={search}>
     <section className="lead-panel" id="categories"><h3><span>♟</span> 1. TARGET</h3><p>Definisci il tuo target di ricerca</p>
      <label>Tipo di lead<select value={target} onChange={e=>setTarget(e.target.value)}><option>B2B</option><option>B2C</option><option>B2B + B2C</option></select></label>
      <label>Quantità lead<select value={quantity} onChange={e=>setQuantity(Number(e.target.value))}>{[100,250,500,1000,2000,5000].map(n=><option key={n} value={n}>{n.toLocaleString("it-IT")}</option>)}</select></label>
      <label>Macro categoria<input value={categories} onChange={e=>setCategories(e.target.value)} placeholder="Es. Ristorazione e Accoglienza"/></label>
      <label>Categoria merceologica<input value={categories} onChange={e=>setCategories(e.target.value)} placeholder="Es. Ristoranti, dentisti, commercialisti"/></label>
      <label>Parole chiave (opzionale)<input placeholder="Es. cucina tipica, pizzeria, ristorante di pesce..."/></label>
      <div className="lead-hint">◎　Suggerimento AI<br/><small>Usa parole chiave specifiche per risultati più precisi.</small></div>
     </section>
     <section className="lead-panel" id="territory"><h3><span>📍</span> 2. TERRITORIO</h3><p>Seleziona l'area geografica</p>
      <div className="lead-radio-list">{["Tutta Italia","Regione","Provincia","Comune","CAP","Lista CAP personalizzata"].map((v,i)=><label key={v}><input type="radio" name="area" defaultChecked={i===3}/>{v}</label>)}</div>
      <label>Regione<select value={region} onChange={e=>setRegion(e.target.value)}><option>Puglia</option><option>Campania</option><option>Lombardia</option><option>Veneto</option><option>Piemonte</option><option>Emilia-Romagna</option><option>Tutta Italia</option></select></label>
      <label>Città / Comune<input value={locations} onChange={e=>setLocations(e.target.value)} placeholder="Es. Bari, Milano, Roma"/></label>
      <label>CAP (opzionale)<input placeholder="Es. 70100"/></label>
      <div className="lead-hint">ⓘ　Puoi selezionare più città separate da virgola o caricare una lista.</div>
     </section>
     <section className="lead-panel"><h3><span>▤</span> 3. REQUISITI DATI</h3><p>Seleziona i dati che vuoi ottenere</p>
      {[["mobile","Cellulare"],["email","Email"],["website","Sito web"],["address","Indirizzo"],["cap","CAP verificato"],["vat","Partita IVA pubblica"],["active","Attività attiva"]].map(([id,label])=><label className="lead-check" key={id}><input type="checkbox" checked={required.includes(id)} onChange={()=>toggleRequired(id)}/>{label}</label>)}
      <div className="lead-quality">⚙　<b>Qualità dei risultati</b><p>Più campi selezioni, maggiore sarà la qualità dei lead, ma potrebbe ridursi la quantità di risultati.</p></div>
     </section>
     <section className="lead-panel" id="sources"><h3><span>▤</span> 4. FONTI DI RICERCA</h3><p>Scegli le fonti da utilizzare</p>
      {sources.map(s=><label className="lead-source" key={s.id}><input type="checkbox" checked={selectedSources.includes(s.id)} onChange={()=>toggleSource(s.id)}/><b className={"lead-source-mark "+s.id}>{s.mark}</b><span>{s.name}</span><small>{s.state}</small></label>)}
      <div className="lead-quality">⚙　<b>Richiedi configurazione fonti</b><p>Ti aiutiamo a configurare nuove fonti autorizzate.</p></div>
     </section>
     <div className="lead-actions"><button type="reset" className="lead-secondary" onClick={()=>{setCategories("");setLocations("");setMessage("");}}>↻　Reset</button><button type="button" className="lead-secondary" onClick={()=>setMessage("La funzione di salvataggio dei modelli sarà collegata al catalogo ricerche.")}>▣　Salva ricerca</button><button type="submit" className="lead-start" disabled={busy||!selectedSources.length}>{busy?"Ricerca in corso…":"▶　Avvia Ricerca"}</button><span className="lead-estimate">◷　Tempo stimato: 2–10 minuti</span><span className="lead-real-source">✓　Ricerca reale con fonti autorizzate</span></div>
    </form>
    {message&&<p className="lead-message" role="status">{message}</p>}
    <section className="lead-results" id="lead-results"><div className="lead-run-head"><div><span className="lead-spinner"/><div><b>Archivio Lead</b><small>Ricerca per categoria merceologica e città · {total.toLocaleString("it-IT")} record</small></div></div><button type="button" onClick={enrichGeo} disabled={geoBusy}>{geoBusy?"Elaborazione…":"Completa CAP e territorio"}</button></div>
     <div className="lead-kpis"><div><b>▤</b><strong>{total}</strong><small>Lead trovati</small></div><div><b>✓</b><strong>—</strong><small>Nuovi</small></div><div><b>▤</b><strong>—</strong><small>Duplicati</small></div><div><b>♢</b><strong>—</strong><small>Verificati</small></div><div><b>☎</b><strong>{items.filter(x=>x.mobilePhone).length}</strong><small>Con cellulare</small></div><div><b>✉</b><strong>{items.filter(x=>x.email).length}</strong><small>Con email</small></div></div>
     <div className="lead-table-tools"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cerca nei risultati..."/><span>Fonte: Google Maps / Pagine Gialle</span></div>
     <div className="lead-table-wrap"><table><thead><tr><th>Categoria merceologica</th><th>Ragione sociale</th><th>Nome e cognome</th><th>Regione</th><th>Comune e città</th><th>Indirizzo</th><th>Cellulare</th><th>Email</th><th>Sito web</th><th>Lead source</th><th>Note</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.category||"—"}</td><td>{item.legalName||item.companyName||"—"}</td><td>{[item.firstName,item.lastName].filter(Boolean).join(" ")||"—"}</td><td>{item.region||"—"}</td><td>{item.city||"—"}</td><td>{item.streetAddress||"—"}</td><td>{item.mobilePhone||"—"}</td><td>{item.email||"—"}</td><td>{item.website?<a href={item.website} target="_blank" rel="noreferrer">Apri sito</a>:"—"}</td><td>{item.source==="google_maps"?"Google Maps":"Pagine Gialle"}</td><td>—</td></tr>)}{!items.length&&<tr><td colSpan={11}>Nessun record nell'archivio.</td></tr>}</tbody></table></div>
    </section>
    <p className="lead-disclaimer">I campi non pubblicati dalla fonte restano vuoti. I dati importati sono grezzi finché non vengono verificati; la raccolta non autorizza automaticamente attività di marketing.</p>
   </main>
  </div>
 </section>;
}
