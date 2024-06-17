import { Box, Container } from "@chakra-ui/react"
import { useFormik } from "formik"
import { useEffect, useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { getItemId } from "../../../utils/getItemId"

import CandidatureLbaFailed from "./CandidatureLbaFailed"
import CandidatureLbaModalBody from "./CandidatureLbaModalBody"
import CandidatureLbaWorked from "./CandidatureLbaWorked"
import { getInitialSchemaValues, getValidationSchema } from "./services/getSchema"
import hasAlreadySubmittedCandidature from "./services/hasAlreadySubmittedCandidature"
import submitCandidature from "./services/submitCandidature"
import useLocalStorage from "./services/useLocalStorage"

const WidgetCandidatureLba = ({ item, caller, fakeLocalStorage = null }) => {
  const [sendingState, setSendingState] = useState("not_sent")
  const kind: LBA_ITEM_TYPE_OLD = item?.ideaType || ""

  const uniqId = `candidaturespontanee-${kind}-${getItemId(item)}`

  const actualLocalStorage = fakeLocalStorage || window.localStorage || {}

  const [applied, setApplied] = useLocalStorage(uniqId, null, actualLocalStorage)

  const getAPostuleMessage = () => {
    return `
    Vous avez déjà postulé ${kind === LBA_ITEM_TYPE_OLD.MATCHA ? "à cette offre" : "auprès de cette entreprise"} le ${new Date(parseInt(applied, 10)).toLocaleDateString("fr-FR", {
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
    onSubmit: async (formValues) => {
      const success = await submitCandidature({
        formValues,
        setSendingState,
        LbaJob: item,
        caller,
      })
      if (success) {
        setApplied(Date.now().toString())
      }
    },
  })

  return (
    <Box my={4} width="100%" data-testid="CandidatureSpontanee">
      {!["ok_sent"].includes(sendingState) && hasAlreadySubmittedCandidature({ applied }) ? (
        <Container maxW="2xl">{getAPostuleMessage()}</Container>
      ) : (
        <form onSubmit={formik.handleSubmit}>
          {["not_sent", "currently_sending"].includes(sendingState) && (
            <CandidatureLbaModalBody formik={formik} sendingState={sendingState} company={item?.company?.name} item={item} kind={kind} fromWidget={true} />
          )}

          {["ok_sent"].includes(sendingState) && <CandidatureLbaWorked email={formik.values.email} company={item?.company?.name} />}

          {!["not_sent", "ok_sent", "currently_sending"].includes(sendingState) && <CandidatureLbaFailed sendingState={sendingState} />}
        </form>
      )}
    </Box>
  )
}

export default WidgetCandidatureLba
