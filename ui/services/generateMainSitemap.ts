import path from "path"

import type { SitemapUrlEntry } from "shared/utils/sitemapUtils"
import { generateSitemapFromUrlEntries } from "shared/utils/sitemapUtils"

import { villeData } from "@/app/(editorial)/alternance/_components/ville_data"
import { getStaticMetiers } from "@/utils/getStaticData"
import { getHostFromHeader } from "@/utils/requestUtils"

// Attention ! Il faut mettre à jour cette date lorsque le sitemap généré par ce fichier change
export const mainSitemapLastModificationDate = new Date("2026-03-30T15:00:00.000Z")

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
    `/guide-alternant/preparer-son-projet-en-alternance`,
    `/guide-alternant/se-faire-accompagner`,
    `/guide-alternant/la-rupture-de-contrat`,
    `/guide-alternant/comprendre-la-remuneration`,
    `/guide-alternant/comment-signer-un-contrat-en-alternance`,
    `/guide-alternant/role-et-missions-du-maitre-d-apprentissage-ou-tuteur`,
    `/guide-alternant/a-propos-des-formations`,
    `/guide-alternant/conseils-et-astuces-pour-trouver-un-employeur`,
    `/guide-alternant/les-aides-financieres-et-materielles`,
    `/guide-recruteur`,
    `/guide-recruteur/je-suis-employeur-public`,
    `/guide-recruteur/cerfa-apprentissage-et-professionnalisation`,
    `/guide-cfa`,
    `/guide-cfa/la-carte-etudiant-des-metiers`,
    `/guide/decouvrir-l-alternance`,
    `/guide/apprentissage-et-handicap`,
    `/guide/prevention-des-risques-professionnels-pour-les-apprentis`,
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
