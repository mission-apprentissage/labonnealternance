import { ILbaItemFormation2, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob } from "@/../shared"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Flex, Image, Link, Text } from "@chakra-ui/react"

import { getCompanyGoogleSearchLink } from "./getCompanyGoogleSearchLink"

export default function ItemGoogleSearchLink({ item }: { item: ILbaItemFormation2 | ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemFtJob }) {
  return (
    <Flex alignItems="center" mt={4}>
      <Image mr={2} alt="" aria-hidden={true} src="/images/icons/magnifyingglass.svg" width="24px" height="24px" />
      <Text as="span">
        Lancer une recherche Google sur{" "}
        <Link ml="2px" isExternal variant="basicUnderlined" href={getCompanyGoogleSearchLink(item)} aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre">
          {item.company.name} <ExternalLinkIcon mb="3px" ml="2px" />
        </Link>
      </Text>
    </Flex>
  )
}
