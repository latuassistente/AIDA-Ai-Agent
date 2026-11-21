import type { SourceRow } from "./lead-extractor-normalize";

export type ItalianDirectory = "pagine_gialle" | "pagine_bianche";

const HOSTS: Record<ItalianDirectory, string> = {
  pagine_gialle: "www.paginegialle.it",
  pagine_bianche: "www.paginebianche.it",
};

function decodeEntities(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function collectBusinesses(value: unknown, output: SourceRow[], seen: Set<string>): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectBusinesses(item, output, seen);
    return;
  }
  const item = value as Record<string, unknown>;
  const rawType = item["@type"];
  const types = Array.isArray(rawType) ? rawType : [rawType];
  const isBusiness = types.some((type) => typeof type === "string" && /LocalBusiness|Organization|ProfessionalService|Store|MedicalBusiness/i.test(type));
  if (isBusiness) {
    const key = String(item.url || item["@id"] || item.name || "");
    if (key && !seen.has(key)) {
      seen.add(key);
      output.push(item);
    }
  }
  for (const child of Object.values(item)) collectBusinesses(child, output, seen);
}

export function extractDirectoryJsonLd(html: string): SourceRow[] {
  const rows: SourceRow[] = [];
  const seen = new Set<string>();
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const body = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try { collectBusinesses(JSON.parse(decodeEntities(body)), rows, seen); } catch { /* malformed structured data is ignored */ }
  }
  return rows;
}

function allowedUrl(directory: ItalianDirectory, raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.hostname !== HOSTS[directory]) throw new Error("DIRECTORY_URL_NOT_ALLOWED");
  return url;
}

async function robotsAllows(directory: ItalianDirectory, target: URL, userAgent: string): Promise<boolean> {
  const robotsUrl = new URL("/robots.txt", target.origin);
  const response = await fetch(robotsUrl, { headers: { "User-Agent": userAgent }, signal: AbortSignal.timeout(10000), redirect: "error" });
  if (!response.ok) return false;
  const lines = (await response.text()).split(/\r?\n/);
  let applies = false;
  const disallowed: string[] = [];
  for (const raw of lines) {
    const line = raw.split("#", 1)[0].trim();
    const match = /^(user-agent|disallow):\s*(.*)$/i.exec(line);
    if (!match) continue;
    if (match[1].toLowerCase() === "user-agent") {
      const agent = match[2].trim();
      applies = agent === "*" || userAgent.toLowerCase().includes(agent.toLowerCase());
    } else if (applies && match[2]) disallowed.push(match[2]);
  }
  return !disallowed.some((path) => target.pathname.startsWith(path));
}

export async function searchItalianDirectory(args: {
  directory: ItalianDirectory;
  category: string;
  location: string;
  searchUrl: string;
  userAgent: string;
  maxPages?: number;
}): Promise<SourceRow[]> {
  const firstUrl = allowedUrl(args.directory, args.searchUrl);
  const rows: SourceRow[] = [];
  const visited = new Set<string>();
  let next: URL | null = firstUrl;
  const maxPages = Math.min(10, Math.max(1, args.maxPages ?? 5));
  while (next && rows.length < 100 && visited.size < maxPages) {
    const current = next;
    next = null;
    if (visited.has(current.href)) break;
    visited.add(current.href);
    if (!(await robotsAllows(args.directory, current, args.userAgent))) {
      if (visited.size === 1) throw new Error("DIRECTORY_ROBOTS_DISALLOW_OR_UNAVAILABLE");
      break;
    }
    const response = await fetch(current, {
      headers: { "User-Agent": args.userAgent, Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("DIRECTORY_HTTP_" + response.status);
    const html = await response.text();
    const pageRows = extractDirectoryJsonLd(html);
    for (const row of pageRows) {
      rows.push({ ...row, sourceDirectory: args.directory, searchCategory: args.category, searchLocation: args.location });
      if (rows.length >= 100) break;
    }
    const relNext = /<link[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']/i.exec(html)?.[1]
      || /<a[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']/i.exec(html)?.[1];
    if (relNext) {
      const candidate = new URL(decodeEntities(relNext), current);
      if (candidate.origin === firstUrl.origin) next = allowedUrl(args.directory, candidate.href);
    }
  }
  return rows;
}
