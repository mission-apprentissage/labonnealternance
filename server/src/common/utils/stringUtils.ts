import he from "he"
import sanitizeHtml from "sanitize-html"
import { stringNormaliser } from "shared"

export const sanitizeTextField = (text: string | null | undefined, keepFormat: boolean = false) => {
  if (!text) return ""
  const sanitizeOptions = {
    allowedTags: keepFormat ? ["b", "i", "em", "strong", "p", "br", "ul", "li"] : [],
    allowedAttributes: {},
  }
  // Decode HTML entities once, then sanitize to remove dangerous content
  const decodedText = he.decode(text).trim()
  return sanitizeHtml(decodedText, sanitizeOptions)
}

export const isNormalizedStringInSetOrArray = (str: string | null | undefined, normalizedSet: Set<string>, normalizedArray: string[]) => {
  if (!str) return false

  const normalizedStr = stringNormaliser(str)

  if (normalizedSet.has(normalizedStr)) return true

  const normalizedSentence = ` ${normalizedStr} `
  return normalizedArray.some((normalizedElement) => normalizedSentence.includes(` ${normalizedElement} `))
}
