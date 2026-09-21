"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useEffect } from "react"
import type { ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { ConseilsEntretienBlock } from "@/components/ItemDetail/ConseilsEntretienBlock"
import { ContratBlock } from "@/components/ItemDetail/ItemDetailServices/ContratBlock"
import { EmployeurPresentationBlock } from "@/components/ItemDetail/ItemDetailServices/EmployeurPresentationBlock"
import { JobAccordion } from "@/components/ItemDetail/ItemDetailServices/JobAccordion"
import { JobDescription } from "@/components/ItemDetail/ItemDetailServices/JobDescription"
import { JobPostingSchema } from "@/components/ItemDetail/JobPostingSchema"
import { notifyJobDetailViewV3, notifyLbaJobDetailView } from "@/utils/api"
import { SendPlausibleEvent } from "@/utils/plausible"

export const GeiqJobDetail = ({ job, title, jobSearchedByUser }: { job: ILbaItemPartnerJobJson; title: string; jobSearchedByUser: string | null }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche emploi", {
      partner_label: job.job.partner_label || job.ideaType,
      info_fiche: `${job?.id}${jobSearchedByUser ? ` - ${jobSearchedByUser}` : ""}`,
    })
    if (job.ideaType === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
      notifyLbaJobDetailView(job?.job?.id)
    }
    notifyJobDetailViewV3(job)
  }, [job?.id])

  return (
    <>
      <JobPostingSchema title={title} description={job?.job?.description || null} id={job?.id} job={job} />

      <Box sx={{ pb: 0, mt: fr.spacing("6v"), position: "relative", backgroundColor: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Contrat
        </Typography>
        <ContratBlock job={job} />
      </Box>

      <EmployeurPresentationBlock
        title="Quelques informations sur l'établissement"
        item={job}
        description={job?.job?.employeurDescription}
        showPhone
        showWebsite
        showGoogleSearch
      />

      <Box sx={{ pb: 0, mt: fr.spacing("6v"), position: "relative", backgroundColor: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Description de l&apos;offre
        </Typography>
        <JobDescription job={job} />
        {job?.job?.offer_desired_skills?.length ? <JobAccordion title="Qualités souhaitées pour ce métier" items={job?.job?.offer_desired_skills} defaultExpanded={false} /> : null}
        {job?.job?.offer_to_be_acquired_skills?.length ? (
          <JobAccordion title="Compétences qui seront acquises durant l'alternance" items={job?.job?.offer_to_be_acquired_skills} defaultExpanded={false} />
        ) : null}
      </Box>

      <ConseilsEntretienBlock />
    </>
  )
}
