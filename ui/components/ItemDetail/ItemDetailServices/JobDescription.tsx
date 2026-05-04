import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import React, { useMemo } from "react"
import type { ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

export const BAD_DESCRIPTION_LENGTH = 50

const DescriptionSection = ({ title, children }: { title: string; children: string }) => (
  <Box>
    <Typography sx={{ fontWeight: 700, mb: fr.spacing("4v") }}>{title}</Typography>
    <Typography sx={{ whiteSpace: "pre-wrap", mb: fr.spacing("4v") }} dangerouslySetInnerHTML={{ __html: children }} />
  </Box>
)

export const JobDescription = ({ job }: { job: ILbaItemPartnerJobJson | ILbaItemLbaJobJson }) => {
  const { description, partner_label } = job.job

  const validCustomDescription = useMemo(() => (description && description.length > BAD_DESCRIPTION_LENGTH ? description : null), [description])

  const descriptionTitle = useMemo(() => `Description ${partner_label === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? "du métier" : "de l'offre"}`, [partner_label])

  if (!validCustomDescription) {
    return null
  }

  return <>{validCustomDescription && <DescriptionSection title={descriptionTitle}>{validCustomDescription}</DescriptionSection>}</>
}
