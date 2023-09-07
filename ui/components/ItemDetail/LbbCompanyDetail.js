import { Box } from "@chakra-ui/react"
import React, { useEffect } from "react"

import { DisplayContext } from "../../context/DisplayContextProvider"
import { SendPlausibleEvent } from "../../utils/plausible"

import CandidatureSpontaneeExplanation from "./CandidatureSpontanee/CandidatureSpontaneeExplanation"

const LbbCompanyDetail = ({ lbb }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Algo", {
      info_fiche: `${lbb?.company?.siret}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
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
      <CandidatureSpontaneeExplanation about={"what"} />
      <CandidatureSpontaneeExplanation about={"how"} />
    </Box>
  )
}

export default LbbCompanyDetail
