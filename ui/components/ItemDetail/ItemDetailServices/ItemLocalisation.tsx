import { ILbaItemCompany, ILbaItemFormation2, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "@/../shared"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Link, Text } from "@chakra-ui/react"

import { getPathLink } from "@/utils/tools"

import ItemDistanceToCenter from "./ItemDistanceToCenter"

export default function ItemLocalisation({ item }: { item: ILbaItemFormation2 | ILbaItemLbaCompany | ILbaItemCompany | ILbaItemLbaJob | ILbaItemFtJob }) {
  return (
    <Text>
      <Text as="span" fontWeight={700}>
        Localisation :{" "}
      </Text>
      <Text as="span">{item?.place?.fullAddress}</Text>
      <Link ml={4} isExternal variant="basicUnderlined" href={getPathLink(item)} aria-label="Localisation sur google maps - nouvelle fenêtre">
        Obtenir l'itinéraire <ExternalLinkIcon mb="3px" ml="2px" />
      </Link>
      <ItemDistanceToCenter item={item} />
    </Text>
  )
}
