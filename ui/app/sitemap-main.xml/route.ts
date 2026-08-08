import { generateMainSitemap } from "@/services/generate-main-sitemap"

export async function GET(request: Request) {
  const sitemap = generateMainSitemap(request)
  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
