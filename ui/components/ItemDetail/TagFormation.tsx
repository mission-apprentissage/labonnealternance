import { Image, Text } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"

const tagProperties = {
  color: fr.colors.decisions.background.actionHigh.greenEmeraude.default,
  background: fr.colors.decisions.background.contrast.greenEmeraude.default,
}

const TagFormation = () => {
  return (
    <Text as="span" variant="tag" {...tagProperties}>
      <Image width="16px" mb="-2px" src="/images/icons/book.svg" alt="" />
      <Text whiteSpace="nowrap" as="span" ml={1}>
        FORMATION
      </Text>
    </Text>
  )
}

export default TagFormation
