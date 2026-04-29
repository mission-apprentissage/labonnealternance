"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Stack, Typography } from "@mui/material"
import Image from "next/image"
import React, { useEffect } from "react"
import type { ILbaItemPartnerJobJson } from "shared"
import { ContratBlock } from "@/components/ItemDetail/ItemDetailServices/ContratBlock"
import { EmployeurPresentationBlock } from "@/components/ItemDetail/ItemDetailServices/EmployeurPresentationBlock"
import { JobAccordion } from "@/components/ItemDetail/ItemDetailServices/JobAccordion"
import { JobDescription } from "@/components/ItemDetail/ItemDetailServices/JobDescription"
import { JobPostingSchema } from "@/components/ItemDetail/JobPostingSchema"
import { DisplayContext } from "@/context/DisplayContextProvider"
import { notifyJobDetailViewV3 } from "@/utils/api"
import { SendPlausibleEvent } from "@/utils/plausible"

export const PartnerJobDetail = ({ job, title }: { job: ILbaItemPartnerJobJson; title: string }) => {
  const { formValues } = React.useContext(DisplayContext)

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche emploi", { partner_label: job.job.partner_label, info_fiche: `${job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}` })
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
        title={`Présentation de l'entreprise ${job?.company?.name ?? ""}`}
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

      <Stack spacing={2} direction="row" sx={{ alignItems: "center", my: fr.spacing("6v"), mx: { xs: 0, md: "auto" } }}>
        <Image src="/images/whisper.svg" alt="" aria-hidden={true} width={34} height={39} style={{ marginTop: "2px" }} />
        <Box>
          <Typography component="div" sx={{ fontWeight: 700, fontSize: "20px", color: "#3a3a3a" }}>
            Psst !
          </Typography>
          <Box sx={{ color: "grey.700" }}>
            Pour convaincre l'entreprise de vous embaucher,{" "}
            <Link href="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e" target="_blank" rel="noopener noreferrer" underline="always">
              on vous donne des conseils ici pour vous aider !
            </Link>
          </Box>
        </Box>
      </Stack>
    </>
  )
}
