import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { CustomTooltip } from "@/app/(espace-pro)/_components/CustomTooltip"
import { LbaJobEngagementTag } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagementTag"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagCfaDEntreprise } from "@/components/ItemDetail/TagCfaDEntreprise"
import { TagEcole } from "@/components/ItemDetail/TagEcole"
import { TagFormation } from "@/components/ItemDetail/TagFormation"
import { TagFormationAssociee } from "@/components/ItemDetail/TagFormationAssociee"
import { TagLaBonneAlternance } from "@/components/ItemDetail/TagLaBonneAlternance"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { TagPartenaire } from "@/components/ItemDetail/TagPartenaire"
import { isCfaEntreprise } from "@/services/cfaEntreprise"

export function LbaItemTags({ item, displayTooltips = false }: { item: Pick<ILbaItem, "ideaType" | "company" | "id">; displayTooltips?: boolean }) {
  const { ideaType, company } = item
  const tags: React.ReactNode[] = []

  if (ideaType === LBA_ITEM_TYPE_OLD.LBA || ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    const tag = displayTooltips ? (
      <CustomTooltip
        id={`candidature-spontanee-tag-${item.id}`}
        key="candidature spontanée"
        relativePosX={81}
        width={383}
        tooltipContent={
          <Typography sx={{ padding: fr.spacing("1w") }} fontSize="12px" lineHeight="21px">
            Cette entreprise recrute peut-être des alternants. <strong>Tentez votre chance en envoyant votre candidature spontanée !</strong>
          </Typography>
        }
      >
        <TagCandidatureSpontanee />
      </CustomTooltip>
    ) : (
      <TagCandidatureSpontanee key="candidature spontanée" />
    )
    tags.push(tag)
  } else if (ideaType === LBA_ITEM_TYPE_OLD.FORMATION) {
    const isCfa = isCfaEntreprise(company?.siret, company?.headquarter?.siret)
    tags.push(isCfa ? <TagCfaDEntreprise key="cfa d entreprise" /> : <TagFormation key="formation" />)
  } else {
    tags.push(<TagOffreEmploi key="offre emploi" />)
  }
  if (company?.mandataire) {
    tags.push(<TagEcole />)
    tags.push(<TagFormationAssociee />)
  } else if (ideaType === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    tags.push(<TagLaBonneAlternance />)
  } else if (ideaType === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    tags.push(<TagPartenaire />)
  }

  if ("company" in item && item?.company?.elligibleHandicap) {
    tags.push(<LbaJobEngagementTag key="job engagement" />)
  }

  return <Box sx={{ display: "flex", gap: "4px" }}>{tags}</Box>
}
