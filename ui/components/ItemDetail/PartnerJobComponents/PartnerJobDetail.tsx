"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography, Link } from "@mui/material"
import Image from "next/image"
import React, { useEffect } from "react"
import type { IJobJson, ILbaItemNaf, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { DisplayContext } from "@/context/DisplayContextProvider"
import { SendPlausibleEvent } from "@/utils/plausible"
import { formatDate } from "@/utils/strutils"
import { getCompanySize } from "@/components/ItemDetail/ItemDetailServices/getCompanySize"
import ItemDistanceToCenter from "@/components/ItemDetail/ItemDetailServices/ItemDistanceToCenter"
import ItemGoogleSearchLink from "@/components/ItemDetail/ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "@/components/ItemDetail/ItemDetailServices/ItemLocalisation"
import ItemWebsiteLink from "@/components/ItemDetail/ItemDetailServices/ItemWebsiteLink"
import { JobDescription } from "@/components/ItemDetail/ItemDetailServices/JobDescription"
import { ReportJobLink } from "@/components/ItemDetail/ReportJobLink"
import { notifyJobDetailViewV3 } from "@/utils/api"
import { LbaJobEngagement } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagement"
import { JobPostingSchema } from "@/components/ItemDetail/JobPostingSchema"
import { JobAccordion } from "@/components/ItemDetail/ItemDetailServices/JobAccordion"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

const getContractTypes = (contractTypes: IJobJson["job_type"] | string) => {
  return contractTypes instanceof Array ? contractTypes.join(", ") : contractTypes
}

export const PartnerJobDetail = ({ job, title }: { job: ILbaItemPartnerJobJson; title: string }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche emploi", { partner_label: job.job.partner_label, info_fiche: `${job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}` })
    notifyJobDetailViewV3(job)
  }, [job?.id])

  const jobStartDate = job?.job?.jobStartDate ? formatDate(job.job.jobStartDate) : undefined

  const { formValues } = React.useContext(DisplayContext)

  return (
    <>
      <JobPostingSchema title={title} description={job?.job?.description || null} id={job?.id} job={job} />
      <Box
        sx={{
          pb: 0,
          mt: fr.spacing("3w"),
          position: "relative",
          backgroundColor: "white",
          padding: "16px 24px",
          maxWidth: "970px",
          mx: { xs: 0, md: "auto" },
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Description de l&apos;offre
        </Typography>
        <Box sx={{ p: 2, mb: fr.spacing("2w"), borderRadius: "8px", backgroundColor: "#f6f6f6" }}>
          <Stack spacing={1}>
            {jobStartDate && (
              <Box>
                <strong>Début du contrat le : </strong> {jobStartDate}
              </Box>
            )}
            {job?.job?.dureeContrat && (
              <Box>
                <strong>Durée du contrat : </strong> {job?.job?.dureeContrat}
              </Box>
            )}
            {job?.job?.type?.length > 0 ? (
              <Box>
                <strong>Nature du contrat : </strong> {getContractTypes(job?.job?.type)}
              </Box>
            ) : null}

            {job?.target_diploma_level && (
              <Box>
                <strong>Niveau visé en fin d'études : </strong>{" "}
                <Typography
                  component="span"
                  sx={{
                    fontSize: "14px",
                    textAlign: "center",
                    color: "bluefrance.500",
                    background: "#e3e3fd",
                    py: 0.5,
                    px: 2,
                    borderRadius: "40px",
                    ml: 2,
                    mb: 1,
                  }}
                >
                  {job?.target_diploma_level}
                </Typography>
              </Box>
            )}

            {job?.job?.quantiteContrat > 1 && (
              <Box>
                <strong>Nombre de postes disponibles : </strong> {job?.job?.quantiteContrat}
              </Box>
            )}
          </Stack>
        </Box>

        <Box sx={{ mb: fr.spacing("2w") }}>{job?.job?.elligibleHandicap && <LbaJobEngagement />}</Box>

        <JobDescription job={job} />
        {job?.job?.offer_desired_skills?.length ? <JobAccordion title="Qualités souhaitées pour ce poste" items={job?.job?.offer_desired_skills} defaultExpanded={false} /> : null}

        <Box sx={{ mt: fr.spacing("2w") }}>
          <ReportJobLink
            itemId={job.id}
            type={LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES}
            linkLabelNotReported="Signaler l'offre"
            linkLabelReported="Offre signalée"
            tooltip={
              <Box sx={{ p: 1 }}>
                <Typography sx={{ fontSize: "16px", lineHeight: "24px", fontWeight: 700, marginBottom: "8px", color: "#161616" }}>
                  Cette offre vous semble inappropriée ? Voici les raisons pour lesquelles vous pouvez nous signaler une offre :
                </Typography>
                <ul>
                  <li>Offre offensante ou discriminatoire</li>
                  <li>Offre inexacte ou expirée</li>
                  <li>Fausse offre provenant d'un centre de formation</li>
                  <li>Tentative d'escroquerie</li>
                </ul>
              </Box>
            }
          />
        </Box>
      </Box>
      <Stack
        spacing={2}
        direction="row"
        sx={{
          alignItems: "center",
          my: fr.spacing("3w"),
          maxWidth: "970px",
          mx: { xs: 0, md: "auto" },
        }}
      >
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
      {Boolean(job?.job?.offer_to_be_acquired_skills?.length || job?.job?.offer_access_conditions?.length) && (
        <Box sx={{ pb: 0, position: "relative", backgroundColor: "white", padding: "16px 24px", maxWidth: "970px", mx: { xs: 0, md: "auto" } }}>
          <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>{`En savoir plus sur le métier ${job.title}`}</Typography>
          <Box data-testid="lbb-component">
            <Box sx={{ mb: 4 }}>
              {job?.job?.offer_to_be_acquired_skills?.length ? (
                <JobAccordion title="Compétences qui seront acquises durant l'alternance" items={job?.job?.offer_to_be_acquired_skills} defaultExpanded={false} />
              ) : null}
              {job?.job?.offer_access_conditions?.length ? (
                <JobAccordion title="À qui ce métier est-il accessible ?" items={job?.job?.offer_access_conditions} defaultExpanded={false} />
              ) : null}
            </Box>
          </Box>
        </Box>
      )}
      <Box
        sx={{
          pb: 0,
          mt: fr.spacing("3w"),
          position: "relative",
          backgroundColor: "white",
          padding: "16px 24px",
          maxWidth: "970px",
          mx: { xs: 0, md: "auto" },
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Quelques informations sur {job?.company?.mandataire ? "l'entreprise" : "l'établissement"}
        </Typography>

        <Stack spacing={1}>
          <Typography>
            {job?.company?.mandataire
              ? "Le centre de formation peut vous renseigner sur l'entreprise."
              : "Renseignez-vous sur l'entreprise, ses activités et ses valeurs pour préparer votre candidature. Vous pouvez rechercher leur site internet et leur présence sur les réseaux sociaux."}
          </Typography>

          {!job?.company?.mandataire ? (
            <ItemLocalisation item={job} />
          ) : (
            <Typography>
              <Typography component="span" sx={{ fontWeight: 700 }}>
                Localisation :{" "}
              </Typography>
              <Typography component="span">{job.place.city}</Typography>
              <br />
              <ItemDistanceToCenter item={job} />
            </Typography>
          )}

          <Typography>
            <Typography component="span" sx={{ fontWeight: 700 }}>
              Taille de l'entreprise :{" "}
            </Typography>
            <Typography component="span">{getCompanySize(job)}</Typography>
          </Typography>

          {(job.nafs as ILbaItemNaf[])[0]?.label && (
            <Typography>
              <Typography component="span" sx={{ fontWeight: 700 }}>
                Secteur d'activité :{" "}
              </Typography>
              <Typography component="span">{(job.nafs as ILbaItemNaf[])[0].label}</Typography>
            </Typography>
          )}

          {job?.contact?.phone && (
            <Typography>
              <Typography component="span" sx={{ fontWeight: 700 }}>
                Téléphone :{" "}
              </Typography>
              <Typography component="span">
                <DsfrLink href={`tel:${job.contact.phone}`} aria-label="Appeler la société au téléphone">
                  {job.contact.phone}
                </DsfrLink>
              </Typography>
            </Typography>
          )}
          <ItemWebsiteLink item={job} />
          <ItemGoogleSearchLink item={job} />
        </Stack>
      </Box>
    </>
  )
}
