import he from "he"
import sanitizeHtml from "sanitize-html"

export const sanitizeTextField = (text: string | null | undefined, keepFormat: boolean = false) => {
  if (!text) return ""
  const sanitizeOptions = {
    allowedTags: keepFormat ? ["b", "i", "em", "strong", "p", "br", "ul", "li"] : [],
    allowedAttributes: {},
  }
  // On décode 2 fois pour gérer les cas où le texte est encodé 2 fois (voir dernier test server/src/common/utils/stringUtils.test.ts)
  const decodedText = he.decode(he.decode(text)).trim()
  return sanitizeHtml(decodedText, sanitizeOptions)
}
