# MatchZone fallback data pipeline

MatchZone has no persistent database service configured in this repository, so the free fallback store is a versioned JSON datastore at `data/scraped-matches.json`.

## Flow

1. The primary API providers are queried by `/api/football`.
2. If the combined result count is below 10, the API reads the latest scraper snapshot.
3. The scraper uses Cheerio against public HTML pages for 50 configured football competitions.
4. Match IDs are deduplicated first by source event ID and then by date + normalized home/away names.
5. GitHub Actions runs the scraper every two hours and commits the snapshot only when it changes.
6. A Git push triggers the connected Vercel deployment.

## Important

The scraper does not bypass CAPTCHAs, authentication, paywalls, or anti-bot controls. Flashscore controls its own data and terms. Keep request frequency conservative and replace the source with a licensed/open provider if the site's terms or access policy do not permit automated collection.

For local testing:

```bash
npm install
npm run scrape:fallback
```

The scraper writes only normalized match metadata needed by MatchZone.
