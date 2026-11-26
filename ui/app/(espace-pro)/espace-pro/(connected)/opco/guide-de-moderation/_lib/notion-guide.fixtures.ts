import type { NotionBlock, NotionRichText } from "./notion-guide"

// Blocs synthétiques au format de l'API Notion : jamais le texte réel du guide (usage restreint).
let sequence = 0
const nextId = () => `bloc-${++sequence}`

export const text = (plain_text: string, options: { href?: string; bold?: boolean } = {}): NotionRichText => ({
  plain_text,
  href: options.href ?? null,
  annotations: { bold: options.bold ?? false, italic: false, strikethrough: false, underline: false, code: false },
})

export const block = (type: string, value: Record<string, unknown> = {}, children?: NotionBlock[]): NotionBlock => ({
  id: nextId(),
  type,
  has_children: Boolean(children?.length),
  ...(children ? { children } : {}),
  [type]: value,
})

export const paragraph = (...fragments: NotionRichText[]) => block("paragraph", { rich_text: fragments })
export const heading2 = (title: string) => block("heading_2", { rich_text: [text(title)] })

export const videoFile = (expiry_time = "2099-01-01T00:00:00.000Z") =>
  block("video", { type: "file", file: { url: `https://stockage.fictif/${nextId()}.mp4`, expiry_time }, caption: [text("Légende fictive")] })

export const sectionHeadings = (count: number) =>
  Array.from({ length: count }, (_, index) => [heading2(`${index + 1}. Section fictive ${index + 1}`), paragraph(text(`Texte fictif ${index + 1}`))]).flat()
