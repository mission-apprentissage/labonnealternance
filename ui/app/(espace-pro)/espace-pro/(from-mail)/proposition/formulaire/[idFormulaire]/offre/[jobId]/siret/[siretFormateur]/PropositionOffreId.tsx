"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { IJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { useToast } from "@/app/hooks/useToast"
import { dayjs } from "@/common/dayjs"
import { RomeDetailReadOnly } from "@/components/DepotOffre/RomeDetailReadOnly"
import { LoadingEmptySpace } from "@/components/espace_pro"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { publicConfig } from "@/config.public"
import { getDelegationDetails, viewOffreDelegation } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const valueWithEllipsis = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  backgroundColor: "#F9F8F6",
  px: "8px",
  py: "2px",
  marginRight: fr.spacing("1w"),
  fontWeight: 700,
}

export function PropositionOffreId({ idFormulaire, jobId, siretFormateur, token }: { idFormulaire: string; jobId: string; siretFormateur: string; token: string }) {
  const { toast, ToastComponent } = useToast()

  const { isError, data: formulaire } = useQuery({
    queryKey: ["getFormulaire", idFormulaire, token],
    queryFn: () => getDelegationDetails(idFormulaire, token),
    enabled: Boolean(idFormulaire && token),
  })

  useQuery({
    queryKey: ["viewDelegation", jobId, siretFormateur, token],
    queryFn: () => viewOffreDelegation(jobId, siretFormateur, token),
    enabled: Boolean(jobId && siretFormateur && token),
  })

  if (isError) {
    throw new Error("Une erreur est survenue lors de la récupération des informations de l'entreprise.")
  }

  const job = (formulaire?.jobs as IJobJson[])?.find((job) => job._id === jobId)

  /**
   * @description Copy in clipboard.
   * @return {Promise<void>}
   */
  const copyInClipboard = () => {
    const jobUrl = PAGES.dynamic.jobDetail({ type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, jobId: job._id }).getPath()
    navigator.clipboard.writeText(`${publicConfig.baseUrl}${jobUrl}`)
    toast({
      title: "Lien copié.",
      status: "success",
      duration: 5000,
    })
  }

  if (!job) {
    return <LoadingEmptySpace />
  }

  const competencesRome = job.competences_rome ?? job?.rome_detail?.competences

  return (
    <DepotSimplifieStyling>
      {ToastComponent}
      <Box>
        <Typography component="h2" sx={{ fontSize: "32px", fontWeight: 700, mt: fr.spacing("4w"), mb: fr.spacing("3w") }}>
          Détails de la demande
        </Typography>
        <hr />
      </Box>
      <Box sx={{ backgroundColor: "#F2F2F9", mt: fr.spacing("5w"), p: fr.spacing("3w") }}>
        <Typography component="h3" sx={{ fontSize: "20px", fontWeight: 700 }}>
          Souhaitez-vous proposer des candidats à cette entreprise ?
        </Typography>
        <Typography sx={{ fontSize: "16px", mt: fr.spacing("5v") }}>
          Vous pouvez contacter directement l’entreprise pour évaluer son besoin, ou alors partager le lien vers l’offre à vos étudiants :
        </Typography>
        <Button
          style={{
            marginTop: fr.spacing("4v"),
          }}
          type="submit"
          priority="primary"
          onClick={copyInClipboard}
        >
          Copier l'url
        </Button>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: fr.spacing("5w"), my: fr.spacing("5w") }}>
        <Box>
          <Typography component="h2" sx={{ fontSize: "24px", mb: fr.spacing("5w"), fontWeight: 700 }}>
            Offre d’alternance
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("7v") }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Métier :</Typography>
              <Typography sx={{ ...valueWithEllipsis, maxWidth: "80%" }}>{job.rome_label}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Type de contrat :</Typography>
              <Typography sx={valueWithEllipsis}>{job.job_type.join(",")}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Niveau de formation : </Typography>
              <Typography sx={valueWithEllipsis}>{job.job_level_label}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Date de début :</Typography>
              <Typography sx={valueWithEllipsis}>{dayjs(job.job_start_date).format("DD/MM/YYYY")}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Durée du contrat :</Typography>
              <Typography sx={valueWithEllipsis}>{`${job.job_duration} mois`}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Nombre de postes :</Typography>
              <Typography sx={valueWithEllipsis}>{job.job_count}</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ border: "solid 1px #000091", p: fr.spacing("5w") }}>
          <Typography component="h2" sx={{ fontSize: "24px", mb: fr.spacing("5w"), fontWeight: 700 }}>
            Informations de contact
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("7v") }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Email :</Typography>
              <Typography sx={valueWithEllipsis}>{formulaire.email}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Téléphone :</Typography>
              <Typography sx={valueWithEllipsis}>{formulaire.phone}</Typography>
            </Box>
            <hr />
            <Typography component="h2" sx={{ fontSize: "24px", mb: fr.spacing("5w"), fontWeight: 700 }}>
              Informations légales
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>SIRET :</Typography>
              <Typography sx={valueWithEllipsis}>{formulaire.establishment_siret}</Typography>
            </Box>
            {formulaire.establishment_enseigne && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ mr: fr.spacing("3v") }}>Enseigne :</Typography>
                <Typography sx={valueWithEllipsis}>{formulaire.establishment_enseigne}</Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Raison sociale :</Typography>
              <Typography sx={valueWithEllipsis}>{formulaire.establishment_raison_sociale}</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Adresse :</Typography>
              <Typography sx={valueWithEllipsis}>{formulaire.address}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      {competencesRome && <RomeDetailReadOnly romeReferentiel={job.rome_detail} competences={competencesRome} appellation={job.rome_appellation_label} />}
    </DepotSimplifieStyling>
  )
}
