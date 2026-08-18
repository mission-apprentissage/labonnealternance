"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Divider, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import NextImage from "next/image"
import type { IJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { RECRUITER_USER_ORIGIN } from "shared/constants/recruteur"
import { useToast } from "@/app/hooks/useToast"
import { dayjs } from "@/common/dayjs"
import { RomeDetailReadOnly } from "@/components/DepotOffre/RomeDetailReadOnly"
import { LoadingEmptySpace } from "@/components/espace_pro"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { publicConfig } from "@/config.public"
import { DownloadLine } from "@/theme/components/icons"
import { getDelegationDetails, viewOffreDelegation } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const valueWithEllipsis = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  backgroundColor: "#F9F8F6",
  px: "8px",
  py: "2px",
  marginRight: fr.spacing("2v"),
  fontWeight: 700,
}

export function PropositionOffreId({ idFormulaire, jobId, siretFormateur, token }: { idFormulaire: string; jobId: string; siretFormateur: string; token: string }) {
  const toast = useToast()

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
      autoHideDuration: 5000,
    })
  }

  const downloadQRCode = () => {
    const qrCodeUrl = `${publicConfig.baseUrl}${PAGES.dynamic.espaceProOffreImpression(job._id.toString()).getPath()}`
    window.open(qrCodeUrl, "_blank", "noopener,noreferrer")
  }

  if (!job) {
    return <LoadingEmptySpace />
  }

  const competencesRome = job.competences_rome ?? job?.rome_detail?.competences
  const jobOrigin = (formulaire.origin && RECRUITER_USER_ORIGIN[formulaire.origin]) || "La bonne alternance"

  return (
    <DepotSimplifieStyling>
      <Box>
        <Typography component="h1" sx={{ fontSize: "40px", lineHeight: "48px", fontWeight: 700, my: fr.spacing("6v") }}>
          Détails de la demande
        </Typography>
        <hr />
      </Box>
      <Box sx={{ backgroundColor: "#F2F2F9", p: fr.spacing("6v") }}>
        <Typography component="h3" sx={{ fontSize: "28px", lineHeight: "36px", fontWeight: 700 }}>
          Souhaitez-vous proposer des candidats à cette entreprise ?
        </Typography>
        <Typography sx={{ fontSize: "16px", mt: fr.spacing("5v") }}>
          Pour partager l’offre à vos alternants utilisez le lien à partager, ou le QR code que vous pouvez imprimer et afficher :
        </Typography>
        <Button
          style={{
            marginTop: fr.spacing("4v"),
            marginRight: fr.spacing("2v"),
          }}
          type="submit"
          priority="primary"
          onClick={copyInClipboard}
        >
          <NextImage src="/images/icons/copy.png" alt="" width={16} height={16} style={{ marginRight: fr.spacing("2v") }} />
          Copier le lien
        </Button>
        <Button
          style={{
            marginTop: fr.spacing("4v"),
          }}
          type="submit"
          priority="secondary"
          onClick={downloadQRCode}
          aria-label="Télécharger le QR code - ouvre une nouvelle fenêtre"
        >
          <DownloadLine sx={{ mr: fr.spacing("2v"), width: "0.75rem", height: "0.75rem" }} />
          Télécharger le QR code
        </Button>
      </Box>
      <Box sx={{ display: "flex", gap: fr.spacing("6v"), my: fr.spacing("8v"), flexDirection: { xs: "column", lg: "row" } }}>
        <Box sx={{ border: { xs: "none", lg: "1px solid #ddd" }, p: { xs: 0, lg: fr.spacing("6v") } }}>
          {job.job_employer_description && (
            <Box>
              <Typography sx={{ fontSize: "24px", mb: fr.spacing("6v"), fontWeight: 700 }}>Présentation de l’entreprise</Typography>
              <Typography sx={{ fontSize: "16px", mb: fr.spacing("6v") }}>{job.job_employer_description}</Typography>
              <hr />
            </Box>
          )}

          <Typography sx={{ fontSize: "24px", mb: fr.spacing("6v"), fontWeight: 700 }}>Contrat recherché</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v"), my: fr.spacing("6v") }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography sx={{ mr: fr.spacing("3v") }}>Métier :</Typography>
              <Typography sx={{ ...valueWithEllipsis, maxWidth: "80%" }}>{job.rome_appellation_label}</Typography>
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
          <hr />

          {competencesRome && <RomeDetailReadOnly romeReferentiel={job.rome_detail} competences={competencesRome} appellation={job.rome_appellation_label} />}
        </Box>
        <Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              p: fr.spacing("3v"),
              gap: fr.spacing("1v"),
              background: "#FFE9E6",
              color: "#3A3A3A",
              mb: fr.spacing("5v"),
            }}
          >
            <NextImage src="/images/icons/bulb.png" alt="" width={24} height={24} />
            <Box>
              Pour aider le recruteur à vous identifier, indiquez que vous le contactez suite à son dépôt d’offre sur le site <strong>{jobOrigin}</strong>.
            </Box>
          </Box>
          <Box sx={{ border: "solid 1px #000091", p: fr.spacing("6v") }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
              <Typography component="h4" sx={{ fontSize: "24px", lineHeight: "32px", fontWeight: 700, mb: fr.spacing("3v") }}>
                Informations de contact
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ mr: fr.spacing("3v") }}>Nom :</Typography>
                <Typography sx={valueWithEllipsis}>{formulaire.last_name}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ mr: fr.spacing("3v") }}>Prénom :</Typography>
                <Typography sx={valueWithEllipsis}>{formulaire.first_name}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ mr: fr.spacing("3v") }}>Email :</Typography>
                <Typography sx={valueWithEllipsis}>{formulaire.email}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography sx={{ mr: fr.spacing("3v") }}>Téléphone :</Typography>
                <Typography sx={valueWithEllipsis}>{formulaire.phone}</Typography>
              </Box>
              <Divider sx={{ mb: 0, p: 0, backgroundImage: "none" }} />
              <Typography component="h4" sx={{ fontSize: "24px", lineHeight: "32px", fontWeight: 700, mb: fr.spacing("3v") }}>
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
      </Box>
    </DepotSimplifieStyling>
  )
}
