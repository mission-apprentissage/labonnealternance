import React from "react"

import { Collapse } from "reactstrap"

const MatchaCompetences = ({ job }) => {
  // Collapse Open state
  const [isOpen, setIsOpen] = React.useState(false)

  const getText = () => {
    const res = (
      <ul>
        {job.job.romeDetails.competencesDeBase.map((competence) => (
          <li key={competence.code} className="mt-2">
            {competence.libelle}
          </li>
        ))}
      </ul>
    )

    return res
  }

  return job?.job?.romeDetails?.competencesDeBase?.length ? (
    <>
      <div className="c-accordion">
        <button
          className="c-accordion-button"
          onClick={() => {
            setIsOpen(!isOpen)
          }}
        >
          <span className="c-accordion-button-title">Quelles sont les compétences attendues ?</span>
          <span className="c-accordion-button-plus">{isOpen ? "-" : "+"}</span>
        </button>
        <Collapse isOpen={isOpen} className="c-collapser">
          {getText()}
        </Collapse>
      </div>
    </>
  ) : (
    ""
  )
}

export default MatchaCompetences
