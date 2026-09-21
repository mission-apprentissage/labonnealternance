"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { useEffect } from "react"
import type { ILbaItemPartnerJobJson } from "shared"
import { ConseilsEntretienBlock } from "@/components/ItemDetail/ConseilsEntretienBlock"
import { ContratBlock } from "@/components/ItemDetail/ItemDetailServices/ContratBlock"
import { EmployeurPresentationBlock } from "@/components/ItemDetail/ItemDetailServices/EmployeurPresentationBlock"
import { BAD_DESCRIPTION_LENGTH, JobDescription } from "@/components/ItemDetail/ItemDetailServices/JobDescription"
import { JobPostingSchema } from "@/components/ItemDetail/JobPostingSchema"
import { notifyJobDetailViewV3 } from "@/utils/api"
import { SendPlausibleEvent } from "@/utils/plausible"
import LbaJobAcces from "./LbaJobAcces"
import LbaJobCompetences from "./LbaJobCompetences"
import LbaJobQualites from "./LbaJobQualites"
import LbaJobTechniques from "./LbaJobTechniques"

export const LbaJobDetail = ({ job, title, jobSearchedByUser }: { job: ILbaItemPartnerJobJson; title: string; jobSearchedByUser: string | null }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche emploi", { partner_label: job.ideaType, info_fiche: `${job?.job?.id}${jobSearchedByUser ? ` - ${jobSearchedByUser}` : ""}` })
    notifyJobDetailViewV3(job)
  }, [job?.job?.id])

  const description = job?.job?.description
  const validCustomDescription = description && description.length > BAD_DESCRIPTION_LENGTH ? description : null
  const romeDescription = job?.job?.romeDetails?.definition

  return (
    <>
      <JobPostingSchema title={title} description={validCustomDescription || romeDescription || null} id={job?.job?.id} job={job} />

      <Box sx={{ pb: "0px", mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Contrat
        </Typography>
        <ContratBlock job={job} />
      </Box>

      <EmployeurPresentationBlock
        title={`Présentation de l'entreprise ${job?.company?.name ?? ""}`}
        item={job}
        description={job?.job?.employeurDescription}
        showPhone
        showGoogleSearch
      />

      <Box sx={{ pb: "0px", mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Description du métier
        </Typography>
        <JobDescription job={job} />
        {/* description rédigée par le recruteur : elle remplace la fiche métier, on n'affiche pas les deux */}
        {!validCustomDescription && (
          <>
            <LbaJobQualites job={job} />
            <Box sx={{ mb: fr.spacing("8v") }}>
              <LbaJobCompetences job={job} />
              <LbaJobTechniques job={job} />
              <LbaJobAcces job={job} />
            </Box>
          </>
        )}
      </Box>

      <ConseilsEntretienBlock />
    </>
  )
}
