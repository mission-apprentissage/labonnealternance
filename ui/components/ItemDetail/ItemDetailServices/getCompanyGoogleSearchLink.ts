import { ILbaItemFormation2, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "@/../shared"

export const getCompanyGoogleSearchLink = (item: ILbaItemLbaJob | ILbaItemLbaCompany | ILbaItemFtJob | ILbaItemFormation2) => {
  let placePart = ""

  if (item?.company?.mandataire) {
    placePart = item.company.place.address
  } else {
    if (item.place.city) {
      placePart = `${item.place.city} ${item.place.zipCode ?? ""}`
    } else {
      placePart = item.place.address
    }
  }

  return `https://www.google.fr/search?q=${encodeURIComponent(`${item.company.name} ${placePart.trim()}`)}`
}
