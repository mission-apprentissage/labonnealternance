import { Typography } from "@mui/material"
import type { ILbaItemCompany, ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson } from "shared"

import ItemDistanceToCenter from "./ItemDistanceToCenter"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getPathLink } from "@/utils/tools"


export default function ItemLocalisation({ item }: { item: ILbaItemFormation2Json | ILbaItemLbaCompanyJson | ILbaItemCompany | ILbaItemLbaJobJson | ILbaItemFtJobJson }) {
  return (
    <Typography sx={{ my: 2 }}>
      <Typography component="span" sx={{ fontWeight: 700 }}>
        Localisation :{" "}
      </Typography>
      <Typography component="span">
        <DsfrLink href={getPathLink(item)} aria-label="Localisation sur google maps - nouvelle fenêtre">
          {item?.place?.fullAddress}
        </DsfrLink>
      </Typography>
      <br />
      <ItemDistanceToCenter item={item} />
    </Typography>
  )
}
