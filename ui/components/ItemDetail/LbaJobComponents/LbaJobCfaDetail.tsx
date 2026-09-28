"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import { useEffect } from "react"
import type { ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ConseilsEntretienBlock } from "@/components/ItemDetail/ConseilsEntretienBlock"
import { ContratBlock } from "@/components/ItemDetail/ItemDetailServices/ContratBlock"
import { EmployeurPresentationBlock } from "@/components/ItemDetail/ItemDetailServices/EmployeurPresentationBlock"
import ItemGoogleSearchLink from "@/components/ItemDetail/ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "@/components/ItemDetail/ItemDetailServices/ItemLocalisation"
import { JobDescription } from "@/components/ItemDetail/ItemDetailServices/JobDescription"
import { getRecruiterWrittenDescription } from "@/components/ItemDetail/ItemDetailServices/job-description.utils"
import { JobPostingSchema } from "@/components/ItemDetail/JobPostingSchema"
import { notifyJobDetailViewV3 } from "@/utils/api"
import { isOfferActive } from "@/utils/is-offer-active"
import { SendPlausibleEvent } from "@/utils/plausible"
import LbaJobAcces from "./LbaJobAcces"
import LbaJobCompetences from "./LbaJobCompetences"
import LbaJobQualites from "./LbaJobQualites"
import LbaJobTechniques from "./LbaJobTechniques"

export const LbaJobCfaDetail = ({ job, title, jobSearchedByUser }: { job: ILbaItemPartnerJobJson; title: string; jobSearchedByUser: string | null }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche emploi", { partner_label: job.ideaType, info_fiche: `${job?.job?.id}${jobSearchedByUser ? ` - ${jobSearchedByUser}` : ""}` })
    notifyJobDetailViewV3(job)
  }, [job?.job?.id])

  const description = job?.job?.description
  const romeDescription = job?.job?.romeDefinition
  const validCustomDescription = getRecruiterWrittenDescription(description, romeDescription, job?.job?.partner_label === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA)

  return (
    <>
      <JobPostingSchema title={title} description={validCustomDescription || romeDescription || null} id={job?.job?.id} job={job} />

      <Box sx={{ pb: "0px", mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Contrat
        </Typography>
        <ContratBlock job={job} showMandataireInfo />
      </Box>

      <EmployeurPresentationBlock
        title="Présentation de l'entreprise"
        item={job}
        description={job?.job?.employeurDescription}
        emptyStateText="Le centre de formation peut vous renseigner sur l'entreprise."
        cityOnly
        showPhone={false}
        showGoogleSearch={false}
      />

      <Box sx={{ pb: "0px", mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          L&apos;école en charge du recrutement
        </Typography>
        <Typography sx={{ my: fr.spacing("4v") }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            {job?.company?.name}
          </Typography>{" "}
          peut vous renseigner sur l&apos;offre.
        </Typography>
        <ItemLocalisation item={job as any} />
        {job?.contact?.phone && isOfferActive(job) && (
          <Stack direction="row" sx={{ mt: fr.spacing("4v"), mb: fr.spacing("4v") }}>
            <Box sx={{ fontWeight: 700, mr: 2 }}>Téléphone :</Box>
            <DsfrLink href={`tel:${job.contact.phone}`}>
              {job.contact.phone}
              <span className="fr-sr-only"> - appeler le CFA</span>
            </DsfrLink>
          </Stack>
        )}
        <ItemGoogleSearchLink item={job as any} />
      </Box>

      <Box sx={{ pb: "0px", mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Description
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
