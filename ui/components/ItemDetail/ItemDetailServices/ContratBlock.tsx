"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import { type IJobJson, type ILbaItemPartnerJobJson, JOB_START_TYPE } from "shared"
import { formatDate } from "@/utils/strutils"

const getDiplomaPills = (label: string): string[] => {
  const mainPart = label.includes("(") ? label.substring(0, label.indexOf("(")) : label
  return mainPart
    .split(", ")
    .map((s) => s.trim())
    .filter(Boolean)
}

const getContractTypes = (contractTypes: IJobJson["job_type"] | string) => {
  return contractTypes instanceof Array ? contractTypes.join(", ") : contractTypes
}

export const ContratBlock = ({ job, showMandataireInfo }: { job: ILbaItemPartnerJobJson; showMandataireInfo?: boolean }) => {
  const jobStartDate = job?.job?.jobStartDate ? formatDate(job.job.jobStartDate) : undefined
  const isUrgentRecruitment = job?.job?.startType === JOB_START_TYPE.DES_QUE_POSSIBLE
  const isFlexibleStartDate = Boolean(job?.job?.startDateFlexible)
  const contractStartLabel = isUrgentRecruitment ? "Démarrage dès que possible" : jobStartDate ? `${jobStartDate}${isFlexibleStartDate ? ", date flexible" : ""}` : undefined
  return (
    <Stack spacing={1} sx={{ mb: fr.spacing("4v") }}>
      {contractStartLabel && (
        <div>
          <strong>Date de début de contrat souhaitée :</strong> {contractStartLabel}
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
      {job?.job?.quantiteContrat > 1 && (
        <div>
          <strong>Nombre de postes disponibles : </strong> {job?.job?.quantiteContrat}
        </div>
      )}
      <Stack direction="row" sx={{ flexWrap: "wrap" }}>
        <strong>Niveau de formation visé en fin de contrat :</strong>{" "}
        {job?.target_diploma_level ? (
          <Stack direction="row" sx={{ flexWrap: "wrap" }}>
            {getDiplomaPills(job.target_diploma_level).map((pill, idx) => (
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
                {pill}
              </Typography>
            ))}
          </Stack>
        ) : (
          <Typography component="span" sx={{ ml: fr.spacing("2v"), mb: fr.spacing("2v") }}>
            Indifférent
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
