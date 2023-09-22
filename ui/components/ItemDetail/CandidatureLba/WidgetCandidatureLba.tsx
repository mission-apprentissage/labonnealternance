import { Box, Container } from "@chakra-ui/react"
import { useFormik } from "formik"
import React, { useEffect, useState } from "react"

import { getItemId } from "../../../utils/getItemId"
import { string_wrapper as with_str } from "../../../utils/wrapper_utils"

import CandidatureLbaFailed from "./CandidatureLbaFailed"
import CandidatureLbaModalBody from "./CandidatureLbaModalBody"
import CandidatureLbaWorked from "./CandidatureLbaWorked"
import { getInitialSchemaValues, getValidationSchema } from "./services/getSchema"
import hasAlreadySubmittedCandidature from "./services/hasAlreadySubmittedCandidature"
import submitCandidature from "./services/submitCandidature"
import useLocalStorage from "./services/useLocalStorage"

const WidgetCandidatureLba = ({ item, caller, fakeLocalStorage = null }) => {
  const [sendingState, setSendingState] = useState("not_sent")
  const kind = item?.ideaType || ""

  const uniqId = `candidaturespontanee-${kind}-${getItemId(item)}`

  const actualLocalStorage = fakeLocalStorage || window.localStorage || {}

  const [applied, setApplied] = useLocalStorage(uniqId, null, actualLocalStorage)

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
    if (item) {
      const currentUniqId = actualLocalStorage.getItem(uniqId)
      if (currentUniqId) {
        setApplied(currentUniqId)
      } else {
        // setApplied(null) is MANDATORY to avoid "already-applied message" when user swaps.
        setApplied(null)
      }
    }
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [item])

  const formik = useFormik({
    initialValues: getInitialSchemaValues(),
    validationSchema: getValidationSchema(),
    onSubmit: async (applicantValues) => {
      const success = await submitCandidature({
        applicantValues,
        // @ts-expect-error: TODO
        setSendingState,
        item,
        caller,
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
            <CandidatureLbaModalBody formik={formik} sendingState={sendingState} company={item?.company?.name} item={item} kind={kind} fromWidget={true} />
          )}

          {with_str(sendingState).amongst(["ok_sent"]) && <CandidatureLbaWorked email={formik.values.email} company={item?.company?.name} />}

          {!with_str(sendingState).amongst(["not_sent", "ok_sent", "currently_sending"]) && <CandidatureLbaFailed sendingState={sendingState} />}
        </form>
      )}
    </Box>
  )
}

export default WidgetCandidatureLba
