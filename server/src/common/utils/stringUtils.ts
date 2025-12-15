import he from "he"
import sanitizeHtml from "sanitize-html"

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
