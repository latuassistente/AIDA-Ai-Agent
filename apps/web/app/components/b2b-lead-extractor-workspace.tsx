"use client";
import { type FormEvent, useCallback, useEffect, useState } from "react";

type Lead = {
 id:string; source:string; category:string|null; companyName:string|null; legalName:string|null;
 firstName:string|null; lastName:string|null; streetAddress:string|null; postalCode:string|null;
 city:string|null; province:string|null; region:string|null; mobilePhone:string|null;
 landlinePhone:string|null; email:string|null; website:string|null; sourceUrl:string|null;
};
export default function B2BLeadExtractorWorkspace() {
 const [source,setSource]=useState("google_maps");
 const [categories,setCategories]=useState("ristoranti, dentisti, commercialisti");
 const [locations,setLocations]=useState("Bari, Puglia");
 const [maxRecords,setMaxRecords]=useState(50);
 const [query,setQuery]=useState("");
 const [items,setItems]=useState<Lead[]>([]);
 const [total,setTotal]=useState(0);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const load=useCallback(async()=>{
  const response=await fetch("/api/lead-extractor/search?q="+encodeURIComponent(query)+"&limit=50");
  if(!response.ok)return;
  const data=await response.json(); setItems(data.items||[]); setTotal(data.total||0);
 },[query]);
 useEffect(()=>{void load();},[load]);
 async function search(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/lead-extractor/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source,categories:categories.split(",").map(x=>x.trim()).filter(Boolean),locations:locations.split(",").map(x=>x.trim()).filter(Boolean),maxRecords})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||"Ricerca non riuscita");
   setMessage("Record ricevuti: "+data.received+" · Nuovi: "+data.imported+" · Duplicati: "+data.duplicates);
   await load();
  }catch(error){setMessage(error instanceof Error?error.message:"Errore di connessione");}
  finally{setBusy(false);}
 }
 return <section className="b2b-workspace" id="lead-extractor">
  <div className="b2b-heading"><div><span className="eyebrow">AGENTE P0 · ACQUISIZIONE DATI</span><h2>B2B Lead Extractor AI</h2><p>Ricerca multi-fonte e schede aziendali complete: identità, categoria, sede, telefoni, email, sito e social quando disponibili.</p></div><strong>{total.toLocaleString("it-IT")} record</strong></div>
  <form className="b2b-search-form" onSubmit={search}>
   <label>Fonte<select value={source} onChange={e=>setSource(e.target.value)}><option value="google_maps">Google Maps · Priorità 1</option><option value="pagine_gialle">Pagine Gialle · Priorità 2</option></select></label>
   <label>Categorie merceologiche<input value={categories} onChange={e=>setCategories(e.target.value)} placeholder="Es. dentisti, avvocati, ristoranti"/></label>
   <label>Località / Comuni / CAP<input value={locations} onChange={e=>setLocations(e.target.value)} placeholder="Es. Bari, 70121, Puglia"/></label>
   <label>Numero massimo<select value={maxRecords} onChange={e=>setMaxRecords(Number(e.target.value))}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label>
   <button type="submit" disabled={busy}>{busy?"Ricerca in corso…":"Avvia ricerca e importa"}</button>
  </form>
  {message&&<p className="b2b-message" role="status">{message}</p>}
  <div className="b2b-list-tools"><h3>Archivio lead</h3><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cerca azienda, categoria, città, CAP, email"/></div>
  <div className="b2b-table-wrap"><table className="b2b-table"><thead><tr><th>Azienda / referente</th><th>Categoria</th><th>Indirizzo</th><th>Cellulare</th><th>Telefono fisso</th><th>Email</th><th>Sito</th><th>Fonte</th></tr></thead><tbody>
   {items.map(item=><tr key={item.id}><td><strong>{item.legalName||item.companyName||"—"}</strong><small>{[item.firstName,item.lastName].filter(Boolean).join(" ")}</small></td><td>{item.category||"—"}</td><td>{[item.streetAddress,item.postalCode,item.city,item.province,item.region].filter(Boolean).join(", ")||"—"}</td><td>{item.mobilePhone||"—"}</td><td>{item.landlinePhone||"—"}</td><td>{item.email||"—"}</td><td>{item.website?<a href={item.website} target="_blank" rel="noreferrer">Apri sito</a>:"—"}</td><td>{item.source==="google_maps"?"Google Maps":"Pagine Gialle"}</td></tr>)}
   {!items.length&&<tr><td colSpan={8}>Nessun record nell'archivio.</td></tr>}
  </tbody></table></div>
  <p className="b2b-footnote">I campi non pubblicati dalla fonte restano vuoti. I dati importati sono grezzi finché non vengono verificati; la raccolta non autorizza automaticamente attività di marketing.</p>
 </section>;
}
