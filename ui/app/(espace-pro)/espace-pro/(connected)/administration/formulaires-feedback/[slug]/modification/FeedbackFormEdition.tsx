"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { withFeedbackTriggerType, ZFeedbackFormFields } from "shared/models/feedback-form.model"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { FeedbackFormBuilder } from "../../_components/FeedbackFormBuilder"
import { FeedbackFormLoadError } from "../../_components/FeedbackFormLoadError"
import { toNewFormFromAnswered } from "../../_utils/duplicateFeedbackForm"

export function FeedbackFormEdition({ slug }: { slug: string }) {
  const {
    data: form,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/admin/feedback-forms/:slug", slug],
    queryFn: () => apiGet("/admin/feedback-forms/:slug", { params: { slug } }),
    retry: false,
  })

  // Schéma de lecture et non de saisie : un chemin devenu invalide doit pouvoir être ouvert
  // puis corrigé, pas faire planter la page. La validation de saisie s'appliquera au submit.
  const initialValues = useMemo(() => {
    if (!form) return undefined
    const parsed = ZFeedbackFormFields.parse({ slug: form.slug, title: form.title, trigger: form.trigger, questions: form.questions })
    return { ...parsed, trigger: withFeedbackTriggerType(parsed.trigger) }
  }, [form])
  const hasResponses = (form?.responses_count ?? 0) > 0
  const newFormValues = useMemo(() => (form && hasResponses ? toNewFormFromAnswered(form) : undefined), [form, hasResponses])

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  if (isError || !form) {
    return (
      <>
        <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.dynamic.backAdminFeedbackFormEdit({ slug })]} />
        <FeedbackFormLoadError
          error={error}
          subject="ce formulaire"
          notFound={{ title: "Formulaire introuvable", description: "Ce formulaire n'existe pas ou a été supprimé." }}
          onRetry={() => refetch()}
        />
      </>
    )
  }

  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.static.backAdminFeedbackForms, PAGES.dynamic.backAdminFeedbackFormEdit({ slug, title: form.title })]} />
      <Typography component="h1" className={fr.cx("fr-h3")} sx={{ mb: fr.spacing("4v") }}>
        Modifier {form.title}
      </Typography>
      {hasResponses ? (
        <>
          {/* les réponses restent rattachées aux questions auxquelles les usagers ont répondu : l'original n'est jamais modifié */}
          <Alert
            severity="info"
            small
            className={fr.cx("fr-mb-4w")}
            description={`Ce formulaire a déjà ${form.responses_count.toLocaleString("fr-FR")} réponse${form.responses_count > 1 ? "s" : ""} : vos modifications seront enregistrées dans un nouveau formulaire, en brouillon, sous un autre slug. « ${form.title} » reste tel quel${form.status === "active" ? " et actif" : ""}.`}
          />
          <FeedbackFormBuilder mode="create" initialValues={newFormValues} keepSlug />
        </>
      ) : (
        <FeedbackFormBuilder mode="edit" initialValues={initialValues} />
      )}
    </>
  )
}
