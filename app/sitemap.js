const BASE_URL = "https://matchzone-live.vercel.app";

const leagues = [
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
];

async function getSitemapEvents() {
  const startDate = new Date();

  const dates = Array.from({ length: 7 }, (_, index) => {
    const target = new Date(startDate);
    target.setUTCDate(target.getUTCDate() + index);
    return target.toISOString().slice(0, 10);
  });

  try {
    const responses = await Promise.all(
      dates.map((date) =>
        fetch(
          `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${date}&s=Soccer`,
          { next: { revalidate: 900 } }
        )
      )
    );

    const data = await Promise.all(
      responses.map(async (res) => {
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json?.events) ? json.events : [];
      })
    );

    return data.flat();
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();
  const events = await getSitemapEvents();

  const matchIds = [
    ...new Set(events.map((event) => event?.idEvent).filter(Boolean)),
  ];

  const teamNames = [
    ...new Set(
      events
        .flatMap((event) => [event?.strHomeTeam, event?.strAwayTeam])
        .filter(Boolean)
    ),
  ];

  const discoveredLeagueIds = [
    ...new Set(
      events
        .map((event) => event?.idLeague)
        .filter(Boolean)
        .map(String)
    ),
  ];

  const featuredLeagueIds = new Set(["4328", "4335", "4332", "4331", "4334"]);
  const dynamicLeagueUrls = discoveredLeagueIds
    .filter((id) => !featuredLeagueIds.has(id))
    .map((id) => ({
      url: `${BASE_URL}/leagues/league-${id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.78,
    }));

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/leagues`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/matches/today`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/stats`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...leagues.map((slug) => ({
      url: `${BASE_URL}/leagues/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    })),
    ...leagues.map((slug) => ({
      url: `${BASE_URL}/standings/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    })),
    ...dynamicLeagueUrls,
    ...teamNames.map((team) => ({
      url: `${BASE_URL}/teams/${encodeURIComponent(team)}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.75,
    })),
    ...matchIds.map((id) => ({
      url: `${BASE_URL}/matches/${id}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
    })),
  ];
}
