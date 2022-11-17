import React, { useEffect } from "react"
import ReactHtmlParser from "react-html-parser"
import { formatDate } from "../../utils/strutils"
import { SendPlausibleEvent, SendTrackEvent } from "../../utils/plausible"
import { DisplayContext } from "../../context/DisplayContextProvider"

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
    <div className="c-detail-body mt-4">
      <h2 className="c-locationdetail-title mt-2">Description de l&apos;offre</h2>
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
      {description ? (
        <div className="c-detail-description">
          <div className="c-detail-description-text">{ReactHtmlParser(md.render(description))}</div>
        </div>
      ) : (
        ""
      )}
    </div>
  )
}

export default PeJobDetail
