import { Image, Text } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"

const tagProperties = {
  color: fr.colors.decisions.background.actionHigh.greenEmeraude.default,
  background: fr.colors.decisions.background.contrast.greenEmeraude.default,
}

const TagCfaDEntreprise = () => {
  return (
    <Text as="span" variant="tag" {...tagProperties}>
      <Image width="16px" mb="-2px" src="/images/smiley.svg" alt="" />
      <Text whiteSpace="nowrap" as="span" ml={1}>
        CFA D&apos;ENTREPRISE
      </Text>
    </Text>
  )
}

export default TagCfaDEntreprise
