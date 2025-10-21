"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography, Link } from "@mui/material"
import Image from "next/image"
import React, { useEffect } from "react"
import { IJobJson, ILbaItemLbaJobJson, ILbaItemNaf } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { JobPostingSchema } from "@/components/ItemDetail/JobPostingSchema"
import { LbaJobEngagement } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagement"

import { DisplayContext } from "../../../context/DisplayContextProvider"
import { notifyJobDetailViewV3, notifyLbaJobDetailView } from "../../../utils/api"
import { SendPlausibleEvent } from "../../../utils/plausible"
import { formatDate } from "../../../utils/strutils"
import { getCompanySize } from "../ItemDetailServices/getCompanySize"
import ItemDistanceToCenter from "../ItemDetailServices/ItemDistanceToCenter"
import ItemGoogleSearchLink from "../ItemDetailServices/ItemGoogleSearchLink"
import ItemLocalisation from "../ItemDetailServices/ItemLocalisation"
import { BAD_DESCRIPTION_LENGTH, JobDescription } from "../ItemDetailServices/JobDescription"
import { ReportJobLink } from "../ReportJobLink"

import LbaJobAcces from "./LbaJobAcces"
import LbaJobCompetences from "./LbaJobCompetences"
import LbaJobQualites from "./LbaJobQualites"
import LbaJobTechniques from "./LbaJobTechniques"

const getContractTypes = (contractTypes: IJobJson["job_type"] | string) => {
  return contractTypes instanceof Array ? contractTypes.join(", ") : contractTypes
}

export const LbaJobDetail = ({ job, title }: { job: ILbaItemLbaJobJson; title: string }) => {
  useEffect(() => {
    SendPlausibleEvent("Affichage - Fiche emploi", { partner_label: job.ideaType, info_fiche: `${job?.job?.id}${formValues?.job?.label ? ` - ${formValues.job.label}` : ""}` })
    notifyLbaJobDetailView(job?.job?.id)
    notifyJobDetailViewV3(job)
  }, [job?.job?.id])

  const jobStartDate = job?.job?.jobStartDate ? formatDate(job.job.jobStartDate) : undefined

  const { formValues } = React.useContext(DisplayContext)

  const description = job?.job?.description
  const validCustomDescription = description && description.length > BAD_DESCRIPTION_LENGTH ? description : null
  const romeDescription = job?.job?.romeDetails?.definition

  return (
    <>
      <JobPostingSchema title={title} description={validCustomDescription || romeDescription || null} id={job?.job?.id} job={job} />
      <Box sx={{ pb: "0px", mt: fr.spacing("3w"), position: "relative", background: "white", padding: "16px 24px", maxWidth: "970px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Description de l&apos;offre
        </Typography>
        <Stack spacing={1} sx={{ p: 2, mb: fr.spacing("2w"), borderRadius: "8px", background: "#f6f6f6" }}>
          <div>
            <strong>Début du contrat le : </strong> {jobStartDate}
          </div>
          {job?.job?.dureeContrat && (
            <div>
              <strong>Durée du contrat : </strong> {job?.job?.dureeContrat}
            </div>
          )}
          <div>
            <strong>Nature du contrat : </strong> {getContractTypes(job?.job?.type)}
          </div>
          {job?.job?.quantiteContrat > 1 && (
            <div>
              <strong>Nombre de postes disponibles : </strong> {job?.job?.quantiteContrat}
            </div>
          )}
          {job?.job?.contract_rythm && (
            <div>
              <strong>Rythme de l'alternance : </strong> {job?.job?.contract_rythm}
            </div>
          )}
          <Stack direction="row" flexWrap="wrap">
            <strong>Niveau visé en fin d&apos;études : </strong>{" "}
            {job?.target_diploma_level ? (
              <Stack direction="row" flexWrap="wrap">
                {job?.target_diploma_level.split(", ").map(function (d, idx) {
                  return (
                    <Typography
                      component="span"
                      key={idx}
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
                      {d}
                    </Typography>
                  )
                })}
              </Stack>
            ) : (
              <Typography component="span" sx={{ ml: 2, mb: 1 }}>
                Indifférent
              </Typography>
            )}
          </Stack>
          {job?.company?.mandataire && (
            <Box sx={{ display: "flex", p: 2, background: "white", fontSize: "12px", alignItems: "center" }}>
              <Typography>
                Offre publiée par{" "}
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {job.company.name}
                </Typography>{" "}
                pour une entreprise partenaire du centre de formation.
              </Typography>
            </Box>
          )}
        </Stack>
        <Box sx={{ mb: fr.spacing("2w") }}>{job?.job?.elligibleHandicap && <LbaJobEngagement />}</Box>

        <JobDescription job={job} />
        <LbaJobQualites job={job} />

        <Box sx={{ mt: fr.spacing("2w") }}>
          <ReportJobLink
            itemId={job?.job?.id}
            type={LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}
            linkLabelNotReported="Signaler l'offre"
            linkLabelReported="Offre signalée"
            tooltip={
              <Box sx={{ p: 1 }}>
                <Typography sx={{ fontSize: "16px", lineHeight: "24px", fontWeight: "700", marginBottom: "8px", color: "#161616" }}>
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

      <Stack spacing={2} direction="row" alignItems="center" sx={{ my: fr.spacing("3w"), maxWidth: "970px", mx: { xs: 2, sm: 2, md: "auto" } }}>
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

      <Box sx={{ position: "relative", background: "white", padding: "16px 24px", maxWidth: "970px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>{`En savoir plus sur le métier ${job.title}`}</Typography>
        <Box data-testid="lbb-component">
          <Box sx={{ mb: 4 }}>
            <LbaJobCompetences job={job} />
            <LbaJobTechniques job={job} />
            <LbaJobAcces job={job} />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: fr.spacing("3w"), position: "relative", background: "white", padding: "16px 24px", maxWidth: "970px", mx: { xs: 0, md: "auto" } }}>
        <Typography variant="h4" sx={{ mb: 2, color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Quelques informations sur {job?.company?.mandataire ? "l'entreprise" : "l'établissement"}
        </Typography>

        <Typography sx={{ my: 3 }}>
          {job?.company?.mandataire
            ? "Le centre de formation peut vous renseigner sur l'entreprise."
            : "Renseignez-vous sur l'entreprise, ses activités et ses valeurs pour préparer votre candidature. Vous pouvez rechercher leur site internet et leur présence sur les réseaux sociaux."}
        </Typography>

        {!job?.company?.mandataire ? (
          <ItemLocalisation item={job} />
        ) : (
          <Typography sx={{ mt: 1 }}>
            <Typography component="span" sx={{ fontWeight: 700 }}>
              Localisation :{" "}
            </Typography>
            <Typography component="span">{job.place.city}</Typography>
            <br />
            <ItemDistanceToCenter item={job} />
          </Typography>
        )}

        <Typography sx={{ mt: 1 }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            Taille de l'entreprise :{" "}
          </Typography>
          <Typography component="span">{getCompanySize(job)}</Typography>
        </Typography>

        {(job.nafs as ILbaItemNaf[])[0]?.label && (
          <Typography sx={{ mt: 1 }}>
            <Typography component="span" sx={{ fontWeight: 700 }}>
              Secteur d'activité :{" "}
            </Typography>
            <Typography component="span">{(job.nafs as ILbaItemNaf[])[0].label}</Typography>
          </Typography>
        )}

        {!job?.company?.mandataire && job?.contact?.phone && (
          <Typography sx={{ mt: 1 }}>
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

        {!job?.company?.mandataire && <ItemGoogleSearchLink item={job} />}
      </Box>

      {job?.company?.mandataire && (
        <Box sx={{ pb: "0px", mt: 6, position: "relative", background: "white", padding: "16px 24px", maxWidth: "970px", mx: ["0", "30px", "30px", "auto"] }}>
          <Typography variant="h2" sx={{ mt: 2 }}>
            Contactez le CFA pour avoir plus d'informations
          </Typography>

          <Typography sx={{ my: 2 }}>Le centre de formation peut vous renseigner sur les formations qu'il propose.</Typography>
          <ItemLocalisation item={job} />

          {job?.contact?.phone && (
            <Stack direction="row" sx={{ mt: 2, mb: 4 }}>
              <Box sx={{ fontWeight: 700, pl: "2px", mr: 2 }}>Téléphone :</Box>
              <DsfrLink href={`tel:${job.contact.phone}`} aria-label="Contacter par téléphone - nouvelle fenêtre">
                {job.contact.phone}
              </DsfrLink>
            </Stack>
          )}

          <ItemGoogleSearchLink item={job} />
        </Box>
      )}
    </>
  )
}
