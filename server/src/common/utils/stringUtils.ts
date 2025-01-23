export const removeHtmlTagsFromString = (text: string | null | undefined, keepBr?: boolean) => {
  if (!text) return ""
  if (keepBr) {
    text = text.replaceAll(/<(?!br\s*\/?)[^>]+>/gi, "")
  } else {
    text = text.replaceAll(/(<([^>]+)>)/gi, "")
  }
  text = text.replaceAll(/\./g, "\u200B.\u200B")
  return text
}
