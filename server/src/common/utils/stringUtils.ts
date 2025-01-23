import sanitizeHtml from "sanitize-html"

export const removeHtmlTagsFromString = (text: string | null | undefined, keepBr?: boolean) => {
  if (!text) return ""
  const sanitizeOptions = keepBr ? { allowedTags: ["br"] } : {}
  text = sanitizeHtml(text, sanitizeOptions)
  text = text!.replaceAll(/\./g, "\u200B.\u200B")
  return text
}
