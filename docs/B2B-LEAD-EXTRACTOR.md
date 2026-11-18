# B2B Lead Extractor AI — fonti, normalizzazione e connettori

Campi previsti: categoria, ragione sociale, denominazione, nome/cognome del referente se pubblicati, indirizzo, via, civico, CAP, Comune, Provincia, Regione, Paese, cellulare, telefono fisso, email, sito, social, partita IVA e coordinate. Campi assenti restano null; payload originale e provenienza sono conservati.

Fonti prioritarie:
- Google Maps tramite Actor Apify configurabile (default compass~crawler-google-places). L'Actor accetta una sola locationQuery per run: il backend esegue le località in sequenza.
- Pagine Gialle tramite Actor Apify configurabile (default emastra~pagine-gialle-scraper), con categorie e località in array.
- Profili social pubblici: arricchimento opzionale dei profili collegati alle schede; nessun accesso a profili privati o aggiramento di controlli.
- Architettura predisposta a connettori open-data e API ufficiali (OpenStreetMap per riferimenti territoriali/geografici, API ufficiali per account/schede gestite).

API: POST /api/lead-extractor/search con source, categories, locations, maxRecords (massimo 100); GET /api/lead-extractor/search con q, limit, offset.

Variabili server:
APIFY_API_TOKEN (Bearer, server-side);
APIFY_GOOGLE_MAPS_ACTOR (default compass~crawler-google-places);
APIFY_PAGINE_GIALLE_ACTOR (default emastra~pagine-gialle-scraper);
APIFY_ENABLE_CONTACT_ENRICHMENT=true abilita l'add-on contatti sito e può generare costi;
APIFY_ENABLE_SOCIAL_ENRICHMENT=true abilita l'add-on social e può generare costi.
Gli add-on a pagamento sono disabilitati per default.

Deduplicazione attuale: tenant + fonte + ID/URL sorgente. Non fonde automaticamente Maps e Pagine Gialle: il matching cross-source richiede una fase verificabile. I dati non sono automaticamente verificati; la pubblicazione di un contatto non equivale a consenso marketing. La categoria originale è conservata; mapping ATECO separato e versionato. Nessun dato geografico viene inventato se assente.

Variabile aggiuntiva: APIFY_ENABLE_PLACE_DETAILS=true abilita lo scraping delle pagine di dettaglio Google Maps. È disabilitata per default perché può aumentare i costi e i tempi. Gli add-on contatti/social e i dettagli sono quindi opt-in espliciti.

## Arricchimento geografico open source
POST /api/lead-extractor/geocode — arricchisce fino a 20 schede per richiesta usando OpenStreetMap Nominatim. Aggiorna solo CAP, Comune, Provincia, Regione, Paese e coordinate mancanti; non sovrascrive i dati già presenti e registra la provenienza. Configurazione: OSM_NOMINATIM_BASE_URL e OSM_NOMINATIM_USER_AGENT. È possibile usare un'istanza Nominatim autogestita. Se si usa un servizio pubblico, rispettare la sua policy d'uso e i limiti di frequenza; il connettore è deliberatamente limitato a 20 record per richiesta e non effettua chiamate parallele.
