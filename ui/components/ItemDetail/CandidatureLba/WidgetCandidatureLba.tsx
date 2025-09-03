import { Box } from "@chakra-ui/react"
import { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

import { useDisclosure } from "@/common/hooks/useDisclosure"

import { CandidatureLbaModal } from "./CandidatureLbaModal"
import { useSubmitCandidature } from "./services/submitCandidature"

const WidgetCandidatureLba = ({ item, caller }: { item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson; caller: string }) => {
  const modalControls = useDisclosure()
  const submitControls = useSubmitCandidature(item, caller)

  return (
    <Box width="100%" height="100%">
      <CandidatureLbaModal item={item} modalControls={modalControls} submitControls={submitControls} fromWidget={true} />
    </Box>
  )
}

export default WidgetCandidatureLba
