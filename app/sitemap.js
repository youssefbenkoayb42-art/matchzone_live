import { getMatchSnapshot } from "../lib/match-snapshot";

const BASE_URL = "https://matchzone-live.vercel.app";

const leagues = [
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
];

export default async function sitemap() {
  const now = new Date();
  const matches = await getMatchSnapshot();

  const matchIds = [
    ...new Set(
      matches
        .map((match) => match?.fixture?.id)
        .filter(Boolean)
        .map(String)
    ),
  ];

  const teamNames = [
    ...new Set(
      matches
        .flatMap((match) => [
          match?.teams?.home?.name,
          match?.teams?.away?.name,
        ])
        .filter(Boolean)
    ),
  ];

  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: BASE_URL + "/leagues", lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: BASE_URL + "/results", lastModified: now, changeFrequency: "hourly", priority: 0.93 },
    { url: BASE_URL + "/matches/today", lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    ...leagues.map((slug) => ({
      url: BASE_URL + "/leagues/" + slug,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    })),
    ...leagues.map((slug) => ({
      url: BASE_URL + "/standings/" + slug,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    })),
    ...teamNames.map((team) => ({
      url: BASE_URL + "/teams/" + encodeURIComponent(team),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.75,
    })),
    ...matchIds.map((id) => ({
      url: BASE_URL + "/matches/" + encodeURIComponent(id),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.7,
    })),
  ];
}
