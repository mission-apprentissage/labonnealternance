import { useDisclosure } from "@chakra-ui/react"
import { useState } from "react"
import { ILbaItemLbaCompany, ILbaItemLbaJob, ILbaItemPartnerJob } from "shared"

import { ModalReadOnly } from "@/components/ModalReadOnly"

import CandidatureLbaFailed from "./CandidatureLbaFailed"
import { CandidatureLbaModalBody } from "./CandidatureLbaModalBody"
import CandidatureLbaWorked from "./CandidatureLbaWorked"
import { IApplicationSchemaInitValues } from "./services/getSchema"
import { useSubmitCandidature } from "./services/submitCandidature"

export const CandidatureLbaModal = ({
  item,
  modalControls,
  submitControls,
  fromWidget = false,
}: {
  item: ILbaItemLbaJob | ILbaItemLbaCompany | ILbaItemPartnerJob
  modalControls: ReturnType<typeof useDisclosure>
  submitControls: ReturnType<typeof useSubmitCandidature>
  fromWidget?: boolean
}) => {
  const [applicantEmail, setApplicantEmail] = useState<string>("")
  const { isOpen, onClose: onModalClose } = modalControls
  const { submitCandidature, isDone, isSuccess, isError, error, isLoading } = submitControls
  const kind = item.ideaType

  const onSubmit = (formValues: IApplicationSchemaInitValues) => {
    setApplicantEmail(formValues.applicant_email)
    submitCandidature({ formValues })
  }

  const content = (
    <>
      {!isDone && (
        <CandidatureLbaModalBody fromWidget={fromWidget} isLoading={isLoading} company={item.company?.name} item={item} kind={kind} onSubmit={onSubmit} onClose={onModalClose} />
      )}
      {isSuccess && <CandidatureLbaWorked email={applicantEmail} company={item.company?.name} />}
      {isError && <CandidatureLbaFailed error={error + ""} />}
    </>
  )

  return fromWidget ? (
    content
  ) : (
    <ModalReadOnly
      isOpen={isOpen}
      onClose={onModalClose}
      modalContentProps={{
        maxWidth: 1152,
      }}
      hideCloseButton={true}
    >
      {content}
    </ModalReadOnly>
  )
}
