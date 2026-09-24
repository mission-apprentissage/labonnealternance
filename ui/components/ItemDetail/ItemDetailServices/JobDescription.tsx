import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import React, { useMemo } from "react"
import type { ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { isDisplayableDescription } from "@/components/ItemDetail/ItemDetailServices/job-description.utils"

const DescriptionSection = ({ title, children }: { title: string; children: string }) => (
  <Box>
    <Typography sx={{ fontWeight: 700, mb: fr.spacing("4v") }}>{title}</Typography>
    <Typography sx={{ whiteSpace: "pre-wrap", mb: fr.spacing("4v") }} dangerouslySetInnerHTML={{ __html: children }} />
  </Box>
)

export const JobDescription = ({ job }: { job: ILbaItemPartnerJobJson | ILbaItemLbaJobJson }) => {
  const { description, partner_label } = job.job

  const isLbaOffer = partner_label === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
  const validCustomDescription = useMemo(() => (isDisplayableDescription(description, isLbaOffer) ? description : null), [description, isLbaOffer])

  const descriptionTitle = useMemo(() => `Description ${isLbaOffer ? "du métier" : "de l'offre"}`, [isLbaOffer])

  if (!validCustomDescription) {
    return null
  }

  return <>{validCustomDescription && <DescriptionSection title={descriptionTitle}>{validCustomDescription}</DescriptionSection>}</>
}
