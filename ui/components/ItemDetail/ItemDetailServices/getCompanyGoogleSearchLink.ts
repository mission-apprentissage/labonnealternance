import { ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson } from "shared"

export const getCompanyGoogleSearchLink = (item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemFtJobJson | ILbaItemFormation2Json) => {
  let placePart = ""

  if (item?.company?.mandataire) {
    placePart = item.company.place.address
  } else {
    if (item.place.city) {
      placePart = `${item.place.city} ${item.place.zipCode ?? ""}`
    } else {
      placePart = item.place.address ?? item.place.fullAddress
    }
  }

  return `https://www.google.fr/search?q=${encodeURIComponent(`${item.company.name}${placePart ? " " + placePart.trim() : ""}`)}`
}
