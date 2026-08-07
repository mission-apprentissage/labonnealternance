"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Typography } from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import ClotureRecrutementForm, { type IClotureRecrutementPayload } from "@/app/(espace-pro)/_components/ClotureRecrutementForm"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { cancelOffre, cancelPartnerJob, fillOffre, providedPartnerJob } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"

// Note: l'action "cancel" pour les offres LBA (OFFRES_EMPLOI_LBA) n'est plus déclenchée automatiquement ici,
// elle passe désormais par le formulaire ClotureRecrutementForm (voir plus bas) qui recueille un motif obligatoire.
const jobActions = {
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: {
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
  const router = useRouter()

  // Pour les offres LBA, l'annulation passe par le formulaire "Clôturer votre recrutement" (motif obligatoire),
  // au lieu d'annuler silencieusement l'offre au chargement de la page.
  const isClotureForm = actionName === "cancel" && jobType === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA

  useEffect(() => {
    if (isClotureForm) {
      return
    }
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
  }, [jobId, actionName, jobType, token, isClotureForm])

  const submitCloture = async (id: string, payload: IClotureRecrutementPayload) => cancelOffre(id, token, payload)

  const cssParameters = {
    background: "#fff1e5",
    borderRadius: "10px",
    fontWeight: 700,
    margin: "10px",
    marginTop: "32px",
    padding: "5px",
  }

  return (
    <Box
      sx={{
        margin: "auto",
      }}
    >
      {actionName === "cancel" && !isClotureForm && (
        <Typography component="h1" sx={homeEditorialH1}>
          Annulation de l'offre déposée sur La bonne alternance
        </Typography>
      )}
      {actionName === "provided" && (
        <Typography component="h1" sx={homeEditorialH1}>
          Modification de l'offre déposée sur La bonne alternance
        </Typography>
      )}

      {isClotureForm ? (
        result === "ok" || result === "already-closed" ? (
          <Typography component="h2" sx={homeEditorialH2}>
            {result === "already-closed" ? "Cette offre était déjà clôturée. Votre réponse a bien été enregistrée." : "Votre offre a été modifiée"}
          </Typography>
        ) : (
          <ClotureRecrutementForm
            offreId={jobId}
            onSuccess={(cloturationResult) => setResult(cloturationResult?.alreadyClosed ? "already-closed" : "ok")}
            onCancel={() => router.push(PAGES.static.home.getPath())}
            submit={submitCloture}
          />
        )
      ) : (
        <>
          {!result && <LoadingEmptySpace label="Chargement en cours..." />}
          {result && result !== "ok" && (
            <Box sx={{ display: "flex", alignItems: "center", color: "#4a4a4a", ...cssParameters }}>
              <Image width="32" style={{ marginRight: fr.spacing("2v") }} src="/images/icons/errorAlert.svg" alt="" />
              {result}
            </Box>
          )}
          {result && result === "ok" && (
            <Typography component="h2" sx={homeEditorialH2}>
              Votre offre a été modifiée
            </Typography>
          )}
        </>
      )}

      <Box sx={{ mt: fr.spacing("8v") }}>
        Aller sur le site{" "}
        <Link
          href={PAGES.static.home.getPath()}
          aria-label="Accès au site La bonne alternace"
          sx={{
            fontWeight: 700,
          }}
        >
          La bonne alternance
        </Link>
        <br />
        <br />
        Se connecter à votre{" "}
        <Link
          href={PAGES.static.authentification.getPath()}
          aria-label="Accès à la page de connexion"
          sx={{
            fontWeight: 700,
          }}
        >
          espace recruteur
        </Link>
        <br />
        <br />
        {jobId && (
          <>
            Voir{" "}
            <Link
              href={PAGES.dynamic.jobDetail({ type: jobType, jobId }).getPath()}
              aria-label="Visualiser l'offre en ligne"
              sx={{
                fontWeight: 700,
              }}
            >
              l'offre
            </Link>{" "}
            sur le site La bonne alternance
          </>
        )}
      </Box>
    </Box>
  )
}
