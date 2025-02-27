import sanitizeHtml from "sanitize-html"

export const removeHtmlTagsFromString = (text: string | null | undefined, keepBr?: boolean) => {
  if (!text) return ""
  const sanitizeOptions = keepBr ? { allowedTags: ["br"], allowedAttributes: {} } : { allowedTags: [], allowedAttributes: {} }
  text = sanitizeHtml(text, sanitizeOptions)
  return text
}

export const formatHtmlForPartnerDescription = (text: string) => {
  let sanitizedText = text
    .replace("&amp;", "&")
    .replace("<li>", "- ")
    .replace("</li>", "\r\n")
    .replace("<p>", "")
    .replace("</p>", "\r\n\r\n")
    .replace("<br>", "\r\n")
    .replace("<br/>", "\r\n")
    .replace("<br />", "\r\n")
  sanitizedText = removeHtmlTagsFromString(sanitizedText) as string
  return sanitizedText
}
