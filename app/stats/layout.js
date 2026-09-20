const BASE_URL = "https://matchzone-live.vercel.app";

export const metadata = {
  title: "إحصائيات كرة القدم",
  description:
    "إحصائيات كرة القدم ومتابعة أرقام الهدافين وأبرز بيانات المباريات على MatchZone.",
  alternates: {
    canonical: `${BASE_URL}/stats`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function StatsLayout({ children }) {
  return children;
}
