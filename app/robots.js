export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://matchzone-live.vercel.app/sitemap.xml",
  };
}
