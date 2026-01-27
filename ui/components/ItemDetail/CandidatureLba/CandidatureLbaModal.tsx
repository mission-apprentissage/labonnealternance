import { useState } from "react"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

import CandidatureLbaFailed from "./CandidatureLbaFailed"
import { CandidatureLbaModalBody } from "./CandidatureLbaModalBody"
import CandidatureLbaWorked from "./CandidatureLbaWorked"
import type { IApplicationSchemaInitValues } from "./services/getSchema"
import type { useSubmitCandidature } from "./services/submitCandidature"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import type { useDisclosure } from "@/common/hooks/useDisclosure"

export const CandidatureLbaModal = ({
  item,
  modalControls,
  submitControls,
  fromWidget = false,
}: {
  item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
  modalControls: ReturnType<typeof useDisclosure>
  submitControls: ReturnType<typeof useSubmitCandidature>
  fromWidget?: boolean
}) => {
  const [applicantEmail, setApplicantEmail] = useState<string>("")
  const { isOpen, onClose: onModalClose } = modalControls
  const { handleSubmitCandidature, isDone, isSuccess, isError, error, isLoading } = submitControls
  const kind = item.ideaType

  const onSubmit = (formValues: IApplicationSchemaInitValues) => {
    setApplicantEmail(formValues.applicant_email)
    handleSubmitCandidature({ formValues })
  }

  const content = (
    <>
      {!isDone && (
        <CandidatureLbaModalBody fromWidget={fromWidget} isLoading={isLoading} company={item.company?.name} item={item} kind={kind} onSubmit={onSubmit} onClose={onModalClose} />
      )}
      {isSuccess && <CandidatureLbaWorked email={applicantEmail} item={item} />}
      {isError && <CandidatureLbaFailed error={error + ""} />}
    </>
  )

  return fromWidget ? (
    content
  ) : (
    <ModalReadOnly size="xl" isOpen={isOpen} onClose={onModalClose} hideCloseButton={isSuccess || isError ? false : true}>
      {content}
    </ModalReadOnly>
  )
}
