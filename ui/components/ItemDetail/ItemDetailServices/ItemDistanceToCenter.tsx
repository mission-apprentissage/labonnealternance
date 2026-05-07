import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import { useContext } from "react"
import type { ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { DisplayContext } from "@/context/DisplayContextProvider"

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)) * 10) / 10
}

export default function ItemDistanceToCenter({
  item,
}: {
  item: ILbaItemFormation2Json | ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemFtJobJson | ILbaItemPartnerJobJson
}) {
  const { formValues } = useContext(DisplayContext)

  if (!formValues?.location?.value) return null

  const distance = (() => {
    if ((item?.place?.distance ?? -1) >= 0) return item.place!.distance!
    const coords: [number, number] | undefined = formValues.location.value.coordinates
    const lat = item?.place?.latitude
    const lon = item?.place?.longitude
    if (coords && lat != null && lon != null) return haversineKm(coords[1], coords[0], lat, lon)
    return null
  })()

  return distance != null ? (
    <Typography component="span" sx={{ color: fr.colors.decisions.text.mention.grey.default, fontSize: "0.875rem" }}>
      {distance} km(s) du lieu de recherche
    </Typography>
  ) : null
}
