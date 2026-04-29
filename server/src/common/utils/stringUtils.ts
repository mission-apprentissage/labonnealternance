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

export const isNormalizedStringInSetOrArray = (array: string[]) => {
  const getFct = getNormalizedStringInSetOrArray(array)

  return (str: string | null | undefined): boolean => {
    return Boolean(getFct(str))
  }
}

export const getNormalizedStringInSetOrArray = (array: string[]) => {
  const normalizedArray = array.map(stringNormaliser)
  const normalizedSet = new Set(normalizedArray)

  return (str: string | null | undefined): string | undefined => {
    if (!str) return undefined

    const normalizedStr = stringNormaliser(str)

    if (normalizedSet.has(normalizedStr)) return normalizedStr

    const normalizedSentence = ` ${normalizedStr} `
    return normalizedArray.find((normalizedElement) => normalizedSentence.includes(` ${normalizedElement} `))
  }
}
