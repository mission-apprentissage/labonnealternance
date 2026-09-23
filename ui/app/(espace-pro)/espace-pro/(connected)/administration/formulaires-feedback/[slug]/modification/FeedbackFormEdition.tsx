"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { ZFeedbackFormFields } from "shared/models/feedback-form.model"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { FeedbackFormBuilder } from "../../_components/FeedbackFormBuilder"

export function FeedbackFormEdition({ slug }: { slug: string }) {
  const {
    data: form,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/admin/feedback-forms/:slug", slug],
    queryFn: () => apiGet("/admin/feedback-forms/:slug", { params: { slug } }),
    retry: false,
  })

  // Schéma de lecture et non de saisie : un chemin devenu invalide doit pouvoir être ouvert
  // puis corrigé, pas faire planter la page. La validation de saisie s'appliquera au submit.
  const initialValues = useMemo(
    () => (form ? ZFeedbackFormFields.parse({ slug: form.slug, title: form.title, trigger: form.trigger, questions: form.questions }) : undefined),
    [form]
  )

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  if (isError || !form) {
    return (
      <>
        <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.dynamic.backAdminFeedbackFormEdit({ slug })]} />
        <Alert severity="error" title="Formulaire introuvable" description="Ce formulaire n'existe pas ou a été supprimé." />
      </>
    )
  }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.dynamic.backAdminFeedbackFormEdit({ slug, title: form.title })]} />
      <Typography component="h1" className={fr.cx("fr-h3")} sx={{ mb: fr.spacing("4v") }}>
        Modifier {form.title}
      </Typography>
      <FeedbackFormBuilder mode="edit" initialValues={initialValues} />
    </>
  )
}
