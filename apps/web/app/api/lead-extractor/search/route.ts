import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../lib/verified-session";

type Source = "google_maps" | "pagine_gialle";
type Row = Record<string, unknown>;
const clean = (...values: unknown[]): string | null => {
  for (const value of values) if ((typeof value === "string" && value.trim()) || typeof value === "number") return String(value).trim().slice(0, 2000);
  return null;
};
const values = (value: unknown) => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && !!v.trim()).slice(0, 30) : [];
const phone = (value: unknown) => clean(value)?.replace(/[^\d+]/g, "") || null;
const email = (value: unknown) => { const v = clean(value); return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v.toLowerCase() : null; };
const webUrl = (value: unknown) => { const v = clean(value); if (!v) return null; try { const u = new URL(v.startsWith("http") ? v : "https://" + v); return ["https:","http:"].includes(u.protocol) ? u.toString() : null; } catch { return null; } };
function normalize(r: Row, source: Source) {
  const companyName = clean(r.title,r.name,r.companyName,r.businessName,r.ragioneSociale);
  const contact = clean(r.contactName,r.fullName,r.personName,r.ownerName);
  const parts = contact?.split(/\s+/) || [];
  const sourceRecordId = clean(r.placeId,r.place_id,r.id,r.companyId,r.businessId);
  const sourceUrl = webUrl(r.url ?? r.placeUrl ?? r.profileUrl);
  const sourceKey = createHash("sha256").update(source + "|" + (sourceRecordId || sourceUrl || companyName || JSON.stringify(r))).digest("hex");
  const socialProfiles = {
    facebook: webUrl(r.facebook ?? r.facebookUrl),
    instagram: webUrl(r.instagram ?? r.instagramUrl),
    linkedin: webUrl(r.linkedin ?? r.linkedinUrl),
    x: webUrl(r.twitter ?? r.xUrl),
    other: values(r.socialProfiles),
  };
  return {
    source, sourceRecordId, sourceUrl, sourceKey,
    category: clean(r.categoryName,r.category,r.industry,r.primaryCategory,Array.isArray(r.categories)?r.categories.join("; "):null),
    companyName, legalName: clean(r.legalName,r.legal_name,r.companyLegalName,r.ragioneSociale),
    firstName: clean(r.firstName,r.first_name) || (parts.length>1 ? parts.slice(0,-1).join(" ") : null),
    lastName: clean(r.lastName,r.last_name) || (parts.length>1 ? parts.at(-1) : null),
    streetAddress: clean(r.address,r.fullAddress,r.streetAddress,r.formattedAddress),
    street: clean(r.street,r.streetName,r.route), streetNumber: clean(r.streetNumber,r.street_number),
    postalCode: clean(r.postalCode,r.zip,r.zipCode,r.postcode,r.cap),
    city: clean(r.city,r.municipality,r.comune,r.town), province: clean(r.province,r.provinceCode,r.provincia),
    region: clean(r.region,r.regione), country: clean(r.countryCode,r.country) || "IT",
    mobilePhone: phone(r.mobile ?? r.mobilePhone ?? r.mobileNumber ?? r.whatsapp),
    landlinePhone: phone(r.phone ?? r.phoneNumber ?? r.telephone ?? r.telefono),
    email: email(r.email ?? r.emailAddress), website: webUrl(r.website ?? r.websiteUrl ?? r.web),
    socialProfiles: Object.values(socialProfiles).some(v => Array.isArray(v) ? v.length : !!v) ? socialProfiles : undefined,
    vatNumber: clean(r.vatNumber,r.vat,r.piva,r.partitaIva),
    latitude: typeof r.latitude==="number" ? r.latitude : typeof r.lat==="number" ? r.lat : null,
    longitude: typeof r.longitude==="number" ? r.longitude : typeof r.lng==="number" ? r.lng : null,
    sourceFields: r, fieldProvenance: { source, retrievedAt: new Date().toISOString(), sourceKeys: Object.keys(r) }, qualityStatus: "RAW",
  };
}

export async function POST(request: Request) {
  const origin=request.headers.get("origin");
  if(origin && origin!==new URL(request.url).origin) return NextResponse.json({error:"Cross-origin request rejected"},{status:403});
  const session=await getVerifiedAidaSession();
  if(!session) return NextResponse.json({error:"Authentication required"},{status:401});
  const token=process.env.APIFY_API_TOKEN;
  if(!token) return NextResponse.json({error:"APIFY_API_TOKEN non configurato."},{status:503});
  let input: Row;
  try { input=await request.json() as Row; } catch { return NextResponse.json({error:"JSON non valido."},{status:400}); }
  const source=input.source as Source, categories=values(input.categories), locations=values(input.locations);
  const limit=Math.min(100,Math.max(1,Number(input.maxRecords)||50));
  if(!["google_maps","pagine_gialle"].includes(source)||!categories.length||!locations.length) return NextResponse.json({error:"Selezionare fonte, categorie e località."},{status:400});
  const actor=source==="google_maps"?(process.env.APIFY_GOOGLE_MAPS_ACTOR||"compass~crawler-google-places"):(process.env.APIFY_PAGINE_GIALLE_ACTOR||"emastra~pagine-gialle-scraper");
  const actorInput=source==="google_maps"
    ? {searchStringsArray:categories,locationQuery:locations.join(", Italy"),maxCrawledPlacesPerSearch:limit,language:"it",countryCode:"it",scrapeContacts:true,scrapePlaceDetailPage:true,scrapeSocialMediaProfiles:{facebooks:true,instagrams:true,youtubes:false,tiktoks:false,twitters:true},maximumLeadsEnrichmentRecords:0,verifyLeadsEnrichmentEmails:false}
    : {categories,locations,maxItems:limit,maxItemsPerQuery:limit,deduplicateResults:true};
  let response: Response;
  try { response=await fetch("https://api.apify.com/v2/acts/"+encodeURIComponent(actor)+"/run-sync-get-dataset-items?token="+encodeURIComponent(token)+"&timeout=180&memory=2048",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(actorInput),signal:AbortSignal.timeout(190000),redirect:"error"}); }
  catch { return NextResponse.json({error:"Apify non raggiungibile o timeout."},{status:502}); }
  if(!response.ok) return NextResponse.json({error:"Apify HTTP "+response.status},{status:502});
  const body=await response.text();
  if(Buffer.byteLength(body,"utf8")>20*1024*1024) return NextResponse.json({error:"Dataset oltre 20 MB."},{status:502});
  let rows: unknown; try { rows=JSON.parse(body); } catch { return NextResponse.json({error:"Dataset Apify non valido."},{status:502}); }
  if(!Array.isArray(rows)) return NextResponse.json({error:"Formato dataset Apify non valido."},{status:502});
  const normalized=rows.slice(0,limit).filter((r):r is Row=>!!r&&typeof r==="object"&&!Array.isArray(r)).map(r=>normalize(r,source));
  if(!normalized.length) return NextResponse.json({error:"Nessun record restituito dalla fonte."},{status:422});
  const created=await prisma.b2BLead.createMany({data:normalized.map(r=>({...r,tenantId:session.tenantId})),skipDuplicates:true});
  await prisma.auditLog.create({data:{tenantId:session.tenantId,actor:session.sub,action:"B2B_LEADS_SOURCE_IMPORT",decision:"ALLOW",details:{source,actor,categories,locations,received:normalized.length,inserted:created.count,duplicates:normalized.length-created.count}}});
  return NextResponse.json({source,actor,received:normalized.length,imported:created.count,duplicates:normalized.length-created.count,fields:["category","companyName","legalName","firstName","lastName","streetAddress","postalCode","city","province","region","mobilePhone","landlinePhone","email","website","socialProfiles","vatNumber"],sent:false});
}
