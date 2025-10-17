import { fr } from "@codegouvfr/react-dsfr"
import { Typography, Box } from "@mui/material"
import React, { useMemo } from "react"
import { ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

export const BAD_DESCRIPTION_LENGTH = 50

const DescriptionSection = ({ title, children }: { title: string; children: string }) => (
  <Box>
    <Typography sx={{ fontWeight: 700, mb: fr.spacing("2w") }}>{title}</Typography>
    <Typography sx={{ mb: fr.spacing("2w") }}>{children}</Typography>
  </Box>
)

export const JobDescription = ({ job }: { job: ILbaItemPartnerJobJson | ILbaItemLbaJobJson }) => {
  const { description, employeurDescription, partner_label } = job.job

  const validCustomDescription = useMemo(() => (description && description.length > BAD_DESCRIPTION_LENGTH ? description : null), [description])

  const descriptionTitle = useMemo(() => `Description ${partner_label === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? "du métier" : "de l'offre"}`, [partner_label])

  if (!validCustomDescription && !employeurDescription) {
    return null
  }

  return (
    <>
      {validCustomDescription && <DescriptionSection title={descriptionTitle}>{validCustomDescription}</DescriptionSection>}
      {employeurDescription && <DescriptionSection title="Description de l'employeur">{employeurDescription}</DescriptionSection>}
    </>
  )
}
