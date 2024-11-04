import { Box, Container } from "@chakra-ui/react"
import { useFormik } from "formik"
import { useState } from "react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import ItemDetailApplicationsStatus, { hasApplied } from "../ItemDetailServices/ItemDetailApplicationStatus"

import CandidatureLbaFailed from "./CandidatureLbaFailed"
import CandidatureLbaModalBody from "./CandidatureLbaModalBody"
import CandidatureLbaWorked from "./CandidatureLbaWorked"
import { getInitialSchemaValues, getValidationSchema } from "./services/getSchema"
import { useSubmitCandidature } from "./services/submitCandidature"

const WidgetCandidatureLba = ({ item, caller }) => {
  const [sendingState, setSendingState] = useState("not_sent")
  const submitCandidature = useSubmitCandidature()
  const kind: LBA_ITEM_TYPE_OLD = item?.ideaType || ""

  const formik = useFormik({
    initialValues: getInitialSchemaValues(),
    validationSchema: getValidationSchema(),
    onSubmit: async (formValues) => {
      await submitCandidature({
        formValues,
        setSendingState,
        LbaJob: item,
        caller,
      })
    },
  })

  return (
    <Box my={4} width="100%" data-testid="CandidatureSpontanee">
      {["ok_sent"].includes(sendingState) && <CandidatureLbaWorked email={formik.values.email} company={item?.company?.name} />}
      {!["ok_sent"].includes(sendingState) && (
        <Container>
          <ItemDetailApplicationsStatus item={item} mt={12} />
        </Container>
      )}
      {!["ok_sent"].includes(sendingState) && !hasApplied(item) ? (
        <form onSubmit={formik.handleSubmit}>
          {["not_sent", "currently_sending"].includes(sendingState) && (
            <CandidatureLbaModalBody formik={formik} sendingState={sendingState} company={item?.company?.name} item={item} kind={kind} fromWidget={true} />
          )}
          {!["not_sent", "ok_sent", "currently_sending"].includes(sendingState) && <CandidatureLbaFailed sendingState={sendingState} />}
        </form>
      ) : (
        <></>
      )}
    </Box>
  )
}

export default WidgetCandidatureLba
