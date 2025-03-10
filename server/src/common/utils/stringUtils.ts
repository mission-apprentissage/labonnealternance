import sanitizeHtml from "sanitize-html"

export const removeHtmlTagsFromString = (text: string | null | undefined, keepBr?: boolean) => {
  if (!text) return ""
  const sanitizeOptions = keepBr ? { allowedTags: ["br"], allowedAttributes: {} } : { allowedTags: [], allowedAttributes: {} }
  text = sanitizeHtml(text, sanitizeOptions)
  return text
}
