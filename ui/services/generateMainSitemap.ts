import path from "path"

import type { SitemapUrlEntry } from "shared/utils/sitemapUtils"
import { generateSitemapFromUrlEntries } from "shared/utils/sitemapUtils"

import { metierData } from "@/app/(editorial)/alternance/_components/metier_data"
import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { getStaticMetiers } from "@/utils/getStaticData"
import { getHostFromHeader } from "@/utils/requestUtils"

export const mainSitemapLastModificationDate = new Date()

export function generateMainSitemap(request: Request) {
  const txtDirectory = path.join(process.cwd(), "config")
  const dataJobs = getStaticMetiers(txtDirectory)

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
  const villePaths = villeData.map((ville) => `/alternance/ville/${ville.slug}`)
  const metierPaths = metierData.map((metier) => `/alternance/metier/${metier.slug}`)
  const jobPaths = dataJobs.map((job) => `/metiers/${job.slug}`)

  const sitemapEntries: SitemapUrlEntry[] = [
    { loc: host, priority: 1 },
    ...paths.map((path) => ({ loc: host + path, priority: 0.9 })),
    ...villePaths.map((path) => ({ loc: host + path, priority: 0.95 })),
    ...metierPaths.map((path) => ({ loc: host + path, priority: 0.95 })),
    ...jobPaths.map((path) => ({ loc: host + path, priority: 0.8 })),
  ]

  return generateSitemapFromUrlEntries(sitemapEntries)
}
