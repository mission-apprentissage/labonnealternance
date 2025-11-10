import { Typography } from "@mui/material"
import { useContext } from "react"
import type { ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson } from "shared"

import { DisplayContext } from "@/context/DisplayContextProvider"

export default function ItemDistanceToCenter({ item }: { item: ILbaItemFormation2Json | ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemFtJobJson }) {
  const { formValues } = useContext(DisplayContext)

  return formValues?.location?.value && (item?.place?.distance ?? -1) >= 0 ? (
    <Typography component="span" sx={{ color: "grey.425", whiteSpace: "nowrap", fontSize: 14 }}>
      {item?.place?.distance} km(s) du lieu de recherche
    </Typography>
  ) : null
}
