const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"])

// Graisse héritée de l'ancêtre le plus proche qui en fixe une, par style inline, <b> ou <strong>. Les règles de <style> ne sont pas lues.
const fontWeightAt = (html: string, text: string): string => {
  // Première occurrence dans un nœud texte du corps : le même texte peut figurer dans <title> ou dans un aria-label.
  const bodyStart = Math.max(html.indexOf("<body"), 0)
  const match = new RegExp(`>[^<]*?${RegExp.escape(text)}`).exec(html.slice(bodyStart))
  if (!match) throw new Error(`Texte absent du corps : ${text}`)
  const index = bodyStart + match.index + match[0].length - text.length

  const openTags: { tag: string; weight: string | null }[] = []
  const before = html.slice(0, index).replace(/<!--[\s\S]*?-->/g, "")
  for (const [, closing, name, attributes] of before.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g)) {
    const tag = name.toLowerCase()
    if (VOID_TAGS.has(tag) || attributes.endsWith("/")) continue
    if (closing) {
      const opened = openTags.findLastIndex((openTag) => openTag.tag === tag)
      if (opened !== -1) openTags.length = opened
      continue
    }
    const inlineWeight = /\sstyle="[^"]*font-weight:\s*([\w-]+)/i.exec(attributes)?.[1] ?? null
    openTags.push({ tag, weight: inlineWeight ?? (tag === "b" || tag === "strong" ? "700" : null) })
  }
  return openTags.findLast(({ weight }) => weight !== null)?.weight ?? "400"
}

export const isInBold = (html: string, text: string) => {
  const weight = fontWeightAt(html, text)
  return weight === "bold" || weight === "bolder" || Number(weight) >= 600
}
