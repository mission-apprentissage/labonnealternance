import { generateMainSitemap } from "@/services/generateMainSitemap"

export async function GET(request: Request) {
  const sitemap = generateMainSitemap(request)
  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  })
}
