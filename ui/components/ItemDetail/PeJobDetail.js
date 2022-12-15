import React, { useEffect } from "react"
import ReactHtmlParser from "react-html-parser"
import { formatDate } from "../../utils/strutils"
import { SendPlausibleEvent, SendTrackEvent } from "../../utils/plausible"
import { DisplayContext } from "../../context/DisplayContextProvider"
import { Box, Text } from "@chakra-ui/react"

let md = require("markdown-it")().disable(["link", "image"])

const PeJobDetail = ({ job }) => {
  useEffect(() => {
    // S'assurer que l'utilisateur voit bien le haut de la fiche au départ
    document.getElementsByClassName("choiceCol")[0].scrollTo(0, 0)
  }, []) // Utiliser le useEffect une seule fois : https://css-tricks.com/run-useeffect-only-once/

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche entreprise Offre PE", {
      info_fiche: `${job?.job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}`,
    })
    SendTrackEvent({
      event: `Résultats Affichage Offre PE - Consulter fiche entreprise`,
      itemId: job?.job?.id,
    })
  }, [job?.job?.id])

  const { formValues } = React.useContext(DisplayContext)

  const description = job?.job?.description
  const contractDuration = job?.job?.contractDescription
  const contractRythm = job?.job?.duration || "Non défini"
  const creationDate = formatDate(job?.job?.creationDate)

  return (
    <Box pb="0px" mt={6} position="relative" background="white" padding={["1px 12px 50px 12px", "1px 24px 50px 24px", "1px 12px 24px 12px"]} mx={["0", "30px"]}>
      <Text as="h2" variant="itemDetailH2" mt={2}>
        Description de l&apos;offre
      </Text>
      <div className="c-matcha-detail-container">
        <div>
          <strong>Publiée le : </strong> {creationDate}
        </div>
        <div className="my-2">
          <strong>Nature du contrat : </strong> Alternance
        </div>
        <div className="my-2">
          <strong>Durée :</strong> {contractDuration}
        </div>
        <div>
          <strong>Rythme :</strong> {contractRythm}
        </div>
      </div>
      {description && (
        <div className="c-detail-description">
          <Box whiteSpace="pre-wrap" pl={4}>
            {ReactHtmlParser(md.render(description))}
          </Box>
        </div>
      )}
    </Box>
  )
}

export default PeJobDetail
