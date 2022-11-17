import React from "react"
import { ModalBody, ModalFooter } from "reactstrap"
import paperplaneIcon from "../../../public/images/paperplane2.svg"
import { testingParameters } from "../../../utils/testingParameters"

const CandidatureSpontaneeWorked = ({ email, company, kind }) => {
  return (
    <div data-testid="CandidatureSpontaneeWorked">
      <ModalBody>
        <h1 className="c-candidature-title" data-testid="CandidatureSpontaneeWorkedTitle">
          {kind === "matcha" ? <>Postuler à l&apos;offre de {company}</> : <>Candidature spontanée</>}
        </h1>

        <div className="c-candidature-worked-header d-flex my-5">
          <div>
            <img src={paperplaneIcon} alt="" />
          </div>
          <div className="ml-3 pl-3">
            <h2 className="c-candidature-worked-title">
              Votre candidature a bien été envoyée à <span className="c-candidature-worked-company">{company}</span>
            </h2>
            {testingParameters?.simulatedRecipient ? <div>Les emails ont été envoyés à {testingParameters.simulatedRecipient}</div> : ""}
          </div>
        </div>
        <div className="c-candidature-worked-text">
          Un e-mail de confirmation vous a été envoyé sur votre boite e-mail <span className="c-candidature-worked-email">{email}</span>
        </div>
        <div className="c-candidature-worked-text mt-3 mb-5">
          Si vous n&apos;avez pas reçu d&apos;email de confirmation d&apos;ici 24 heures, soumettez à nouveau votre candidature
        </div>
      </ModalBody>
      <ModalFooter className="pb-5"></ModalFooter>
    </div>
  )
}

export default CandidatureSpontaneeWorked
