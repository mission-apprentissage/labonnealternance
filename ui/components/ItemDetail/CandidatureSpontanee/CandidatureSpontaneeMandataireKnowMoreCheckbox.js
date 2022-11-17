import React from "react"

/**
 * TODO: plus utilisé pour le moment. 16/06/2022
 */
const CandidatureSpontaneeMandataireKnowMoreCheckbox = ({ formik, item }) => {
  return item?.company?.mandataire ? (
    <fieldset data-testid="fieldset-interetOffresMandataire" className="c-candidature-terms c-candidature-terms--knowmore mt-3">
      <label htmlFor="interetOffresMandataire" className="c-candidature-terms-text">
        <input
          id="interetOffresMandataire"
          name="interetOffresMandataire"
          type="checkbox"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.interetOffresMandataire}
        />
        <div>Je souhaite en savoir plus sur les opportunités de formations de cet établissement.</div>
      </label>
    </fieldset>
  ) : (
    ""
  )
}

export default CandidatureSpontaneeMandataireKnowMoreCheckbox
