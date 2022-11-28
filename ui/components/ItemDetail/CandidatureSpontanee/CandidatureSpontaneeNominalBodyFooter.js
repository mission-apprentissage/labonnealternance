import React, { useState, useEffect } from "react"
import CandidatureSpontaneeSubmit from "./CandidatureSpontaneeSubmit"
import { Container, ModalBody, ModalFooter } from "reactstrap"
import CandidatureSpontaneeFileDropzone from "./CandidatureSpontaneeFileDropzone"
import CandidatureSpontaneeMessage from "./CandidatureSpontaneeMessage"
import CandidatureSpontaneeMandataireMessage from "./CandidatureSpontaneeMandataireMessage"
import { testingParameters } from "../../../utils/testingParameters"
import emailMisspelled, { top100 } from "email-misspelled"

const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

const PostulerBody = (props) => {
  return props.fromWidget ? <Container>{props.children}</Container> : <ModalBody data-testid="modalbody-nominal">{props.children}</ModalBody>
}

const PostulerFooter = (props) => {
  return props.fromWidget ? <Container>{props.children}</Container> : <ModalFooter>{props.children}</ModalFooter>
}

const CandidatureSpontaneeNominalBodyFooter = ({ formik, sendingState, company, item, kind, fromWidget = false }) => {
  /*useEffect(() => {
    formik.values.interetOffresMandataire = false;
  }, [company]);*/

  const setFileValue = (fileValue) => {
    formik.values.fileName = fileValue?.fileName || null
    formik.values.fileContent = fileValue?.fileContent || null
  }

  const [suggestedEmails, setSuggestedEmails] = useState([])

  const onEmailChange = (e) => {
    const checkedEmail = emailChecker(e.target.value)
    setSuggestedEmails(checkedEmail)
    formik.handleChange(e)
  }

  const clickSuggestion = (e) => {
    formik.setFieldValue("email", e.currentTarget.innerHTML)
    setSuggestedEmails([])
  }

  return (
    <>
      <PostulerBody fromWidget={fromWidget}>
        <h1 className="c-candidature-title" data-testid="CandidatureSpontaneeTitle">
          {kind === "matcha" ? (
            <>
              Postuler à l&apos;offre {fromWidget ? `${item.title} ` : ""}de {company}
            </>
          ) : (
            <>Candidature spontanée{fromWidget ? ` auprès de ${company}` : ""}</>
          )}
        </h1>

        <div className="c-candidature-personaldata d-flex flex-column flex-md-row mt-4">
          <fieldset
            data-testid="fieldset-lastname"
            className={`mr-0 mr-md-3 c-candidature-field ${formik.touched.lastName ? `is-valid-${!formik.errors.lastName}` : "is-not-validated"}`}
          >
            <label htmlFor="lastName">Nom *</label>
            <input id="lastName" data-testid="lastName" name="lastName" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.lastName} />
            {formik.touched.lastName && formik.errors.lastName ? (
              <div className="c-candidature-erreur visible">{formik.errors.lastName}</div>
            ) : (
              <div className="invisible">{"pas d'erreur"}</div>
            )}
          </fieldset>

          <fieldset
            data-testid="fieldset-firstname"
            className={`mt-1 mt-md-0 c-candidature-field ${formik.touched.firstName ? `is-valid-${!formik.errors.firstName}` : "is-not-validated"}`}
          >
            <label htmlFor="firstName">Prénom *</label>
            <input id="firstName" data-testid="firstName" name="firstName" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.firstName} />
            {formik.touched.firstName && formik.errors.firstName ? (
              <div className="c-candidature-erreur visible">{formik.errors.firstName}</div>
            ) : (
              <div className="invisible">{"pas d'erreur"}</div>
            )}
          </fieldset>
        </div>

        {testingParameters?.simulatedRecipient ? <div>Les emails seront envoyés à {testingParameters.simulatedRecipient}</div> : ""}

        <div className="d-flex flex-column flex-md-row mt-0 mt-md-3">
          <fieldset
            data-testid="fieldset-email"
            className={`mt-1 mt-md-0 mr-0 mr-md-3 c-candidature-field ${formik.touched.email ? `is-valid-${!formik.errors.email}` : "is-not-validated"}`}
          >
            <label htmlFor="email">E-mail *</label>
            <input id="email" data-testid="email" name="email" type="email" onChange={onEmailChange} onBlur={formik.handleBlur} value={formik.values.email} />
            {suggestedEmails.length > 0 ? (
              <div className="c-candidature-misspelled">
                <span className="c-candidature-misspelled__prompt">Voulez vous dire ?</span>
                {suggestedEmails.map((sE) => (
                  <button key={sE.corrected} onClick={clickSuggestion} className="c-candidature-misspelled__suggestion">
                    {sE.corrected}
                  </button>
                ))}
              </div>
            ) : (
              ""
            )}
            {formik.touched.email && formik.errors.email ? (
              <div className="c-candidature-erreur visible">{formik.errors.email}</div>
            ) : (
              <div className="c-candidature-erreur invisible">{"pas d'erreur"}</div>
            )}
          </fieldset>

          <fieldset data-testid="fieldset-phone" className={`mt-1 mt-md-0 c-candidature-field ${formik.touched.phone ? `is-valid-${!formik.errors.phone}` : "is-not-validated"}`}>
            <label htmlFor="email">Téléphone *</label>
            <input id="phone" data-testid="phone" name="phone" type="text" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.phone} />
            {formik.touched.phone && formik.errors.phone ? (
              <div className="c-candidature-erreur visible">{formik.errors.phone}</div>
            ) : (
              <div className="invisible">{"pas d'erreur"}</div>
            )}
          </fieldset>
        </div>

        <CandidatureSpontaneeMessage formik={formik} kind={kind} />

        <div className="c-candidature-message mt-3">
          <CandidatureSpontaneeFileDropzone formik={formik} setFileValue={setFileValue} />
        </div>

        <div className="c-candidature-message mt-3">
          <CandidatureSpontaneeMandataireMessage item={item} />
        </div>

        <fieldset data-testid="fieldset-terms" className="c-candidature-terms mt-3">
          <label htmlFor="terms" className="c-candidature-terms-text">
            <div>
              En remplissant ce formulaire, vous acceptez les{" "}
              <a href="/cgu" className="c-candidature-link" target="_blank">
                Conditions générales d&apos;utilisation.
              </a>{" "}
              du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement {company}
              <a href="https://media.giphy.com/media/3oz8xSD5WkRNG1R6x2/giphy.gif" className="c-candidature-link" target="_blank" rel="noreferrer">
                En savoir plus
              </a>
            </div>
          </label>
        </fieldset>
      </PostulerBody>
      <PostulerFooter fromWidget={fromWidget}>
        <CandidatureSpontaneeSubmit item={item} sendingState={sendingState} />
      </PostulerFooter>
    </>
  )
}

export default CandidatureSpontaneeNominalBodyFooter
