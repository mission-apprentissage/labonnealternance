import { Text } from "@chakra-ui/react"
import { ILbaItemCompany, ILbaItemFormation2Json, ILbaItemFtJobJson, ILbaItemLbaCompanyJson, ILbaItemLbaJobJson } from "shared"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { getPathLink } from "@/utils/tools"

import ItemDistanceToCenter from "./ItemDistanceToCenter"

export default function ItemLocalisation({ item }: { item: ILbaItemFormation2Json | ILbaItemLbaCompanyJson | ILbaItemCompany | ILbaItemLbaJobJson | ILbaItemFtJobJson }) {
  return (
    <Text mt={1}>
      <Text as="span" fontWeight={700}>
        Localisation :{" "}
      </Text>
      <Text as="span">
        <DsfrLink href={getPathLink(item)} aria-label="Localisation sur google maps - nouvelle fenêtre">
          {item?.place?.fullAddress}
        </DsfrLink>
      </Text>
      <br />
      <ItemDistanceToCenter item={item} />
    </Text>
  )
}
