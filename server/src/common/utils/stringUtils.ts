import he from "he"
import sanitizeHtml from "sanitize-html"
import { removeAccents } from "shared"

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

export const stringNormaliser = (str: string): string => {
  return removeAccents(str.toLowerCase())
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export const isNormalizedStringInSetOrArray = (str: string | null | undefined, set: Set<string>, tableau: string[]) => {
  if (!str) return false

  const nomNormalise = stringNormaliser(str)

  if (set.has(nomNormalise)) return true

  const normalizedSentence = ` ${nomNormalise} `
  return tableau.some((value) => normalizedSentence.includes(` ${stringNormaliser(value)} `))
}
