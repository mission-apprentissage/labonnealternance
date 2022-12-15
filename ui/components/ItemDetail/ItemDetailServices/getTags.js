import { amongst } from "../../../utils/arrayutils"
import TagCandidatureSpontanee from "../TagCandidatureSpontanee"
import TagOffreEmploi from "../TagOffreEmploi"
import TagCfaDEntreprise from "../TagCfaDEntreprise"
import TagFormationAssociee from "../TagFormationAssociee"
import TagFormation from "../TagFormation"
import { Box } from "@chakra-ui/react"

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
