import { Box } from "@chakra-ui/react"

import { amongst } from "../../../utils/arrayutils"
import TagCandidatureSpontanee from "../TagCandidatureSpontanee"
import TagCfaDEntreprise from "../TagCfaDEntreprise"
import TagFormation from "../TagFormation"
import TagFormationAssociee from "../TagFormationAssociee"
import TagOffreEmploi from "../TagOffreEmploi"

export default function getTags({ kind, isCfa, isMandataire }) {
  return (
    <Box mb={4} mr="auto" textAlign="left">
      {kind === "formation" && <>{isCfa ? <TagCfaDEntreprise /> : <TagFormation />}</>}
      {amongst(kind, ["lbb", "lba"]) && <TagCandidatureSpontanee />}
      {amongst(kind, ["peJob", "matcha"]) && <TagOffreEmploi />}
      {amongst(kind, ["matcha"]) && isMandataire && <TagFormationAssociee isMandataire />}
    </Box>
  )
}
