import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"
import React, { useMemo } from "react"
import type { ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { isDisplayableDescription } from "@/components/ItemDetail/ItemDetailServices/job-description.utils"

// Sans titre : chaque fiche porte le sien dans un h4.
const DescriptionSection = ({ children }: { children: string }) => (
  <Typography sx={{ whiteSpace: "pre-wrap", mb: fr.spacing("4v") }} dangerouslySetInnerHTML={{ __html: children }} />
)

export const JobDescription = ({ job }: { job: ILbaItemPartnerJobJson | ILbaItemLbaJobJson }) => {
  const { description, partner_label } = job.job

  const isLbaOffer = partner_label === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
  const validCustomDescription = useMemo(() => (isDisplayableDescription(description, isLbaOffer) ? description : null), [description, isLbaOffer])

  if (!validCustomDescription) {
    return null
  }

  return <DescriptionSection>{validCustomDescription}</DescriptionSection>
}
