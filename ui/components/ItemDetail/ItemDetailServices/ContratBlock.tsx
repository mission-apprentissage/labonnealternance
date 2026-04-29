"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import type { IJobJson, ILbaItemPartnerJobJson } from "shared"
import { formatDate } from "@/utils/strutils"

const getContractTypes = (contractTypes: IJobJson["job_type"] | string) => {
  return contractTypes instanceof Array ? contractTypes.join(", ") : contractTypes
}

export const ContratBlock = ({ job, showMandataireInfo }: { job: ILbaItemPartnerJobJson; showMandataireInfo?: boolean }) => {
  const jobStartDate = job?.job?.jobStartDate ? formatDate(job.job.jobStartDate) : undefined
  return (
    <Stack spacing={1} sx={{ mb: fr.spacing("4v") }}>
      {jobStartDate && (
        <div>
          <strong>Début du contrat le : </strong> {jobStartDate}
        </div>
      )}
      {job?.job?.dureeContrat && (
        <div>
          <strong>Durée du contrat : </strong> {job?.job?.dureeContrat}
        </div>
      )}
      {job?.job?.type?.length > 0 ? (
        <Box>
          <strong>Nature du contrat : </strong> {getContractTypes(job?.job?.type)}
        </Box>
      ) : null}
      {job?.job?.contract_rythm && (
        <div>
          <strong>Rythme de l'alternance : </strong> {job?.job?.contract_rythm}
        </div>
      )}
      <Stack direction="row" sx={{ flexWrap: "wrap" }}>
        <strong>Niveau visé en fin d&apos;études : </strong>{" "}
        {job?.target_diploma_level ? (
          <Stack direction="row" sx={{ flexWrap: "wrap" }}>
            {job?.target_diploma_level.split(", ").map((d, idx) => (
              <Typography
                component="span"
                key={idx}
                sx={{
                  fontSize: "14px",
                  textAlign: "center",
                  color: fr.colors.decisions.text.actionHigh.blueFrance.default,
                  background: "#e3e3fd",
                  px: fr.spacing("4v"),
                  borderRadius: "40px",
                  ml: fr.spacing("2v"),
                  mb: fr.spacing("2v"),
                }}
              >
                {d}
              </Typography>
            ))}
          </Stack>
        ) : (
          <Typography component="span" sx={{ ml: fr.spacing("2v"), mb: fr.spacing("2v") }}>
            Indifférent
          </Typography>
        )}
      </Stack>
      {job?.job?.quantiteContrat > 1 && (
        <div>
          <strong>Nombre de postes disponibles : </strong> {job?.job?.quantiteContrat}
        </div>
      )}
      {showMandataireInfo && job?.company?.name && (
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
  )
}
