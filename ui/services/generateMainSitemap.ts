import path from "path"

import type { SitemapUrlEntry } from "shared/utils/sitemapUtils"
import { generateSitemapFromUrlEntries } from "shared/utils/sitemapUtils"

import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { getStaticMetiers } from "@/utils/getStaticData"
import { getHostFromHeader } from "@/utils/requestUtils"

// Attention ! Il faut mettre à jour cette date lorsque le sitemap généré par ce fichier change
export const mainSitemapLastModificationDate = new Date("2026-03-26T16:30:17.696Z")

export function generateMainSitemap(request: Request) {
  const txtDirectory = path.join(process.cwd(), "config")
  const dataJobs = getStaticMetiers(txtDirectory)

  const host = getHostFromHeader(request)

  const paths = [
    `/a-propos`,
    `/contact`,
    `/developpeurs`,
    `/faq`,
    `/guide-alternant`,
    `/guide-recruteur`,
    `/guide-cfa`,
    `/metiers`,
    `/mentions-legales`,
    `/cgu`,
    `/politique-de-confidentialite`,
  ]
  const villePaths = villeData.map((ville) => `/alternance/ville/${ville.slug}`)
  const jobPaths = dataJobs.map((job) => `/metiers/${job.slug}`)

  const sitemapEntries: SitemapUrlEntry[] = [
    { loc: host, priority: 1 },
    ...paths.map((path) => ({ loc: host + path, priority: 0.9 })),
    ...villePaths.map((path) => ({ loc: host + path, priority: 0.95 })),
    ...jobPaths.map((path) => ({ loc: host + path, priority: 0.8 })),
  ]

  return generateSitemapFromUrlEntries(sitemapEntries)
}
