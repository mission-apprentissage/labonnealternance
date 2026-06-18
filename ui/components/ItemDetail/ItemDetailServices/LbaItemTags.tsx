import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { JOB_START_TYPE } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { isCfaEntreprise } from "shared/services/isCfaEntreprise"
import type { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { CustomTooltip } from "@/app/(espace-pro)/_components/CustomTooltip"
import { LbaJobEngagementTag } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagementTag"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagCfaDEntreprise } from "@/components/ItemDetail/TagCfaDEntreprise"
import { TagEmploiFormation } from "@/components/ItemDetail/TagEmploiFormation"
import { TagFormation } from "@/components/ItemDetail/TagFormation"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { TagRecrutementUrgent } from "@/components/ItemDetail/TagRecrutementUrgent"

export function LbaItemTags({
  item,
  displayTooltips = false,
}: {
  item: Pick<ILbaItem, "ideaType" | "company" | "id"> & { job?: { startType?: JOB_START_TYPE | null } }
  displayTooltips?: boolean
}) {
  const { ideaType, company } = item
  const tags: React.ReactNode[] = []
  const isUrgentRecruitment = "job" in item && item?.job?.startType === JOB_START_TYPE.DES_QUE_POSSIBLE

  if (ideaType === LBA_ITEM_TYPE_OLD.LBA || ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    const tag = displayTooltips ? (
      <CustomTooltip
        id={`candidature-spontanee-tag-${item.id}`}
        key="candidature spontanée"
        relativePosX={81}
        width={383}
        tooltipContent={
          <Typography
            sx={{
              fontSize: "12px",
              lineHeight: "21px",
              padding: fr.spacing("2v"),
            }}
          >
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
  } else if (company?.mandataire) {
    tags.push(<TagEmploiFormation key="tag emploi formation" />)
  } else {
    tags.push(<TagOffreEmploi key="offre emploi" />)
  }

  if ("company" in item && item?.company?.elligibleHandicap) {
    tags.push(<LbaJobEngagementTag key="job engagement" />)
  }

  if (isUrgentRecruitment) {
    tags.push(<TagRecrutementUrgent key="recrutement urgent" />)
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
      }}
    >
      {tags}
    </Box>
  )
}
