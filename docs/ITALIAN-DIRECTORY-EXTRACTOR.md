# Estrattore open source Pagine Gialle e Pagine Bianche

## Scelta tecnica

AIDA introduce un connettore proprietario TypeScript che usa esclusivamente le API standard di Node.js e non richiede Apify, QuanticData, proxy commerciali o browser headless. Il parser legge i dati strutturati JSON-LD pubblicati nelle pagine HTML e conserva il payload originale e la provenienza.

Fonti supportate dal contratto:
- Pagine Gialle Italia: `pagine_gialle`
- Pagine Bianche Italia: `pagine_bianche`

## Limiti dichiarati

Questa prima implementazione è un connettore conservativo basato su JSON-LD, non un crawler universale. Non presume selettori HTML privati, non aggira CAPTCHA, login, paywall, blocchi o altre protezioni e non tenta di superare divieti espressi in robots.txt. Se il sito non pubblica dati strutturati accessibili, il connettore non inventa né ricostruisce i campi.

Non è ancora certificata la compatibilità con le pagine live dei due portali. I percorsi di ricerca e la presenza effettiva dei campi vanno verificati prima dell'attivazione.

## Configurazione

- `DIRECTORY_SCRAPER_USER_AGENT`: identificativo descrittivo del client con contatto operativo.
- `PAGINE_GIALLE_SEARCH_URL_TEMPLATE`: URL di ricerca verificato, con placeholder `{category}` e `{location}`.
- `PAGINE_BIANCHE_SEARCH_URL_TEMPLATE`: URL di ricerca verificato, con gli stessi placeholder.

Gli URL sono vincolati rispettivamente agli host `www.paginegialle.it` e `www.paginebianche.it`. Il connettore rifiuta redirect, verifica robots.txt, limita la scansione a cinque pagine per ricerca e non effettua richieste parallele.

## Endpoint

`POST /api/lead-extractor/directory-search`

Body:
```json
{
  "sources": ["pagine_gialle", "pagine_bianche"],
  "categories": ["dentisti"],
  "locations": ["Bari"],
  "maxRecords": 50
}
```

I record passano nel normalizzatore B2B esistente e vengono salvati nel tenant autenticato con audit log. Deduplica attuale: chiave sorgente/record; il matching tra directory e Google Maps resta una fase distinta.

## Stato

Il parser JSON-LD e l'endpoint autenticato sono implementati. Prima di dichiarare il connettore operativo occorrono URL di ricerca live verificati, test di accesso autorizzato ai due portali e verifica dei campi realmente pubblicati. Non viene dichiarato alcun volume garantito né copertura completa.
