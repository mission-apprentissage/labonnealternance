import { ILbaItemFormation2, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "@/../shared"

export const getCompanyGoogleSearchLink = (item: ILbaItemLbaJob | ILbaItemLbaCompany | ILbaItemFtJob | ILbaItemFormation2) => {
  return `https://www.google.fr/search?q=${encodeURIComponent(`${item.company.name} ${item?.company?.mandataire ? item.company.place.address : item.place.city ? `${item.place.city} ${item.place.zipCode}` : item.place.address}`)}`
}
