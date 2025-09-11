"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Typography } from "@mui/material"
import Image from "next/image"
import { useEffect, useState } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { cancelOffre, cancelPartnerJob, fillOffre, providedPartnerJob } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

const jobActions = {
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: {
    cancel: cancelOffre,
    provided: fillOffre,
  },
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]: {
    cancel: cancelPartnerJob,
    provided: providedPartnerJob,
  },
}

const homeEditorialH1 = {
  color: "#000091",
  fontSize: "32px",
  lineHeight: "40px",
  fontWeight: 700,
}
const homeEditorialH2 = {
  color: "#3A3A3A",
  fontSize: "28px",
  lineHeight: "36px",
  fontWeight: 700,
}

export function OffreActionPage({
  jobId,
  action: actionName,
  token,
  jobType,
}: {
  jobId: string
  action: "cancel" | "provided"
  token: string
  jobType: Exclude<LBA_ITEM_TYPE, LBA_ITEM_TYPE.FORMATION>
}) {
  const [result, setResult] = useState("")

  useEffect(() => {
    if (!jobId || !actionName || !jobType) return

    const action = jobActions[jobType]?.[actionName]
    if (action && typeof action === "function") {
      action(jobId, token)
        .then(() => setResult("ok"))
        .catch((error) => {
          console.error(error)
          setResult("Une erreur s'est produite. Merci de contacter le support de La bonne alternance")
          return
        })
    } else {
      setResult("Unsupported action.")
    }
  }, [jobId, actionName, jobType, token])

  const cssParameters = {
    background: "#fff1e5",
    borderRadius: "10px",
    fontWeight: 700,
    margin: "10px",
    marginTop: "32px",
    padding: "5px",
  }

  return (
    <Box margin="auto">
      {actionName === "cancel" && (
        <Typography component="h1" sx={homeEditorialH1}>
          Annulation de l'offre déposée sur La bonne alternance
        </Typography>
      )}
      {actionName === "provided" && (
        <Typography component="h1" sx={homeEditorialH1}>
          Modification de l'offre déposée sur La bonne alternance
        </Typography>
      )}

      {!result && <LoadingEmptySpace label="Chargement en cours..." />}
      {result && result !== "ok" && (
        <Box sx={{ display: "flex", alignItems: "center", color: "#4a4a4a", ...cssParameters }}>
          <Image width="32" style={{ marginRight: fr.spacing("1w") }} src="/images/icons/errorAlert.svg" alt="" />
          {result}
        </Box>
      )}
      {result && result === "ok" && (
        <Typography component="h2" sx={homeEditorialH2}>
          Votre offre a été modifiée
        </Typography>
      )}

      <Box sx={{ mt: fr.spacing("4w") }}>
        Aller sur le site{" "}
        <Link href={PAGES.static.home.getPath()} aria-label="Accès au site La bonne alternace" fontWeight={700}>
          La bonne alternance
        </Link>
        <br />
        <br />
        Se connecter à votre{" "}
        <Link href={PAGES.static.authentification.getPath()} aria-label="Accès à la page de connexion" fontWeight={700}>
          espace recruteur
        </Link>
        <br />
        <br />
        {jobId && (
          <>
            Voir{" "}
            <Link href={PAGES.dynamic.jobDetail({ type: jobType, jobId }).getPath()} aria-label="Visualiser l'offre en ligne" fontWeight={700}>
              l'offre
            </Link>{" "}
            sur le site La bonne alternance
          </>
        )}
      </Box>
    </Box>
  )
}
