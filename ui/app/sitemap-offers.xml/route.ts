import { publicConfig } from "@/config.public"

// disable next cache. Cache is handled in the API
export const dynamic = "force-dynamic"

export async function GET(_request: Request) {
  const response = await fetch(`${publicConfig.apiEndpoint}/sitemap-offers.xml`, {
    cache: "no-cache",
  })
  const xml = await response.text()
  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "text/xml",
      "last-modified": response.headers.get("last-modified"),
    },
  })
}
