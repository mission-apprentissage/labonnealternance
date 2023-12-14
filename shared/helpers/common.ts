export const getSirenFromSiret = (siret: string) => siret.substring(0, 9)

export const cleanEmail = (email: string) => {
  let cleanedEmail = email.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  cleanedEmail = cleanedEmail.replace(new RegExp(`[’£'^!&=/*?{}\\s]`, "gi"), "")
  cleanedEmail = cleanedEmail.replace(new RegExp("œ", "gi"), "o")
  return cleanedEmail
}

const httpLinkRegex = /\b(https?:\/\/[^\s]+\b)/g
const wwwLinkRegex = /\bwww\.[^\s]+\b/g
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
const ftpLinkRegex = /\bftp:\/\/[^\s]+\b/g
const mailtoRegex = /\bmailto:([^\s<>]+)\b/g

export const removeUrlsFromText = (text: string | null | undefined) => {
  if (!text) return text
  const cleanedText = text.replace(httpLinkRegex, "").replace(wwwLinkRegex, "").replace(mailtoRegex, "").replace(emailRegex, "").replace(ftpLinkRegex, "")
  return cleanedText
}

export const addBracketsToUrls = (text: string | null | undefined) => {
  if (!text) return text
  const textWithSanitizedUrls = text
    .replace(httpLinkRegex, "[$&]")
    .replace(wwwLinkRegex, "[$&]")
    .replace(mailtoRegex, "[$&]")
    .replace(emailRegex, "[$&]")
    .replace(ftpLinkRegex, "[$&]")

  return textWithSanitizedUrls
}
