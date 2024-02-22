export const getSirenFromSiret = (siret: string) => siret.substring(0, 9)

export const cleanEmail = (email: string) => {
  let cleanedEmail = email.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  cleanedEmail = cleanedEmail.replace(new RegExp(`[’£'^!&=/*?{}\\s]`, "gi"), "")
  cleanedEmail = cleanedEmail.replace(new RegExp("œ", "gi"), "o")
  return cleanedEmail
}

const linkRegexes = [/\b(https?:\/\/[^\s]+\b)/g, /\bwww\.[^\s]+\b/g, /\bmailto:([^\s<>]+)\b/g, /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, /\bftp:\/\/[^\s]+\b/g]

export const removeUrlsFromText = (text: string | null | undefined) => {
  if (!text) return ""
  return linkRegexes.reduce((processedText, regex) => processedText.replace(regex, ""), text)
}

export const prepareMessageForMail = (text: string | null | undefined) => {
  if (!text) return ""
  return text ? text.replaceAll(/\r\n|\r|\n/gi, "<br />") : text
}
