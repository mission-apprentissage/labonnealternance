import { Box, Container } from "@chakra-ui/react"
import { useFormik } from "formik"
import React, { useEffect, useState } from "react"

import { getItemId } from "../../../utils/getItemId"
import { string_wrapper as with_str } from "../../../utils/wrapper_utils"

import CandidatureSpontaneeFailed from "./CandidatureSpontaneeFailed"
import CandidatureSpontaneeNominalBodyFooter from "./CandidatureSpontaneeNominalBodyFooter"
import CandidatureSpontaneeWorked from "./CandidatureSpontaneeWorked"
import { getInitialSchemaValues, getValidationSchema } from "./services/getSchema"
import hasAlreadySubmittedCandidature from "./services/hasAlreadySubmittedCandidature"
import submitCandidature from "./services/submitCandidature"
import useLocalStorage from "./services/useLocalStorage"

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
    <Box my={4} width="100%" data-testid="CandidatureSpontanee">
      {!with_str(sendingState).amongst(["ok_sent"]) && hasAlreadySubmittedCandidature({ applied }) ? (
        <Container maxW="2xl">{getAPostuleMessage()}</Container>
      ) : (
        <form onSubmit={formik.handleSubmit}>
          {with_str(sendingState).amongst(["not_sent", "currently_sending"]) && (
            <CandidatureSpontaneeNominalBodyFooter
              formik={formik}
              sendingState={sendingState}
              company={props?.item?.company?.name}
              item={props?.item}
              kind={kind}
              fromWidget={true}
            />
          )}

          {with_str(sendingState).amongst(["ok_sent"]) && <CandidatureSpontaneeWorked kind={kind} email={formik.values.email} company={props?.item?.company?.name} />}

          {!with_str(sendingState).amongst(["not_sent", "ok_sent", "currently_sending"]) && <CandidatureSpontaneeFailed sendingState={sendingState} />}
        </form>
      )}
    </Box>
  )
}

export default WidgetCandidatureSpontanee
