export const getDaysSinceDate = (fromDate: number | string | Date): number => {
  const date = new Date(fromDate)
  const today = new Date()
  const daysSince = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return daysSince > 0 ? daysSince : 0
}

export const getAgeAtDate = (birthDate: Date, atDate: Date = new Date()): number => {
  const birthYear = birthDate.getFullYear()
  const birthMonth = birthDate.getMonth()
  const birthDay = birthDate.getDate()

  const refYear = atDate.getFullYear()
  const refMonth = atDate.getMonth()
  const refDay = atDate.getDate()

  let age = refYear - birthYear

  // Ajustement si l'anniversaire n'est pas encore passé dans l'année de référence
  const birthdayNotYetPassed = refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)

  if (birthdayNotYetPassed) {
    age--
  }

  return age
}
