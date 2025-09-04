import { Box } from "@mui/material"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { ILbaItem } from "@/app/(candidat)/recherche/_hooks/useRechercheResults"
import { LbaJobEngagementTag } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagementTag"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagFormation } from "@/components/ItemDetail/TagFormation"
import { TagFormationAssociee } from "@/components/ItemDetail/TagFormationAssociee"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { isCfaEntreprise } from "@/services/cfaEntreprise"

import TagCfaDEntreprise from "../TagCfaDEntreprise"

export function LbaItemTags({ item }: { item: ILbaItem }) {
  const { ideaType, company } = item
  const tags: React.ReactNode[] = []

  if (ideaType === LBA_ITEM_TYPE_OLD.LBA || ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    tags.push(<TagCandidatureSpontanee key="candidature spontanée" />)
  } else if (ideaType === LBA_ITEM_TYPE_OLD.FORMATION) {
    const isCfa = isCfaEntreprise(company?.siret, company?.headquarter?.siret)
    tags.push(isCfa ? <TagCfaDEntreprise key="cfa d entreprise" /> : <TagFormation key="formation" />)
  } else {
    tags.push(<TagOffreEmploi key="offre emploi" />)
  }
  if (company?.mandataire) {
    tags.push(<TagFormationAssociee />)
  }

  if ("company" in item && item?.company?.elligibleHandicap) {
    tags.push(<LbaJobEngagementTag key="job engagement" />)
  }

  return <Box sx={{ display: "flex", gap: "4px" }}>{tags}</Box>
}
