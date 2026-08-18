export const metadata = {
  title: "MatchZone",
  description: "منصة رياضية للمباريات والنتائج والأخبار",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
    }
