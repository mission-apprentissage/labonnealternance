import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useMutation, useQuery } from "@tanstack/react-query"
import React, { useState } from "react"
import { ApplicationIntention, ApplicationIntentionDefaultText } from "shared/constants/application"

import { IntensionPageNavigation } from "./IntensionPageNavigation"
import { IntentionPageForm } from "./IntentionPageForm"
import { IntensionPageResult } from "./IntensionPageResult"
import type { IntentionPageFormValues } from "./IntentionPageForm"
import { LoadingEmptySpace } from "@/components/espace_pro"
import { DsfrIcon } from "@/components/DsfrIcon"
import { MailCard } from "@/components/MailCard"
import { SuccessCircle } from "@/theme/components/icons"
import { cancelIntentionComment, getApplicationDataForIntention, sendIntentionComment } from "@/utils/api"

export type IntentionPageProps = {
  company_recruitment_intention: ApplicationIntention
  id: string
  token: string
}

const IntentionPageContent = ({ company_recruitment_intention, id, token, onCancel, onSentNow }: IntentionPageProps & { onCancel: () => void; onSentNow: () => void }) => {
  const [isEditing, setEditing] = useState(false)

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

  // const isRefusedState = company_recruitment_intention === ApplicationIntention.REFUS

  const error = getIntentionError ?? sendIntentionCommentMutation.error ?? cancelMutation.error

  if (isLoading) {
    return <LoadingEmptySpace />
  }
  if (error || !data) {
    return (
      <Box sx={{ width: "80%", maxWidth: "800px", margin: "auto", pt: fr.spacing("4v")0, display: "flex" }}>
        <Box sx={{ fontSize: "20px", margin: "auto" }}>{error?.message ?? "Une erreur technique s'est produite"}</Box>
      </Box>
    )
  }

  const { applicant_first_name, applicant_last_name, recruiter_email, recruiter_phone, company_name } = data
  const positiveNegative = company_recruitment_intention === ApplicationIntention.ENTRETIEN ? "positive" : "négative"

  return (
    <Box sx={{ maxWidth: "660px", margin: "auto" }}>
      <ValidationBanner>
        <strong>Réponse programmée ! Votre réponse {positiveNegative}</strong> sera <strong>automatiquement envoyée</strong> à 19h par email au candidat {applicant_first_name}{" "}
        {applicant_last_name}.
      </ValidationBanner>
      <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
        <Button
          style={{
            backgroundColor: "#E1000F",
            color: "#FFFFFF",
            border: "none",
            boxShadow: "none",
          }}
          priority="secondary"
          onClick={() => cancelMutation.mutate()}
        >
          <DsfrIcon name="fr-icon-error-warning-line" size={16} />
          Annuler l’envoi de ma réponse
        </Button>
      </Box>
      <Box sx={{ my: "24px" }}>
        <Typography fontSize="16px" lineHeight="24px" fontWeight={700}>
          Voici votre réponse {positiveNegative} à {applicant_first_name} {applicant_last_name} :
        </Typography>
        <Typography fontSize="12px" lineHeight="20px">
          {company_recruitment_intention === ApplicationIntention.ENTRETIEN ? (
            <>Le candidat recevra le message suivant ainsi que vos coordonnées par courriel. Vérifiez vos coordonnées, afin que le candidat puisse vous recontacter.</>
          ) : (
            <>Le candidat recevra le message suivant par courriel.</>
          )}
        </Typography>
      </Box>
      <MailCard
        title={
          <>
            <DsfrIcon name="fr-icon-mail-unread-fill" size={24} /> Objet : Réponse {positiveNegative} de l’entreprise {company_name}
          </>
        }
        isActive={isEditing}
      >
        {isEditing ? (
          <IntentionPageForm
            onCancel={() => setEditing(false)}
            onSubmit={(formValues) => sendIntentionCommentMutation.mutate(formValues)}
            email={recruiter_email}
            phone={recruiter_phone}
            company_recruitment_intention={company_recruitment_intention}
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Typography>
              “<span dangerouslySetInnerHTML={{ __html: ApplicationIntentionDefaultText[company_recruitment_intention].replaceAll("\r\n", "<br />") }} />”
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
            <Button style={{ alignSelf: "flex-end" }} priority="secondary" onClick={() => setEditing(true)}>
              <DsfrIcon name="fr-icon-edit-line" size={16} />
              Modifier ma réponse
            </Button>
          </Box>
        )}
      </MailCard>
    </Box>
  )
}

function ValidationBanner({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ px: "16px", py: "8px", backgroundColor: "#E1FEE8", color: "#18753C", width: "100%", display: "flex", gap: "10px" }}>
      <SuccessCircle style={{ marginTop: "2px" }} width="20px" fillHexaColor="#18753C" />
      <Typography>{children}</Typography>
    </Box>
  )
}

export function IntentionPage(props: IntentionPageProps) {
  const { company_recruitment_intention } = props
  const [displayMode, setDisplayMode] = useState<"form" | "canceled" | "sent_now">("form")

  return (
    <Box sx={{ marginBottom: "110px" }}>
      <IntensionPageNavigation />
      <Box sx={{ paddingTop: fr.spacing("5w") }}>
        {displayMode === "form" && <IntentionPageContent {...props} onCancel={() => setDisplayMode("canceled")} onSentNow={() => setDisplayMode("sent_now")} />}
        {displayMode === "canceled" && <IntensionPageResult intention={company_recruitment_intention} canceled={true} />}
        {displayMode === "sent_now" && <IntensionPageResult intention={company_recruitment_intention} />}
      </Box>
    </Box>
  )
}
