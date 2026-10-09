"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { FocusedTitle } from "@/app/_components/FocusedTitle"
import ClotureRecrutementForm, { type IClotureRecrutementPayload } from "@/app/(espace-pro)/_components/ClotureRecrutementForm"
import { cancelOffre, cancelPartnerJob, fillOffre, providedPartnerJob } from "@/utils/api"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

// Pas d'action "cancel" pour les offres LBA (OFFRES_EMPLOI_LBA) : cf. isClotureForm.
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
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  // Pour les offres LBA, l'annulation passe par le formulaire "Clôturer votre recrutement" (motif obligatoire).
  const isClotureForm = actionName === "cancel" && jobType === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
  const action = isClotureForm ? undefined : jobActions[jobType]?.[actionName]

  const { data: offre } = useQuery({
    queryKey: ["offre-action-recap", jobType, jobId],
    queryFn: () => apiGet("/_private/jobs/:source/:id", { params: { source: jobType, id: jobId } }),
    enabled: Boolean(action),
    retry: false,
  })

  // Rien n'est exécuté au chargement : la messagerie peut précharger le lien, et un clic involontaire
  // ne doit pas suffire à clore l'offre (RGAA 11.12).
  const confirmAction = async () => {
    if (!action) return
    setIsPending(true)
    try {
      await action(jobId, token)
      setResult("ok")
    } catch (error) {
      console.error(error)
      setResult("Une erreur s'est produite. Merci de contacter le support de La bonne alternance")
    } finally {
      setIsPending(false)
    }
  }

  const cancelAction = () => router.push(PAGES.static.home.getPath())

  const submitCloture = async (id: string, payload: IClotureRecrutementPayload) => cancelOffre(id, token, payload)

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
          <FocusedTitle sx={homeEditorialH2}>
            {result === "already-closed" ? "Cette offre était déjà clôturée. Votre réponse a bien été enregistrée." : "Votre offre a été modifiée"}
          </FocusedTitle>
        ) : (
          <ClotureRecrutementForm
            offreId={jobId}
            onSuccess={(cloturationResult) => setResult(cloturationResult?.alreadyClosed ? "already-closed" : "ok")}
            onCancel={cancelAction}
            submit={submitCloture}
          />
        )
      ) : !action ? (
        <ErrorMessage>Cette action n'est pas prise en charge.</ErrorMessage>
      ) : result === "ok" ? (
        <FocusedTitle sx={homeEditorialH2}>Votre offre a été modifiée</FocusedTitle>
      ) : (
        <>
          {result && <ErrorMessage>{result}</ErrorMessage>}
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v"), mt: fr.spacing("6v") }}>
            {offre?.title && (
              <Typography>
                Offre :{" "}
                <Box component="strong" sx={{ fontWeight: 700 }}>
                  {offre.title}
                </Box>
                {offre.company?.name && ` - ${offre.company.name}`}
              </Typography>
            )}
            <Typography>
              {actionName === "provided" ? "Confirmez-vous que cette offre est pourvue ?" : "Confirmez-vous l'annulation de cette offre ?"} Elle ne sera plus visible des candidats
              et vous ne recevrez plus de candidatures.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("4v") }}>
              <Button type="button" priority="secondary" onClick={cancelAction}>
                Annuler
              </Button>
              <Button type="button" disabled={isPending} onClick={confirmAction}>
                Confirmer
              </Button>
            </Box>
          </Box>
        </>
      )}

      <Box component="ul" sx={{ mt: fr.spacing("8v"), mb: 0, p: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: fr.spacing("6v"), "& > li": { pb: 0 } }}>
        <li>
          Aller sur le site{" "}
          <Link
            href={PAGES.static.home.getPath()}
            sx={{
              fontWeight: 700,
            }}
          >
            La bonne alternance
          </Link>
        </li>
        <li>
          Se connecter à votre{" "}
          <Link
            href={PAGES.static.authentification.getPath()}
            sx={{
              fontWeight: 700,
            }}
          >
            espace recruteur
          </Link>
        </li>
        {jobId && (
          <li>
            Voir{" "}
            <Link
              href={PAGES.dynamic.jobDetail({ type: jobType, jobId }).getPath()}
              sx={{
                fontWeight: 700,
              }}
            >
              l'offre
            </Link>{" "}
            sur le site La bonne alternance
          </li>
        )}
      </Box>
    </Box>
  )
}

const ErrorMessage = ({ children }: { children: React.ReactNode }) => (
  <Box role="alert" sx={{ display: "flex", alignItems: "center", color: "#4a4a4a", background: "#fff1e5", borderRadius: "10px", fontWeight: 700, m: "10px", mt: "32px", p: "5px" }}>
    <Image width="32" height="32" style={{ marginRight: fr.spacing("2v") }} src="/images/icons/errorAlert.svg" alt="" />
    {children}
  </Box>
)
