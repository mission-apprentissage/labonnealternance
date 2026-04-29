"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Stack, Typography } from "@mui/material"
import Image from "next/image"
import React, { useEffect } from "react"
import type { ILbaItemPartnerJobJson } from "shared"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { ContratBlock } from "@/components/ItemDetail/ItemDetailServices/ContratBlock"
import { EmployeurPresentationBlock } from "@/components/ItemDetail/ItemDetailServices/EmployeurPresentationBlock"
import ItemGoogleSearchLink from "@/components/ItemDetail/ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "@/components/ItemDetail/ItemDetailServices/ItemLocalisation"
import { BAD_DESCRIPTION_LENGTH, JobDescription } from "@/components/ItemDetail/ItemDetailServices/JobDescription"
import { JobPostingSchema } from "@/components/ItemDetail/JobPostingSchema"
import { DisplayContext } from "@/context/DisplayContextProvider"
import { notifyJobDetailViewV3 } from "@/utils/api"
import { SendPlausibleEvent } from "@/utils/plausible"
import LbaJobAcces from "./LbaJobAcces"
import LbaJobCompetences from "./LbaJobCompetences"
import LbaJobQualites from "./LbaJobQualites"
import LbaJobTechniques from "./LbaJobTechniques"

export const LbaJobCfaDetail = ({ job, title }: { job: ILbaItemPartnerJobJson; title: string }) => {
  const { formValues } = React.useContext(DisplayContext)

  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche emploi", { partner_label: job.ideaType, info_fiche: `${job?.job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}` })
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
        <ContratBlock job={job} showMandataireInfo />
      </Box>

      <EmployeurPresentationBlock
        title="Présentation de l'entreprise"
        item={job}
        description="Le centre de formation peut vous renseigner sur l'entreprise."
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
        {job?.contact?.phone && (
          <Stack direction="row" sx={{ mt: fr.spacing("4v"), mb: fr.spacing("4v") }}>
            <Box sx={{ fontWeight: 700, mr: 2 }}>Téléphone :</Box>
            <DsfrLink href={`tel:${job.contact.phone}`} aria-label="Contacter par téléphone - nouvelle fenêtre">
              {job.contact.phone}
            </DsfrLink>
          </Stack>
        )}
        <ItemGoogleSearchLink item={job as any} />
      </Box>

      <Box sx={{ pb: "0px", mt: fr.spacing("6v"), position: "relative", background: "white", padding: "16px 24px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Description du métier
        </Typography>
        <JobDescription job={job} />
        <LbaJobQualites job={job} />
        <Box sx={{ mb: fr.spacing("8v") }}>
          <LbaJobCompetences job={job} />
          <LbaJobTechniques job={job} />
          <LbaJobAcces job={job} />
        </Box>
      </Box>

      <Stack spacing={2} direction="row" sx={{ alignItems: "center", my: fr.spacing("6v"), mx: { xs: 2, sm: 2, md: "auto" } }}>
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
