import { Image, Text } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"

const tagProperties = {
  color: fr.colors.decisions.background.actionHigh.blueCumulus.default,
  background: fr.colors.decisions.background.contrast.blueCumulus.default,
}

const TagOffreEmploi = () => {
  return (
    <Text as="span" variant="tag" {...tagProperties}>
      <Image width="16px" mb="-2px" src="/images/briefcase.svg" alt="" />
      <Text whiteSpace="nowrap" as="span" ml={1}>
        OFFRE D&apos;EMPLOI
      </Text>
    </Text>
  )
}

export default TagOffreEmploi
