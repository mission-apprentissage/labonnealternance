import { OPCO_GUIDE_SECTIONS, type OpcoGuideSectionId } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/opco-guide.utils"

// Sous-ensemble des objets de l'API Notion officielle (GET /v1/blocks/{id}/children) lu par le guide.
export type NotionRichText = {
  plain_text: string
  href: string | null
  annotations: { bold: boolean; italic: boolean; strikethrough: boolean; underline: boolean; code: boolean }
}

export type NotionBlock = {
  id: string
  type: string
  has_children: boolean
  children?: NotionBlock[]
  [blockType: string]: unknown
}

export type OpcoGuideSection = { id: OpcoGuideSectionId; title: NotionRichText[]; blocks: NotionBlock[] }

export type OpcoGuide = { intro: NotionBlock[]; sections: OpcoGuideSection[] }

export type OpcoGuideStructure = { status: "ok"; guide: OpcoGuide; unsupportedTypes: string[] } | { status: "invalid"; reason: string }

export const RENDERED_BLOCK_TYPES = new Set([
  "paragraph",
  "heading_3",
  "bulleted_list_item",
  "numbered_list_item",
  "callout",
  "toggle",
  "quote",
  "column_list",
  "column",
  "table",
  "table_row",
  "divider",
  "video",
])

// Blocs dont les enfants sont rendus : seuls ceux-là justifient un appel à l'API pour les lire.
export const CONTAINER_BLOCK_TYPES = new Set(["bulleted_list_item", "numbered_list_item", "callout", "toggle", "quote", "column_list", "column", "table"])

// Le sommaire du site remplace celui de Notion.
const IGNORED_BLOCK_TYPES = new Set(["table_of_contents"])

export type NotionFileValue = { type?: string; file?: { url: string; expiry_time: string }; caption?: NotionRichText[] }

export const getBlockValue = (block: NotionBlock) =>
  (block[block.type] ?? {}) as { rich_text?: NotionRichText[]; color?: string; cells?: NotionRichText[][]; has_column_header?: boolean } & NotionFileValue

// Seul un fichier déposé dans Notion est servi par LBA (cf. fetchOpcoGuideVideoUrl) : un lien externe sortirait la vidéo de l'espace OPCO.
export const isPlayableVideo = (block: NotionBlock) => block.type === "video" && getBlockValue(block).type === "file"

export const toPlainText = (richText: NotionRichText[] = []) => richText.map(({ plain_text }) => plain_text).join("")

const HEADING_NUMBER = /^\s*(\d+)\s*\./

const collectUnsupportedTypes = (blocks: NotionBlock[], found: Set<string>) => {
  for (const block of blocks) {
    if (block.type === "video" && !isPlayableVideo(block)) found.add(`video:${getBlockValue(block).type ?? "inconnu"}`)
    else if (!RENDERED_BLOCK_TYPES.has(block.type) && !IGNORED_BLOCK_TYPES.has(block.type)) found.add(block.type)
    if (block.children) collectUnsupportedTypes(block.children, found)
  }
}

/**
 * Découpe la page Notion en sections du guide. Les ancres (#guide-comptes…) sont liées depuis d'autres pages :
 * les titres H2 doivent être numérotés 1, 2, 3… dans l'ordre de OPCO_GUIDE_SECTIONS, sinon la page est refusée
 * plutôt que d'ancrer une section au mauvais endroit. Le premier séparateur de premier niveau clôt le guide :
 * la conclusion et le bouton d'appel à l'action sont rendus par le code (suivi Matomo).
 */
export function structureOpcoGuide(blocks: NotionBlock[]): OpcoGuideStructure {
  const intro: NotionBlock[] = []
  const sections: OpcoGuideSection[] = []

  for (const block of blocks) {
    if (block.type === "divider" && sections.length > 0) break
    if (IGNORED_BLOCK_TYPES.has(block.type)) continue

    if (block.type === "heading_2") {
      const title = getBlockValue(block).rich_text ?? []
      const number = HEADING_NUMBER.exec(toPlainText(title))?.[1]
      const expected = OPCO_GUIDE_SECTIONS[sections.length]
      if (!expected || Number(number) !== sections.length + 1) {
        return { status: "invalid", reason: `titre H2 inattendu en position ${sections.length + 1}` }
      }
      sections.push({ id: expected.id, title, blocks: [] })
      continue
    }

    if (sections.length === 0) intro.push(block)
    else sections[sections.length - 1].blocks.push(block)
  }

  if (sections.length !== OPCO_GUIDE_SECTIONS.length) {
    return { status: "invalid", reason: `${sections.length} sections trouvées, ${OPCO_GUIDE_SECTIONS.length} attendues` }
  }

  const unsupported = new Set<string>()
  collectUnsupportedTypes([...intro, ...sections.flatMap((section) => section.blocks)], unsupported)
  return { status: "ok", guide: { intro, sections }, unsupportedTypes: [...unsupported].sort() }
}

const collectVideoIds = (blocks: NotionBlock[], ids: string[]): string[] => {
  for (const block of blocks) {
    if (isPlayableVideo(block)) ids.push(block.id)
    if (block.children) collectVideoIds(block.children, ids)
  }
  return ids
}

export const getOpcoGuideVideoIds = (guide: OpcoGuide) => collectVideoIds([...guide.intro, ...guide.sections.flatMap((section) => section.blocks)], [])

const LBA_MAIL_DOMAINS = ["labonnealternance.apprentissage.beta.gouv.fr", "beta.gouv.fr"]
const NOTION_HOSTS = /(^|\.)notion\.(so|site|com)$/

/**
 * Lien à rendre pour un fragment de texte, ou null pour du texte simple. Notion transforme toute adresse en
 * mailto (y compris les exemples masqués « emxxx@xxx.fr ») et ses liens internes pointent vers l'espace privé.
 */
export function getRenderableHref(href: string | null): string | null {
  if (!href) return null
  if (href.startsWith("mailto:")) {
    const domain = href.slice("mailto:".length).split("@")[1]?.toLowerCase()
    return domain && LBA_MAIL_DOMAINS.includes(domain) ? href : null
  }
  if (href.startsWith("/")) return null
  try {
    const url = new URL(href)
    if (url.protocol !== "https:" || NOTION_HOSTS.test(url.hostname)) return null
    return href
  } catch {
    return null
  }
}
