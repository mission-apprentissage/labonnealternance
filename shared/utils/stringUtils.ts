export const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
export const removeRegexChars = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "")
