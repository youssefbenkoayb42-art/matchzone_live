export const metadata = {
  title: "MatchZone",
  description: "منصة رياضية للمباريات والنتائج والأخبار",
  verification: {
    google: "Gi4K2x12JHBBurZtn6eRDK2_PsLNEOaformdUgvYOQY",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
