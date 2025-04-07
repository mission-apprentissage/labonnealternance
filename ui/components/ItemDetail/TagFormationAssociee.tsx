import { Image, Text } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"

const tagProperties = {
  color: fr.colors.decisions.background.actionHigh.greenEmeraude.default,
  background: fr.colors.decisions.background.contrast.greenEmeraude.default,
}

const TagFormationAssociee = ({ isMandataire }) => {
  return (
    <>
      {isMandataire === true ? (
        <Text as="span" variant="tag" {...tagProperties}>
          <Image width="16px" mb="-2px" src="/images/book.svg" alt="" />
          <Text whiteSpace="nowrap" as="span" ml={1}>
            FORMATION ASSOCIÉE
          </Text>
        </Text>
      ) : (
        ""
      )}
    </>
  )
}

export default TagFormationAssociee
