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
    .replace(/<ul>|<\/li>|<p>|<\/p>|<br\s*\/?>/g, "\r\n")
    .replace(/<li>/g, "- ")
  sanitizedText = removeHtmlTagsFromString(sanitizedText) as string
  return sanitizedText
}
