import { Box } from "@chakra-ui/react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import TagCandidatureSpontanee from "../TagCandidatureSpontanee"
import TagCfaDEntreprise from "../TagCfaDEntreprise"
import TagFormation from "../TagFormation"
import TagFormationAssociee from "../TagFormationAssociee"
import TagOffreEmploi from "../TagOffreEmploi"

export default function getTags({ kind, isCfa, isMandataire }) {
  return (
    <Box mb={4} mr="auto" textAlign="left">
      {kind === LBA_ITEM_TYPE.FORMATION && <>{isCfa ? <TagCfaDEntreprise /> : <TagFormation />}</>}
      {kind === LBA_ITEM_TYPE.RECRUTEURS_LBA && <TagCandidatureSpontanee />}
      {[LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES].includes(kind) && <TagOffreEmploi />}
      {kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA && isMandataire && <TagFormationAssociee isMandataire />}
    </Box>
  )
}
