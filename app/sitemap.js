const BASE_URL = "https://matchzone-live.vercel.app";

const leagues = [
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
];

async function getTodayMatches() {
  const date = new Date().toISOString().slice(0, 10);
  const leagueIds = [4328, 4335, 4332, 4331, 4334];

  try {
    const responses = await Promise.all(
      leagueIds.map(async (leagueId) => {
        const res = await fetch(
          `https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=${date}&l=${leagueId}`,
          { next: { revalidate: 300 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.events) ? data.events : [];
      })
    );

    return responses.flat();
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();
  const events = await getTodayMatches();

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
    {
      url: `${BASE_URL}/standings/premier-league`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
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
