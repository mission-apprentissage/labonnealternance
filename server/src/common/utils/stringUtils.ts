import he from "he"
import sanitizeHtml from "sanitize-html"

export const removeHtmlTagsFromString = (text: string | null | undefined, keepBr: boolean = false): string => {
  if (!text) return ""

  const sanitizeOptions = {
    allowedTags: keepBr ? ["br"] : [],
    allowedAttributes: {},
  }

  return sanitizeHtml(text, sanitizeOptions)
}

export const decodeHtmlEntities = (text: string | null | undefined): string => {
  if (!text) return ""
  return he.decode(text)
}

export const sanitizeTextField = (text: string | null | undefined, keepBr: boolean = false): string => {
  const decoded = decodeHtmlEntities(text)
  return removeHtmlTagsFromString(decoded.trim(), keepBr)
}

export const formatHtmlForPartnerDescription = (text: string) => {
  let sanitizedText = text
    .replace(/&amp;/g, "&")
    .replace(/<li><p>|<li>/g, "- ")
    .replace(/<ul>|<\/li>|<p>|<\/p>|<br\s*\/?>/g, "\r\n")
    .replace(/(\r\n){3,}/g, "\r\n\r\n")
  sanitizedText = removeHtmlTagsFromString(sanitizedText) as string
  return sanitizedText
}
