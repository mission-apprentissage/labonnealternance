"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { apiGet } from "@/utils/api.utils"

import { FeedbackFormBuilder } from "../_components/FeedbackFormBuilder"
import { toDuplicateFormInput } from "../_utils/duplicateFeedbackForm"

function Title() {
  return (
    <Typography component="h1" className={fr.cx("fr-h3")} sx={{ mb: fr.spacing("4v") }}>
      Créer un formulaire de feedback
    </Typography>
  )
}

/**
 * Création d'un formulaire, vierge ou dupliqué depuis `source` (quel que soit son statut, archivé
 * compris). La copie reprend le déclencheur et les questions, mais pas le slug : c'est lui qui
 * rattache les réponses des usagers à un formulaire, le nouveau brouillon part donc sans réponse.
 */
export function FeedbackFormCreation() {
  // ?source=<slug> : duplication d'un formulaire existant (voir PAGES.dynamic.backAdminFeedbackFormDuplication)
  const source = useSearchParams().get("source") || undefined
  const {
    data: sourceForm,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/admin/feedback-forms/:slug", source],
    queryFn: () => apiGet("/admin/feedback-forms/:slug", { params: { slug: source! } }),
    enabled: Boolean(source),
    retry: false,
  })

  const initialValues = useMemo(() => (source && sourceForm ? toDuplicateFormInput(sourceForm) : undefined), [source, sourceForm])

  if (!source) {
    return (
      <>
        <Title />
        <FeedbackFormBuilder mode="create" />
      </>
    )
  }

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  if (isError || !sourceForm) {
    return (
      <>
        <Title />
        <Alert severity="error" title="Formulaire à dupliquer introuvable" description="Ce formulaire n'existe pas ou a été supprimé." />
      </>
    )
  }

  return (
    <>
      <Title />
      <Typography sx={{ mb: fr.spacing("4v") }}>
        Copie de « {sourceForm.title} » : mêmes paramètres, sans ses réponses. Le nouveau formulaire sera enregistré en brouillon.
      </Typography>
      <FeedbackFormBuilder mode="create" initialValues={initialValues} />
    </>
  )
}
