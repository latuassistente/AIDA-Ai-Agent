import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../lib/verified-session";

type OSMAddress = { postcode?:string; city?:string; town?:string; village?:string; municipality?:string; county?:string; state?:string; country_code?:string };
type OSMResult = { lat?:string; lon?:string; address?:OSMAddress; display_name?:string };

export async function POST(request:Request){
 const origin=request.headers.get("origin");
 if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:"Cross-origin request rejected"},{status:403});
 const session=await getVerifiedAidaSession();
 if(!session)return NextResponse.json({error:"Authentication required"},{status:401});
 const base=process.env.OSM_NOMINATIM_BASE_URL;
 const userAgent=process.env.OSM_NOMINATIM_USER_AGENT;
 if(!base||!userAgent)return NextResponse.json({error:"Configurare OSM_NOMINATIM_BASE_URL e OSM_NOMINATIM_USER_AGENT."},{status:503});
 let baseUrl:URL;
 try{baseUrl=new URL(base);}catch{return NextResponse.json({error:"URL Nominatim non valido."},{status:503});}
 if(!["https:","http:"].includes(baseUrl.protocol))return NextResponse.json({error:"Protocollo Nominatim non supportato."},{status:503});
 let body:{limit?:number};
 try{body=await request.json() as {limit?:number};}catch{return NextResponse.json({error:"JSON non valido."},{status:400});}
 const limit=Math.min(20,Math.max(1,Number(body.limit)||10));
 const leads=await prisma.b2BLead.findMany({where:{tenantId:session.tenantId,OR:[{latitude:null},{longitude:null},{postalCode:null},{region:null},{province:null}]},orderBy:{createdAt:"asc"},take:limit});
 let enriched=0,notFound=0,failed=0;
 for(const lead of leads){
  const query=[lead.streetAddress,lead.street,lead.streetNumber,lead.postalCode,lead.city,lead.province,lead.region,"Italia"].filter(Boolean).join(", ");
  if(!query){notFound++;continue;}
  try{
   const endpoint=new URL("/search",baseUrl);endpoint.searchParams.set("format","jsonv2");endpoint.searchParams.set("addressdetails","1");endpoint.searchParams.set("limit","1");endpoint.searchParams.set("q",query);
   const response=await fetch(endpoint,{headers:{"Accept":"application/json","User-Agent":userAgent},signal:AbortSignal.timeout(12000),redirect:"error"});
   if(!response.ok)throw new Error("NOMINATIM_HTTP_"+response.status);
   const results=await response.json() as OSMResult[];
   const match=results[0];
   if(!match){notFound++;continue;}
   const address=match.address||{};
   const updates={
    latitude:lead.latitude??(match.lat?Number(match.lat):null),
    longitude:lead.longitude??(match.lon?Number(match.lon):null),
    postalCode:lead.postalCode??address.postcode??null,
    city:lead.city??address.city??address.town??address.village??address.municipality??null,
    province:lead.province??address.county??null,
    region:lead.region??address.state??null,
    country:lead.country==="IT"?(address.country_code?.toUpperCase()||"IT"):lead.country,
    fieldProvenance:{
     ...(lead.fieldProvenance&&typeof lead.fieldProvenance==="object"?lead.fieldProvenance as Record<string,unknown>:{}),
     osmGeocoding:{source:"OpenStreetMap Nominatim",retrievedAt:new Date().toISOString(),query,displayName:match.display_name||null}
    } as Prisma.InputJsonObject
   };
   if(updates.latitude===null&&updates.longitude===null&&updates.postalCode===null&&updates.region===null&&updates.province===null){notFound++;continue;}
   await prisma.b2BLead.update({where:{id:lead.id},data:updates});
   enriched++;
  }catch{failed++;}
 }
 await prisma.auditLog.create({data:{tenantId:session.tenantId,actor:session.sub,action:"B2B_LEADS_OSM_ENRICHMENT",decision:"ALLOW",details:{requested:leads.length,enriched,notFound,failed,provider:"OpenStreetMap Nominatim"}}});
 return NextResponse.json({requested:leads.length,enriched,notFound,failed,provider:"OpenStreetMap Nominatim",limit});
}
