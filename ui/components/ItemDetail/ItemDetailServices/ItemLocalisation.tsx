import { Typography } from "@mui/material"
import { ILbaItemCompany, ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson } from "shared"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getPathLink } from "@/utils/tools"

import ItemDistanceToCenter from "./ItemDistanceToCenter"

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
