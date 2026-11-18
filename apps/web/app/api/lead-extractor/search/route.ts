import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../lib/verified-session";
import { normalizeLead, type LeadSource, type SourceRow } from "../../../../lib/lead-extractor-normalize";
const list=(v:unknown)=>Array.isArray(v)?v.filter((x):x is string=>typeof x==="string"&&!!x.trim()).map(x=>x.trim()).slice(0,30):[];
async function runActor(actor:string,token:string,input:Record<string,unknown>):Promise<SourceRow[]>{
 const endpoint=new URL("https://api.apify.com/v2/acts/"+encodeURIComponent(actor)+"/run-sync-get-dataset-items");endpoint.searchParams.set("timeout","180");endpoint.searchParams.set("memory","2048");
 const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(input),signal:AbortSignal.timeout(190000),redirect:"error"});
 if(!response.ok)throw new Error("APIFY_HTTP_"+response.status);
 const body=await response.text();if(Buffer.byteLength(body,"utf8")>20*1024*1024)throw new Error("APIFY_DATASET_TOO_LARGE");
 const data:unknown=JSON.parse(body);if(!Array.isArray(data))throw new Error("APIFY_INVALID_DATASET");
 return data.filter((x):x is SourceRow=>!!x&&typeof x==="object"&&!Array.isArray(x));
}
export async function POST(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Cross-origin request rejected"},{status:403});
 const session=await getVerifiedAidaSession();if(!session)return NextResponse.json({error:"Authentication required"},{status:401});
 const token=process.env.APIFY_API_TOKEN;if(!token)return NextResponse.json({error:"APIFY_API_TOKEN non configurato."},{status:503});
 let input:Record<string,unknown>;try{input=await request.json() as Record<string,unknown>;}catch{return NextResponse.json({error:"JSON non valido."},{status:400});}
 const source=input.source as LeadSource,categories=list(input.categories),locations=list(input.locations),limit=Math.min(100,Math.max(1,Number(input.maxRecords)||50));
 if(!["google_maps","pagine_gialle"].includes(source)||!categories.length||!locations.length)return NextResponse.json({error:"Selezionare fonte, categorie e località."},{status:400});
 const actor=source==="google_maps"?(process.env.APIFY_GOOGLE_MAPS_ACTOR||"compass~crawler-google-places"):(process.env.APIFY_PAGINE_GIALLE_ACTOR||"emastra~pagine-gialle-scraper");
 const retrievedAt=new Date().toISOString();let rows:SourceRow[]=[];
 try{
  if(source==="google_maps"){
   // Google Maps Actor supports one locationQuery per run: execute sequentially and cap the global result count.
   for(const location of locations){const remaining=limit-rows.length;if(remaining<=0)break;
    const batch=await runActor(actor,token,{searchStringsArray:categories,locationQuery:location.includes("Italy")?location:location+", Italy",maxCrawledPlacesPerSearch:Math.max(1,Math.ceil(remaining/categories.length)),language:"it",countryCode:"it",scrapePlaceDetailPage:process.env.APIFY_ENABLE_PLACE_DETAILS==="true",
     scrapeContacts:process.env.APIFY_ENABLE_CONTACT_ENRICHMENT==="true",
     scrapeSocialMediaProfiles:{facebooks:process.env.APIFY_ENABLE_SOCIAL_ENRICHMENT==="true",instagrams:process.env.APIFY_ENABLE_SOCIAL_ENRICHMENT==="true",youtubes:false,tiktoks:false,twitters:false},
     maximumLeadsEnrichmentRecords:0,verifyLeadsEnrichmentEmails:false});
    rows.push(...batch.slice(0,remaining));
   }
  }else rows=await runActor(actor,token,{categories,locations,maxItems:limit,maxItemsPerQuery:limit,deduplicateResults:true});
 }catch(error){const message=error instanceof Error?error.message:"APIFY_ERROR";return NextResponse.json({error:message==="APIFY_DATASET_TOO_LARGE"?"Dataset Apify oltre 20 MB.":message==="APIFY_INVALID_DATASET"?"Dataset Apify non valido.":"Errore del connettore Apify: "+message},{status:502});}
 const normalized=rows.slice(0,limit).map(row=>normalizeLead(row,source,retrievedAt));if(!normalized.length)return NextResponse.json({error:"Nessun record restituito dalla fonte."},{status:422});
 const result=await prisma.b2BLead.createMany({data:normalized.map(r=>{const {socialProfiles,...leadData}=r;return {...leadData,tenantId:session.tenantId,sourceFields:r.sourceFields as Prisma.InputJsonObject,fieldProvenance:r.fieldProvenance as Prisma.InputJsonObject,...(socialProfiles?{socialProfiles:socialProfiles as Prisma.InputJsonObject}:{})};}),skipDuplicates:true});
 await prisma.auditLog.create({data:{tenantId:session.tenantId,actor:session.sub,action:"B2B_LEADS_SOURCE_IMPORT",decision:"ALLOW",details:{source,actor,categories,locations,received:normalized.length,inserted:result.count,duplicates:normalized.length-result.count,contactEnrichmentEnabled:process.env.APIFY_ENABLE_CONTACT_ENRICHMENT==="true",socialEnrichmentEnabled:process.env.APIFY_ENABLE_SOCIAL_ENRICHMENT==="true"}}});
 return NextResponse.json({source,actor,received:normalized.length,imported:result.count,duplicates:normalized.length-result.count,sent:false});
}
export async function GET(request:Request){
 const session=await getVerifiedAidaSession();if(!session)return NextResponse.json({error:"Authentication required"},{status:401});
 const params=new URL(request.url).searchParams,q=params.get("q")?.trim()||"",take=Math.min(100,Math.max(1,Number(params.get("limit"))||50)),skip=Math.max(0,Number(params.get("offset"))||0);
 const where={tenantId:session.tenantId,...(q?{OR:[{companyName:{contains:q,mode:"insensitive" as const}},{legalName:{contains:q,mode:"insensitive" as const}},{category:{contains:q,mode:"insensitive" as const}},{city:{contains:q,mode:"insensitive" as const}},{postalCode:{contains:q}},{email:{contains:q,mode:"insensitive" as const}}]}:{})};
 const [items,total]=await Promise.all([prisma.b2BLead.findMany({where,orderBy:{createdAt:"desc"},take,skip}),prisma.b2BLead.count({where})]);
 return NextResponse.json({items,total,limit:take,offset:skip});
}
