import { Box, ListItem, Text, UnorderedList } from "@chakra-ui/react"
import React, { useEffect } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SendPlausibleEvent } from "../../utils/plausible"

import CandidatureLbaExplanation from "./CandidatureLba/CandidatureLbaExplanation"
import { ReportJobLink } from "./ReportJobLink"

const LbbCompanyDetail = ({ lbb }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Algo", {
      info_fiche: `${lbb?.company?.siret}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [lbb?.company?.siret])

  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0]?.scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  const { formValues } = React.useContext(DisplayContext)

  return (
    <Box
      data-testid="lbb-component"
      pb="0px"
      mt={6}
      mb={8}
      position="relative"
      background="white"
      padding={["1px 12px 12px 12px", "1px 24px 12px 24px", "1px 12px 12px 12px"]}
      mx={["0", "30px"]}
    >
      <CandidatureLbaExplanation about={"what"} />
      <CandidatureLbaExplanation about={"how"} />
      <ReportJobLink
        width="490px"
        itemId={lbb?.company?.siret}
        type={LBA_ITEM_TYPE.RECRUTEURS_LBA}
        linkLabelNotReported="Signaler l’entreprise"
        linkLabelReported="Entreprise signalée"
        tooltip={
          <Box>
            <Text fontSize="16px" lineHeight="24px" fontWeight="700" marginBottom="8px" color="#161616">
              Cette entreprise vous semble peu recommandable ? Voici les raisons pour lesquelles vous pouvez nous signaler une entreprise :
            </Text>
            <UnorderedList
              style={{
                color: "#383838",
                fontSize: "16px",
                lineHeight: "24px",
              }}
            >
              <ListItem>Informations trompeuses ou fausses</ListItem>
              <ListItem>Non-respect des lois du travail </ListItem>
              <ListItem>Fraude ou arnaque</ListItem>
              <ListItem>Comportement inapproprié ou abusif </ListItem>
            </UnorderedList>
          </Box>
        }
      />
    </Box>
  )
}

export default LbbCompanyDetail
