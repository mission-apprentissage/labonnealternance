export type SitemapUrlEntry = {
  loc: string
  lastmod?: Date
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
}

const xmlEncode = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

export const generateSitemapFromUrlEntries = (urlEntries: SitemapUrlEntry[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries
  .map((urlEntry) => {
    const { loc, changefreq, lastmod, priority } = urlEntry
    const fields = [
      `<loc>${xmlEncode(loc)}</loc>`,
      lastmod ? `<lastmod>${lastmod.toISOString()}</lastmod>` : "",
      changefreq ? `<changefreq>${changefreq}</changefreq>` : "",
      priority !== undefined ? `<priority>${priority}</priority>` : "",
    ]
    return `<url>${fields.filter((x) => x).join(`\n`)}
   </url>`
  })
  .join("")}
</urlset>`
