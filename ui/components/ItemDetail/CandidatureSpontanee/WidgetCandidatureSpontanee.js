import React, { useState, useEffect } from "react"
import { useFormik } from "formik"
import { Container } from "reactstrap"
import CandidatureSpontaneeNominalBodyFooter from "./CandidatureSpontaneeNominalBodyFooter"
import CandidatureSpontaneeWorked from "./CandidatureSpontaneeWorked"
import CandidatureSpontaneeFailed from "./CandidatureSpontaneeFailed"
import submitCandidature from "./services/submitCandidature"
import { getValidationSchema, getInitialSchemaValues } from "./services/getSchema"
import { string_wrapper as with_str } from "../../../utils/wrapper_utils"
import useLocalStorage from "./services/useLocalStorage"
import hasAlreadySubmittedCandidature from "./services/hasAlreadySubmittedCandidature"
import { getItemId } from "../../../utils/getItemId"

const WidgetCandidatureSpontanee = (props) => {
  const [sendingState, setSendingState] = useState("not_sent")
  const kind = props?.item?.ideaType || ""

  const uniqId = (kind, item) => {
    return `candidaturespontanee-${kind}-${getItemId(item)}`
  }

  const actualLocalStorage = props.fakeLocalStorage || window.localStorage || {}

  const [applied, setApplied] = useLocalStorage(uniqId(kind, props.item), null, actualLocalStorage)

  const getAPostuleMessage = () => {
    return `
    Vous avez déjà postulé ${kind === "matcha" ? "à cette offre" : "auprès de cette entreprise"} le ${new Date(parseInt(applied, 10)).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`
  }

  useEffect(() => {
    // HACK HERE : reapply setApplied to currentUniqId to re-detect
    // if user already applied each time the user swap to another item.
    if (props.item) {
      let currentUniqId = actualLocalStorage.getItem(uniqId(kind, props.item))
      if (currentUniqId) {
        setApplied(currentUniqId)
      } else {
        // setApplied(null) is MANDATORY to avoid "already-applied message" when user swaps.
        setApplied(null)
      }
    }
  }, [props?.item])

  const formik = useFormik({
    initialValues: getInitialSchemaValues(),
    validationSchema: getValidationSchema(kind),
    onSubmit: async (applicantValues) => {
      let success = await submitCandidature({
        applicantValues,
        setSendingState,
        item: props.item,
        caller: props.caller,
      })
      if (success) {
        setApplied(Date.now().toString())
      }
    },
  })

  return (
    <div className="c-candidature c-candidature__widget" data-testid="CandidatureSpontanee">
      <div>
        <div className="my-3">
          {!with_str(sendingState).amongst(["ok_sent"]) && hasAlreadySubmittedCandidature({ applied }) ? (
            <>
              <Container>{getAPostuleMessage()}</Container>
            </>
          ) : (
            <form onSubmit={formik.handleSubmit} className="c-candidature-form">
              {with_str(sendingState).amongst(["not_sent", "currently_sending"]) ? (
                <CandidatureSpontaneeNominalBodyFooter
                  formik={formik}
                  sendingState={sendingState}
                  company={props?.item?.company?.name}
                  item={props?.item}
                  kind={kind}
                  fromWidget={true}
                />
              ) : (
                <></>
              )}

              {with_str(sendingState).amongst(["ok_sent"]) ? <CandidatureSpontaneeWorked kind={kind} email={formik.values.email} company={props?.item?.company?.name} /> : <></>}

              {with_str(sendingState).amongst(["not_sent_because_of_errors", "email temporaire non autorisé", "max candidatures atteint", "Too Many Requests"]) ? (
                <CandidatureSpontaneeFailed sendingState={sendingState} />
              ) : (
                <></>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default WidgetCandidatureSpontanee
