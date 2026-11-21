"use client";

import { useMemo, useState } from "react";

type LocalFile = { file: File; path: string; extension: string; category: string };
const categoryFor = (extension: string) => {
 const ext=extension.toLowerCase();
 if(["pdf","doc","docx","odt","rtf","txt"].includes(ext))return "Documenti";
 if(["xls","xlsx","csv","ods"].includes(ext))return "Fogli di calcolo";
 if(["ppt","pptx","odp"].includes(ext))return "Presentazioni";
 if(["jpg","jpeg","png","gif","webp","svg","heic"].includes(ext))return "Immagini";
 if(["mp3","wav","mp4","mov","avi"].includes(ext))return "Audio e video";
 if(["zip","rar","7z","tar","gz"].includes(ext))return "Archivi";
 return "Altri file";
};

export default function PCFileManagerWorkspace(){
 const [files,setFiles]=useState<LocalFile[]>([]);
 const [query,setQuery]=useState("");
 const [kind,setKind]=useState("Tutti i tipi");
 const [message,setMessage]=useState("");
 const [folderPlan,setFolderPlan]=useState(false);
 const [selected,setSelected]=useState<string[]>([]);
 const results=useMemo(()=>files.filter(item=>{
  const matchesName=item.path.toLocaleLowerCase("it").includes(query.toLocaleLowerCase("it"));
  const matchesType=kind==="Tutti i tipi"||item.category===kind;
  return matchesName&&matchesType;
 }),[files,query,kind]);
 const duplicates=useMemo(()=>{
  const seen=new Map<string,number>();
  for(const item of files){const key=item.file.name.toLowerCase()+"|"+item.file.size;seen.set(key,(seen.get(key)||0)+1);}
  return [...seen.values()].reduce((sum,count)=>sum+(count>1?count-1:0),0);
 },[files]);
 function addFiles(list:FileList|null){
  if(!list)return;
  const next=Array.from(list).map(file=>{
   const path=(file as File&{webkitRelativePath?:string}).webkitRelativePath||file.name;
   const extension=file.name.includes(".")?file.name.split(".").pop()!.toLowerCase():"senza estensione";
   return {file,path,extension,category:categoryFor(extension)};
  });
  setFiles(next);setSelected([]);setFolderPlan(false);
  setMessage(next.length+" file caricati per l'analisi locale nel browser. Nessun file è stato modificato o caricato su AIDA.");
 }
 function toggle(path:string){setSelected(current=>current.includes(path)?current.filter(x=>x!==path):[...current,path]);}
 const categories=[...new Set(files.map(item=>item.category))];
 return <section className="pcfm-workspace" id="pc-file-manager">
  <div className="pcfm-heading"><div><span className="eyebrow">AGENTE P0 · PC FILE MANAGER AI</span><h2>Ricerca e organizzazione dei file</h2><p>Seleziona i file o una cartella, individua i documenti e visualizza un piano di classificazione prima di qualsiasi modifica.</p></div><span className="pcfm-status">ANTEPRIMA LOCALE</span></div>
  <div className="pcfm-security"><b>Accesso controllato</b><span>Questa sessione analizza soltanto i file selezionati esplicitamente. Lo spostamento e la rinomina sul computer richiedono il Desktop Companion autorizzato, non ancora collegato.</span></div>
  <div className="pcfm-import"><div><b>1. Seleziona i file da analizzare</b><small>Puoi selezionare più file. Per includere una cartella, usa la selezione cartella del browser.</small></div><label className="pcfm-pick">Seleziona file<input type="file" multiple onChange={event=>addFiles(event.target.files)}/></label><label className="pcfm-pick">Seleziona cartella<input type="file" multiple onChange={event=>addFiles(event.target.files)} {...({webkitdirectory:""} as object)}/></label></div>
  <div className="pcfm-tools"><label>Parola chiave<input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Cerca nel nome o nel percorso del file"/></label><label>Tipo documento<select value={kind} onChange={event=>setKind(event.target.value)}><option>Tutti i tipi</option>{categories.map(category=><option key={category}>{category}</option>)}</select></label><button type="button" className="secondary-action" onClick={()=>{setQuery("");setKind("Tutti i tipi");}}>Azzera filtri</button></div>
  <div className="pcfm-stats"><div><b>{files.length}</b><span>File selezionati</span></div><div><b>{results.length}</b><span>Risultati ricerca</span></div><div><b>{categories.length}</b><span>Categorie rilevate</span></div><div><b>{duplicates}</b><span>Possibili duplicati</span></div></div>
  {message&&<p className="pcfm-message" role="status">{message}</p>}
  <div className="pcfm-results-head"><b>2. Risultati e classificazione</b><span>{selected.length} selezionati</span></div>
  <div className="pcfm-table-wrap"><table><thead><tr><th></th><th>Nome file e percorso</th><th>Categoria suggerita</th><th>Formato</th><th>Dimensione</th><th>Ultima modifica</th></tr></thead><tbody>{results.map((item,index)=><tr key={item.path+"-"+index}><td><input aria-label={"Seleziona "+item.file.name} type="checkbox" checked={selected.includes(item.path)} onChange={()=>toggle(item.path)}/></td><td><b>{item.file.name}</b><small>{item.path}</small></td><td>{item.category}</td><td>{item.extension.toUpperCase()}</td><td>{(item.file.size/1024).toLocaleString("it-IT",{maximumFractionDigits:1})} KB</td><td>{new Date(item.file.lastModified).toLocaleDateString("it-IT")}</td></tr>)}{!results.length&&<tr><td colSpan={6}>Seleziona file o cartella per iniziare.</td></tr>}</tbody></table></div>
  <div className="pcfm-plan-actions"><button type="button" className="secondary-action" disabled={!files.length} onClick={()=>setFolderPlan(true)}>Genera piano cartelle</button><button type="button" className="primary-action" disabled={!selected.length} onClick={()=>setMessage("Anteprima pronta: "+selected.length+" file selezionati. Per applicare spostamenti o rinomine è necessario collegare il Desktop Companion.")}>Prepara selezione</button></div>
  {folderPlan&&<div className="pcfm-plan"><b>3. Piano di classificazione — anteprima</b><p>Proposta basata esclusivamente sull'estensione del file. Nessuno spostamento viene eseguito.</p>{categories.map(category=><div key={category}><span>/{category}</span><strong>{files.filter(item=>item.category===category).length} file</strong></div>)}</div>}
  <p className="pcfm-note">Ricerca disponibile sui nomi e sui percorsi dei file selezionati. La ricerca nel contenuto, l'indicizzazione persistente, le operazioni reversibili sul disco e il controllo dei permessi delle cartelle saranno abilitati soltanto tramite Desktop Companion.</p>
 </section>;
}
