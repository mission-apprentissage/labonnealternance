import { Box } from "@mui/material"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"

import { CandidatureLbaModal } from "./CandidatureLbaModal"
import { useSubmitCandidature } from "./services/submitCandidature"
import { useDisclosure } from "@/common/hooks/useDisclosure"

const WidgetCandidatureLba = ({ item, caller }: { item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson; caller: string }) => {
  const modalControls = useDisclosure()
  const submitControls = useSubmitCandidature(item, caller)

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <CandidatureLbaModal item={item} modalControls={modalControls} submitControls={submitControls} fromWidget={true} />
    </Box>
  )
}

export default WidgetCandidatureLba
