import ExternalLink from "../../../components/externalLink"
import React from "react"

import { Collapse } from "reactstrap"

const CandidatureSpontaneeExplanation = (props) => {
  // Collapse Open state
  const [isOpen, setIsOpen] = React.useState(false)

  const getTitle = () => {
    let res = ""
    if (props.about == "what") {
      res = "Qu'est ce qu'une candidature spontanée ?"
    } else if (props.about == "how") {
      res = "Comment se préparer pour une candidature spontanée ? "
    }
    return res
  }

  const getText = () => {
    let res = ""
    if (props.about == "what") {
      res = (
        <p>
          L&apos;entreprise n&apos;a pas déposé d&apos;offre d&apos;emploi, vous pouvez tout de même lui envoyer votre CV pour lui indiquer que vous seriez très intéressé⸱e pour
          intégrer son équipe dans le cadre de votre apprentissage.
        </p>
      )
    } else if (props.about == "how") {
      res = (
        <>
          <p className="c-detail-lbb-paragraph">Adaptez votre lettre de motivation à l&apos;entreprise aux informations recueillies : Activité, actualités et valeurs</p>
          <p className="c-detail-lbb-paragraph">
            Mettez en valeur vos qualités en lien avec le métier recherché et indiquez pourquoi vous souhaitez réaliser votre alternance dans cette entreprise en particulier.
            <br />
            <br />
            Besoin d&apos;aide pour concevoir votre CV ? Il existe plusieurs outils gratuits :
            <br />
            <br />
            <ul className="c-detail-lbb-minilist">
              <li>
                <ExternalLink
                  className="gtmCVLink gtmClicnjob c-nice-link"
                  url="https://cv.clicnjob.fr/"
                  title="https://cv.clicnjob.fr/"
                  withPic={<img src="../../images/icons/goto.svg" alt="Lien" />}
                />
              </li>
              <li>
                <ExternalLink
                  className="gtmCVLink gtmCvdesigner c-nice-link"
                  url="https://cvdesignr.com/fr"
                  title="https://cvdesignr.com/fr"
                  withPic={<img src="../../images/icons/goto.svg" alt="Lien" />}
                />
              </li>
              <li>
                <ExternalLink
                  className="gtmCVLink gtmCanva c-nice-link"
                  url="https://www.canva.com/fr_fr/creer/cv/"
                  title="https://www.canva.com/fr_fr/creer/cv/"
                  withPic={<img src="../../images/icons/goto.svg" alt="Lien" />}
                />
              </li>
            </ul>
          </p>
        </>
      )
    }
    return res
  }

  return (
    <>
      <div className="c-accordion">
        <button
          className="c-accordion-button"
          onClick={() => {
            setIsOpen(!isOpen)
          }}
        >
          <span className="c-accordion-button-title">{getTitle()}</span>
          <span className="c-accordion-button-plus">{isOpen ? "-" : "+"}</span>
        </button>
        <Collapse isOpen={isOpen} className="c-collapser">
          {getText()}
        </Collapse>
      </div>
    </>
  )
}

export default CandidatureSpontaneeExplanation
