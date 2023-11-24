export const getSirenFromSiret = (siret: string) => siret.substring(0, 9)

export const cleanEmail = (email: string) => {
  let cleanedEmail = email.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  cleanedEmail = cleanedEmail.replace(new RegExp(`[’£'^!&=/*?}]`, "gi"), "")
  cleanedEmail = cleanedEmail.replace("œ", "o")
  return cleanedEmail
}
