import { getMainSitemapPageGroups } from "@/services/generateMainSitemap"
import { getHostFromHeader } from "@/utils/requestUtils"

/**
 * Génère le contenu du fichier /llms.txt (standard llmstxt.org) : un index Markdown destiné aux LLMs.
 *
 * Il partage exactement la même source de pages que le sitemap principal (getMainSitemapPageGroups) :
 * toute page ajoutée au sitemap apparaît donc automatiquement ici. Les offres d'emploi, dynamiques et
 * volatiles, sont volontairement exclues (cf. /sitemap-offers.xml) pour éviter les liens morts.
 */
export function generateLlmsTxt(request: Request) {
  const host = getHostFromHeader(request)
  const groups = getMainSitemapPageGroups()

  const renderSection = (title: string, pages: { path: string; label: string; description: string }[]) =>
    [`## ${title}`, "", ...pages.map((page) => `- [${page.label}](${host}${page.path}): ${page.description}`)].join("\n")

  const mainSections = groups.filter((group) => !group.optional).map((group) => renderSection(group.title, group.pages))
  const optionalPages = groups.filter((group) => group.optional).flatMap((group) => group.pages)

  const blocks = [
    "# La bonne alternance",
    "",
    "> La bonne alternance est le service public gratuit, opéré par l'État (mission interministérielle pour l'apprentissage, beta.gouv.fr), qui aide les jeunes à trouver une formation en alternance et un employeur (contrat d'apprentissage ou de professionnalisation) et accompagne les entreprises et les CFA dans le recrutement d'alternants.",
    "",
    "La bonne alternance met en relation les candidats à l'alternance, les centres de formation (CFA) et les entreprises, partout en France. Le site permet de rechercher des formations en alternance, des offres d'emploi en alternance et des entreprises susceptibles de recruter.",
    "",
    `- Site officiel : ${host}`,
    "- Service public gratuit, sans publicité.",
    "- Les offres d'emploi en alternance, nombreuses et changeantes, ne sont pas listées dans ce fichier : elles sont accessibles via le moteur de recherche du site et le sitemap dédié (/sitemap-offers.xml).",
    "",
    ...mainSections.flatMap((section) => [section, ""]),
  ]

  if (optionalPages.length > 0) {
    blocks.push(renderSection("Optional", optionalPages), "")
  }

  return `${blocks.join("\n").trimEnd()}\n`
}
