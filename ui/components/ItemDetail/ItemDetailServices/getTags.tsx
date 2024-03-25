import { Box } from "@chakra-ui/react"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import TagCandidatureSpontanee from "../TagCandidatureSpontanee"
import TagCfaDEntreprise from "../TagCfaDEntreprise"
import TagFormation from "../TagFormation"
import TagFormationAssociee from "../TagFormationAssociee"
import TagOffreEmploi from "../TagOffreEmploi"

export default function getTags({ kind, isCfa, isMandataire }) {
  return (
    <Box mb={4} mr="auto" textAlign="left">
      {kind === LBA_ITEM_TYPE_OLD.FORMATION && <>{isCfa ? <TagCfaDEntreprise /> : <TagFormation />}</>}
      {kind === LBA_ITEM_TYPE_OLD.LBA && <TagCandidatureSpontanee />}
      {[LBA_ITEM_TYPE_OLD.MATCHA, LBA_ITEM_TYPE_OLD.PEJOB].includes(kind) && <TagOffreEmploi />}
      {kind === LBA_ITEM_TYPE_OLD.MATCHA && isMandataire && <TagFormationAssociee isMandataire />}
    </Box>
  )
}
