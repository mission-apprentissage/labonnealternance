import sanitizeHtml from "sanitize-html"

export const removeHtmlTagsFromString = (text: string | null | undefined, keepBr?: boolean) => {
  if (!text) return ""
  const sanitizeOptions = keepBr ? { allowedTags: ["br"], allowedAttributes: {} } : { allowedTags: [], allowedAttributes: {} }
  text = sanitizeHtml(text, sanitizeOptions)
  return text
}

export const formatHtmlForPartnerDescription = (text: string) => {
  let sanitizedText = text
    .replace(/&amp;/g, "&")
    .replace(/<ul>|<\/li>|<br\s*\/?>/g, "\r\n")
    .replace(/<li>/g, "- ")
    .replace(/<p>/g, "")
    .replace(/<\/p>/g, "\r\n\r\n")
  sanitizedText = removeHtmlTagsFromString(sanitizedText) as string
  return sanitizedText
}
