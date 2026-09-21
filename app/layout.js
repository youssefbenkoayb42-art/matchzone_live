import "./globals.css";
import SiteNav from "./SiteNav";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  metadataBase: new URL("https://matchzone-live.vercel.app"),
  title: {
    default: "MatchZone | مباريات اليوم ونتائج كرة القدم",
    template: "%s | MatchZone",
  },
  description:
    "تابع مباريات اليوم ونتائج كرة القدم ومواعيد المباريات وأهم البطولات العالمية على MatchZone.",
  applicationName: "MatchZone",
  openGraph: {
    title: "MatchZone | مباريات اليوم ونتائج كرة القدم",
    description:
      "مباريات اليوم، النتائج، المواعيد وأهم البطولات العالمية في منصة كرة قدم سريعة.",
    url: "https://matchzone-live.vercel.app/",
    siteName: "MatchZone",
    locale: "ar_MA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchZone | مباريات اليوم ونتائج كرة القدم",
    description: "مباريات اليوم ونتائج كرة القدم ومواعيد أهم المباريات.",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "Gi4K2x12JHBBurZtn6eRDK2_PsLNEOaformdUgvYOQY",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SiteNav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
