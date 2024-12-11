import { publicConfig } from "@/config.public"
import { mainSitemapLastModificationDate } from "@/services/generateMainSitemap"
import { getHostFromHeader } from "@/utils/requestUtils"

export async function GET(request: Request) {
  const sitemap = await generateSiteMap(request)

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  })
}

async function generateSiteMap(request: Request) {
  const host = getHostFromHeader(request)
  const response = await fetch(`${publicConfig.apiEndpoint}/sitemap-offers.xml`, {
    cache: "no-cache",
  })
  const lastModifiedHeader = response.headers.get("last-modified")
  const offersLastMod = new Date(lastModifiedHeader).toISOString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
   <sitemap>
      <loc>${host}/sitemap-main.xml</loc>
      <lastmod>${mainSitemapLastModificationDate.toISOString()}</lastmod>
   </sitemap>
   <sitemap>
      <loc>${host}/sitemap-offers.xml</loc>
      <lastmod>${offersLastMod}</lastmod>
   </sitemap>
</sitemapindex>`
}
