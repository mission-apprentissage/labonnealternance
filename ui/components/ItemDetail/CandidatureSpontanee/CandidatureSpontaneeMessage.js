import React from "react"

const CandidatureSpontaneeMessage = ({ formik, kind }) => {
  const getClass = () => {
    let className = "mt-3 c-candidature-message"

    if (kind === "matcha") {
      className += " c-candidature-field "
      className += formik.touched.message ? `is-valid-${!formik.errors.message}` : "is-not-validated"
    }

    return className
  }

  const getFieldTitle = () => {
    return (
      <>
        Votre message au responsable du recrutement <span className="c-candidature-message-title-optional">(Facultatif)</span>
      </>
    )
  }

  const getFieldError = () => {
    let errorMsg = ""
    if (kind === "matcha") {
      if (formik.touched.message && formik.errors.message) {
        errorMsg = <div className="c-candidature-erreur visible">{formik.errors.message}</div>
      } else {
        errorMsg = <div className="c-candidature-erreur invisible">{"pas d'erreur"}</div>
      }
    }
    return errorMsg
  }

  return (
    <>
      <fieldset data-testid="fieldset-message" className={getClass()}>
        <h2 className="c-candidature-message-title mb-0">{getFieldTitle()}</h2>
        <div className="c-candidature-message-subtitle mb-2">
          Indiquez pourquoi vous souhaitez réaliser votre alternance dans son établissement. <br />
          Un message personnalisé augmente vos chances d&apos;obtenir un contact avec le recruteur. <br />
          La taille du champ n&apos;est pas limitée.
        </div>
        <textarea id="message" data-testid="message" name="message" onBlur={formik.handleBlur} onChange={formik.handleChange} value={formik.values.message} />
      </fieldset>
      {getFieldError()}
    </>
  )
}

export default CandidatureSpontaneeMessage
