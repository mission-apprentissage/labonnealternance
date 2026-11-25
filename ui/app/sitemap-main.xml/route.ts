import { fetchSecteursIndexables } from "@/services/fetch-secteurs-indexables"
import { generateMainSitemap } from "@/services/generate-main-sitemap"

export async function GET(request: Request) {
  const sitemap = generateMainSitemap(request, { secteursIndexables: await fetchSecteursIndexables() })
  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
