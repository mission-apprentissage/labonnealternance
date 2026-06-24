import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ApplicationIntention, ApplicationIntentionDefaultText } from "shared/constants/application"
import { DsfrIcon } from "@/components/DsfrIcon"
import { LoadingEmptySpace } from "@/components/espace_pro"
import { SuccessCircle } from "@/theme/components/icons"
import { cancelIntentionComment, getApplicationDataForIntention, sendIntentionComment } from "@/utils/api"
import { IntensionPageResult } from "./IntensionPageResult"
import type { IntentionPageFormValues } from "./IntentionPageForm"
import { IntentionPageForm } from "./IntentionPageForm"

export type IntentionPageProps = {
  company_recruitment_intention: ApplicationIntention
  id: string
  token: string
}

const cardSx = {
  backgroundColor: "white",
  borderRadius: "5px",
  border: "solid 1px #DDDDDD",
}

const cardTitleSx = {
  px: "24px",
  py: "12px",
  backgroundColor: "#F6F6F6",
  borderBottom: "solid 1px #DDDDDD",
  borderRadius: "5px 5px 0 0",
}

const cardBodySx = {
  px: "24px",
  py: "24px",
}

const IntentionPageContent = ({ company_recruitment_intention, id, token, onCancel, onSentNow }: IntentionPageProps & { onCancel: () => void; onSentNow: () => void }) => {
  const [isEditing, setEditing] = useState(false)
  const [formState, setFormState] = useState({ isValid: false, isSubmitting: false })

  const {
    data,
    error: getIntentionError,
    isLoading,
  } = useQuery({
    queryKey: ["getApplicationDataForIntention"],
    queryFn: () => getApplicationDataForIntention(id, company_recruitment_intention, token),
    retry: false,
  })

  const sendIntentionCommentMutation = useMutation({
    mutationKey: ["sendIntentionComment", id, token],
    mutationFn: (formValues: IntentionPageFormValues) => sendIntentionComment(id, token, { ...formValues, company_recruitment_intention }),
    onSuccess: () => {
      onSentNow()
    },
  })
  const cancelMutation = useMutation({
    mutationKey: ["cancelIntentionComment", id, token],
    mutationFn: () => cancelIntentionComment(id, token),
    onSuccess: () => {
      onCancel()
    },
  })

  const error = getIntentionError ?? sendIntentionCommentMutation.error ?? cancelMutation.error

  if (isLoading) {
    return <LoadingEmptySpace />
  }
  if (error || !data) {
    return (
      <Box sx={{ width: "80%", maxWidth: "800px", margin: "auto", pt: fr.spacing("5v"), display: "flex" }}>
        <Box sx={{ fontSize: "20px", margin: "auto" }}>{error?.message ?? "Une erreur technique s'est produite"}</Box>
      </Box>
    )
  }

  const { applicant_first_name, applicant_last_name, recruiter_email, recruiter_phone, company_name } = data
  const positiveNegative = company_recruitment_intention === ApplicationIntention.ENTRETIEN ? "positive" : "négative"

  return (
    <Box sx={{ maxWidth: "660px", margin: "auto" }}>
      <Box sx={{ my: fr.spacing("6v") }}>
        <Typography sx={{ fontSize: "16px", lineHeight: "24px", fontWeight: 700 }}>
          Voici votre réponse {positiveNegative} à {applicant_first_name} {applicant_last_name} :
        </Typography>
        <Typography sx={{ fontSize: "12px", lineHeight: "20px" }}>
          {company_recruitment_intention === ApplicationIntention.ENTRETIEN ? (
            <>Le candidat recevra le message suivant ainsi que vos coordonnées par courriel. Vérifiez vos coordonnées, afin que le candidat puisse vous recontacter.</>
          ) : (
            <>Le candidat recevra le message suivant par courriel.</>
          )}
        </Typography>
      </Box>

      {/* Card */}
      <Box sx={{ ...cardSx, ...(isEditing ? { borderColor: "#000091" } : {}) }}>
        {/* Card title */}
        <Box sx={{ ...cardTitleSx, ...(isEditing ? { backgroundColor: "#F5F5FE", color: "#000091", borderColor: "transparent" } : {}) }}>
          <DsfrIcon name="fr-icon-mail-unread-fill" size={24} /> Objet : Réponse {positiveNegative} de l'entreprise {company_name}
        </Box>

        {/* Card body */}
        <Box sx={cardBodySx}>
          {isEditing ? (
            <IntentionPageForm
              onSubmit={(formValues) => sendIntentionCommentMutation.mutate(formValues)}
              email={recruiter_email}
              phone={recruiter_phone}
              company_recruitment_intention={company_recruitment_intention}
              onStateChange={setFormState}
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <Typography>
                "<span dangerouslySetInnerHTML={{ __html: ApplicationIntentionDefaultText[company_recruitment_intention].replaceAll("\r\n", "<br />") }} />"
              </Typography>
              {company_recruitment_intention === ApplicationIntention.ENTRETIEN && (
                <>
                  <Typography>
                    Email :
                    <br />
                    <strong>{recruiter_email}</strong>
                  </Typography>
                  <Typography>
                    Téléphone :
                    <br />
                    <strong>{recruiter_phone}</strong>
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Buttons — outside the card border */}
      <Box sx={{ display: "flex", gap: fr.spacing("6v"), justifyContent: "flex-end", mt: fr.spacing("3v") }}>
        {isEditing ? (
          <>
            <Button priority="secondary" aria-label="Annuler les modifications" type="button" onClick={() => setEditing(false)} disabled={formState.isSubmitting}>
              <DsfrIcon name="fr-icon-arrow-go-back-line" size={16} />
              Annuler les modifications
            </Button>
            <Button
              aria-label="Envoyer le message au candidat"
              onClick={() => (document.getElementById("intention-form") as HTMLFormElement | null)?.requestSubmit()}
              disabled={!formState.isValid || formState.isSubmitting}
            >
              <DsfrIcon name="fr-icon-mail-send-line" size={16} />
              Envoyer le message
            </Button>
          </>
        ) : (
          <>
            <Button
              style={{ backgroundColor: "#E1000F", color: "#FFFFFF", border: "none", boxShadow: "none" }}
              priority="secondary"
              aria-label="Annuler l'envoi de ma réponse"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" })
                cancelMutation.mutate()
              }}
            >
              <DsfrIcon name="fr-icon-error-warning-line" size={16} />
              Annuler l'envoi
            </Button>
            <Button
              priority="secondary"
              onClick={() => {
                cancelIntentionComment(id, token).catch((_e) => null)
                setEditing(true)
                setTimeout(() => {
                  const el = document.getElementById("company_feedback")
                  el?.scrollIntoView({ behavior: "smooth", block: "center" })
                  el?.focus()
                }, 50)
              }}
            >
              <DsfrIcon name="fr-icon-edit-line" size={16} />
              Modifier ma réponse
            </Button>
          </>
        )}
      </Box>

      <Box sx={{ my: fr.spacing("6v"), px: fr.spacing("4v"), py: fr.spacing("2v"), backgroundColor: "#E1FEE8", color: "#18753C", width: "100%", display: "flex", gap: "10px" }}>
        <SuccessCircle style={{ marginTop: "2px" }} width="20px" fillHexaColor="#18753C" />
        <Typography>
          <strong>Réponse programmée ! Votre réponse {positiveNegative}</strong> sera <strong>automatiquement envoyée</strong> à 19h par email au candidat {applicant_first_name}{" "}
          {applicant_last_name}.
        </Typography>
      </Box>
    </Box>
  )
}

export function IntentionPage(props: IntentionPageProps) {
  const { company_recruitment_intention } = props
  const [displayMode, setDisplayMode] = useState<"form" | "canceled" | "sent_now">("form")

  return (
    <Box>
      {displayMode === "form" && <IntentionPageContent {...props} onCancel={() => setDisplayMode("canceled")} onSentNow={() => setDisplayMode("sent_now")} />}
      {displayMode === "canceled" && <IntensionPageResult intention={company_recruitment_intention} canceled={true} />}
      {displayMode === "sent_now" && <IntensionPageResult intention={company_recruitment_intention} />}
    </Box>
  )
}
