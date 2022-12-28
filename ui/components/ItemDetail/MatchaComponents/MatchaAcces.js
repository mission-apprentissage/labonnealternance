import React from "react"

import { Collapse } from "reactstrap"

const MatchaAcces = ({ job }) => {
  // Collapse Open state
  const [isOpen, setIsOpen] = React.useState(false)

  const acces = job?.job?.romeDetails?.acces ?? null

  if (!acces) return ""

  const accesFormatted = acces.split("\\n").join("<br><br>")

  return (
    <div className="c-accordion">
      <button
        className="c-accordion-button"
        onClick={() => {
          setIsOpen(!isOpen)
        }}
      >
        <span className="c-accordion-button-title">À qui se metier est-il accessible ?</span>
        <span className="c-accordion-button-plus">{isOpen ? "-" : "+"}</span>
      </button>
      <Collapse isOpen={isOpen} className="c-collapser">
        {accesFormatted}
      </Collapse>
    </div>
  )
}

export default MatchaAcces
