import { Image, Text } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"

const tagProperties = {
  color: fr.colors.decisions.background.actionHigh.blueCumulus.default,
  background: fr.colors.decisions.background.contrast.blueCumulus.default,
}

const TagCandidatureSpontanee = () => {
  return (
    <Text as="span" variant="tag" {...tagProperties}>
      <Image width="16px" mb="-2px" src="/images/briefcase.svg" alt="" />
      <Text whiteSpace="nowrap" as="span" ml={1}>
        CANDIDATURE SPONTANÉE
      </Text>
    </Text>
  )
}

export default TagCandidatureSpontanee
