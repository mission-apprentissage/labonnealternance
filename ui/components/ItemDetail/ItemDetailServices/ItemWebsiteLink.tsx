import { ILbaItemFormation2, ILbaItemFtJob, ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "@/../shared"
import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Flex, Image, Link, Text } from "@chakra-ui/react"

export default function ItemWebsiteLink({ item }: { item: ILbaItemFormation2 | ILbaItemLbaCompany | ILbaItemLbaJob | ILbaItemFtJob | ILbaItemPartnerJob }) {
  return "url" in item.company && item?.company?.url ? (
    <Flex alignItems="center" mt={4}>
      <Image mr={2} alt="" aria-hidden={true} src="/images/icons/world.svg" width="24px" height="24px" />
      <Text as="span">
        Le site internet de l'entreprise{" "}
        <Link ml="2px" isExternal variant="basicUnderlined" href={item?.company?.url} aria-label="Recherche de l'entreprise sur google.fr - nouvelle fenêtre">
          {item?.company?.url} <ExternalLinkIcon mb="3px" ml="2px" />
        </Link>
      </Text>
    </Flex>
  ) : null
}
