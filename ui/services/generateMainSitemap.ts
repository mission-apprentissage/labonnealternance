import fs from "fs"
import path from "path"

import { generateSitemapFromUrlEntries, SitemapUrlEntry } from "shared/utils/sitemapUtils"

import { getStaticMetiers } from "@/utils/getStaticData"
import { getHostFromHeader } from "@/utils/requestUtils"

// Attention ! Il faut mettre à jour cette date lorsque le sitemap généré par ce fichier change
export const mainSitemapLastModificationDate = new Date("2024-12-04T14:06:47.696Z")

export function generateMainSitemap(request: Request) {
  const txtDirectory = path.join(process.cwd(), "config")
  const dataJobs = getStaticMetiers(path, fs, txtDirectory)

  const host = getHostFromHeader(request)

  const paths = [
    `/a-propos`,
    `/acces-recruteur`,
    `/contact`,
    `/developpeurs`,
    `/faq`,
    `/ressources#recruteur`,
    `/ressources#candidat`,
    `/ressources#cfa`,
    `/metiers`,
    `/organisme-de-formation`,
    `/mentions-legales`,
    `/cgu`,
    `/politique-de-confidentialite`,
  ]
  const jobPaths = dataJobs.map((job) => `/metiers/${job.slug}`)

  const sitemapEntries: SitemapUrlEntry[] = [
    { loc: host, priority: 1 },
    ...paths.map((path) => ({ loc: host + path, priority: 0.9 })),
    ...jobPaths.map((path) => ({ loc: host + path, priority: 0.8 })),
  ]

  return generateSitemapFromUrlEntries(sitemapEntries)
}
