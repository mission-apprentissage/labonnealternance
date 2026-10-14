"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import { type IJobJson, type ILbaItemPartnerJobJson, JOB_START_TYPE } from "shared"
import { formatDate } from "@/utils/strutils"
import { InlineField } from "./InlineField"

const getDiplomaPills = (label: string): string[] => {
  const parenIdx = label.indexOf("(")
  if (parenIdx === -1)
    return label
      .split(", ")
      .map((s) => s.trim())
      .filter(Boolean)
  const mainParts = label
    .substring(0, parenIdx)
    .split(", ")
    .map((s) => s.trim())
    .filter(Boolean)
  const parenContent = label.substring(parenIdx + 1, label.indexOf(")")).trim()
  return [...new Set(parenContent ? [...mainParts, parenContent] : mainParts)]
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
    <Stack component="dl" spacing={1} sx={{ mt: 0, mb: fr.spacing("4v"), p: 0 }}>
      {contractStartLabel && <InlineField label="Date de début de contrat souhaitée :">{contractStartLabel}</InlineField>}
      {job?.job?.dureeContrat && <InlineField label="Durée du contrat :">{job?.job?.dureeContrat}</InlineField>}
      {job?.job?.type?.length > 0 ? <InlineField label="Nature du contrat :">{getContractTypes(job?.job?.type)}</InlineField> : null}
      {job?.job?.contract_rythm && <InlineField label="Rythme de l'alternance :">{job?.job?.contract_rythm}</InlineField>}
      {job?.job?.quantiteContrat > 1 && <InlineField label="Nombre de postes disponibles :">{job?.job?.quantiteContrat}</InlineField>}
      <Stack direction="row" sx={{ flexWrap: "wrap" }}>
        <Box component="dt" sx={{ fontWeight: 700, p: 0 }}>
          Niveau de formation visé en fin de contrat :
        </Box>
        {job?.target_diploma_level ? (
          <Stack component="dd" direction="row" sx={{ flexWrap: "wrap", m: 0, p: 0 }}>
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
          <Typography component="dd" sx={{ ml: fr.spacing("2v"), mb: fr.spacing("2v"), p: 0 }}>
            Indifférent
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
