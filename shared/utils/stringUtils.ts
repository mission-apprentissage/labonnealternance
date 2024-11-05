export const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
export const removeRegexChars = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "")
export const joinNonNullStrings = (values: (string | null | undefined)[]): string | null => {
  const result = values
    .filter((item) => item !== null && item !== undefined && item.trim() !== "")
    .map((item) => item!.trim() + " ")
    .join("")
    .trim()

  return result || null
}
